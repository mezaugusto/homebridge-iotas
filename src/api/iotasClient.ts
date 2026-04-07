import type { Logging } from 'homebridge';

import type { AccountResponse, AuthResponse, Feature, Residency, Rooms } from '../types.js';
import { decodeJwtPayload } from './jwt.js';

const IOTAS_URL = 'https://api.iotashome.com/api/v1';
const AUTH_RETRY_DELAYS_MS = [60_000, 300_000, 600_000] as const;
const MAX_AUTH_RETRIES = AUTH_RETRY_DELAYS_MS.length;
const MAX_REQUEST_AUTH_RETRIES = 1;

const RELIABLE_UPDATE_ATTEMPTS = 3;
const RELIABLE_UPDATE_DELAY_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class IotasClient {
  private token: string | null = null;
  private refreshToken = '';
  private authenticateRequest: Promise<string> | null = null;
  private unitRequest: Promise<Rooms> | null = null;
  private unit = 0;

  constructor(
    private readonly log: Logging,
    private readonly username: string,
    private readonly password: string,
    private readonly unitName?: string,
  ) {}

  // #region Authentication & token lifecycle
  /**
   * Authenticate with the IOTAS API using username/password.
   * Uses bounded retry with progressive backoff.
   */
  private async authenticate(): Promise<string> {
    if (this.authenticateRequest !== null) {
      return this.authenticateRequest;
    }

    this.authenticateRequest = this.authenticateWithRetry();
    this.authenticateRequest.finally(() => {
      this.authenticateRequest = null;
    });

    return this.authenticateRequest;
  }

  private async authenticateWithRetry(): Promise<string> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= MAX_AUTH_RETRIES; attempt++) {
      try {
        const credentials = Buffer.from(`${this.username}:${this.password}`).toString('base64');
        const response = await fetch(`${IOTAS_URL}/auth/tokenwithrefresh`, {
          method: 'POST',
          headers: {
            Authorization: `Basic ${credentials}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({}),
        });

        if (!response.ok) {
          throw new Error(`Authentication failed: ${response.status} ${response.statusText}`);
        }

        const data = (await response.json()) as AuthResponse;
        this.refreshToken = data.refresh;
        this.token = data.jwt;
        return this.token;
      } catch (error) {
        lastError = error;

        if (attempt >= MAX_AUTH_RETRIES) {
          break;
        }

        const delayMs = AUTH_RETRY_DELAYS_MS[attempt];
        this.log.error('Authentication error:', error);
        this.log.warn(
          `Authentication retry ${attempt + 1}/${MAX_AUTH_RETRIES} scheduled in ${Math.round(delayMs / 1000)} seconds.`,
        );
        await sleep(delayMs);
      }
    }

    throw new Error(`Authentication failed after ${MAX_AUTH_RETRIES + 1} attempts: ${String(lastError)}`);
  }

  /**
   * Refresh the access token using the refresh token.
   */
  private async refreshAccessToken(): Promise<string> {
    if (this.authenticateRequest !== null) {
      return this.authenticateRequest;
    }

    this.authenticateRequest = (async () => {
      try {
        const response = await fetch(`${IOTAS_URL}/auth/refresh`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            refresh: this.refreshToken,
            email: this.username,
          }),
        });

        if (!response.ok) {
          throw new Error(`Token refresh failed: ${response.status}`);
        }

        const data = (await response.json()) as { jwt: string };
        this.token = data.jwt;
        return this.token;
      } catch (error) {
        this.log.error('Token refresh error:', error);
        // Fall back to full authentication
        return this.authenticate();
      }
    })();

    this.authenticateRequest.finally(() => {
      this.authenticateRequest = null;
    });

    return this.authenticateRequest;
  }

  /**
   * Get a valid token, refreshing if necessary.
   */
  private async getToken(): Promise<string> {
    if (this.token === null) {
      return this.authenticate();
    }

    try {
      const decoded = decodeJwtPayload(this.token);
      const now = Date.now() / 1000;
      if (decoded.exp < now) {
        // Token expired — try refresh first, falls back to full auth
        return this.refreshAccessToken();
      }
      return this.token;
    } catch {
      return this.authenticate();
    }
  }
  // #endregion

  // #region Transport
  /**
   * Make an authenticated request to the IOTAS API.
   */
  private async request<T>(path: string, options: RequestInit = {}, authRetryCount = 0): Promise<T> {
    const token = await this.getToken();

    const response = await fetch(`${IOTAS_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      if (authRetryCount >= MAX_REQUEST_AUTH_RETRIES) {
        throw new Error('API request failed: unauthorized after token refresh retry');
      }

      this.token = null;
      // Retry once with a fresh token.
      return this.request(path, options, authRetryCount + 1);
    }

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    // Handle empty responses (e.g., from PUT/DELETE requests)
    const text = await response.text();
    if (!text) {
      return undefined as T;
    }
    return JSON.parse(text) as T;
  }
  // #endregion

  // #region Unit resolution / cache
  /**
   * Initialize the client by resolving the unit ID.
   */
  async initialize(): Promise<void> {
    if (this.unit !== 0) {
      return;
    }

    const account = await this.request<AccountResponse>('/account/me');
    this.log.info('Found account id', account.id);

    const residencies = await this.request<Residency[]>(`/account/${account.id}/residency`);

    if (residencies.length === 0) {
      this.log.error('Unable to find any units. Abandoning...');
      throw new Error('Unable to find any units');
    }

    this.log.info('Found unit(s):', residencies.map((r) => r.unitName).join(', '));

    if (this.unitName) {
      const customUnit = residencies.find((r) => r.unitName === this.unitName);
      if (customUnit) {
        this.unit = customUnit.unit;
        this.log.info('Using custom unit:', this.unitName);
        return;
      }
      this.log.warn('Could not find unit', this.unitName, ', using default');
    }

    this.unit = residencies[0].unit;
    this.log.info(
      'Using first unit found:',
      residencies[0].unitName,
      '. If you would like to use a custom unit, please set the "unit" property in the config.',
    );
  }

  /**
   * Get all rooms and devices for the current unit.
   */
  async getRooms(): Promise<Rooms> {
    await this.initialize();

    if (this.unitRequest !== null) {
      return this.unitRequest;
    }

    this.unitRequest = this.request<Rooms>(`/unit/${this.unit}/rooms`);
    this.unitRequest.finally(() => {
      this.unitRequest = null;
    });

    return this.unitRequest;
  }
  // #endregion

  // #region Feature operations
  /**
   * Get a specific feature by ID.
   */
  async getFeature(featureId: string): Promise<Feature | null> {
    const rooms = await this.getRooms();

    for (const room of rooms) {
      for (const device of room.devices) {
        for (const feature of device.features) {
          if (feature.id.toString() === featureId) {
            return feature;
          }
        }
      }
    }

    return null;
  }

  /**
   * Update a feature value.
   */
  async updateFeature(featureId: string, value: number): Promise<void> {
    await this.request(`/feature/${featureId}/value`, {
      method: 'PUT',
      body: JSON.stringify({ value }),
    });
  }

  /**
   * Send redundant feature updates to improve delivery reliability for known device quirks.
   */
  async updateFeatureReliable(featureId: string, value: number): Promise<void> {
    for (let attempt = 0; attempt < RELIABLE_UPDATE_ATTEMPTS; attempt++) {
      await this.updateFeature(featureId, value);
      if (attempt < RELIABLE_UPDATE_ATTEMPTS - 1) {
        await sleep(RELIABLE_UPDATE_DELAY_MS);
      }
    }
  }
  // #endregion
}
