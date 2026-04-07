import { describe, it, beforeEach, afterEach, mock } from 'node:test';
import assert from 'node:assert';
import type { Logging } from 'homebridge';

// Mock fetch globally
const mockFetch = mock.fn<typeof fetch>();
globalThis.fetch = mockFetch as typeof fetch;

// Import after mocking
const { IotasClient } = await import('../src/api/iotasClient.js');

describe('IotasClient', () => {
  let client: InstanceType<typeof IotasClient>;
  let mockLog: Logging;

  const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.signature';

  beforeEach(() => {
    mockLog = {
      info: mock.fn(),
      warn: mock.fn(),
      error: mock.fn(),
      debug: mock.fn(),
    } as unknown as Logging;

    client = new IotasClient(mockLog, 'test@example.com', 'password123', undefined);
    mockFetch.mock.resetCalls();
  });

  afterEach(() => {
    mockFetch.mock.resetCalls();
  });

  describe('authentication', () => {
    it('should authenticate with correct credentials', async () => {
      let callIndex = 0;
      mockFetch.mock.mockImplementation(async () => {
        callIndex++;
        if (callIndex === 1) {
          return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
        } else if (callIndex === 2) {
          return new Response(JSON.stringify({ id: 123, email: 'test@example.com' }), { status: 200 });
        } else if (callIndex === 3) {
          return new Response(JSON.stringify([{ unit: 1, unitName: 'Unit 1' }]), { status: 200 });
        } else {
          return new Response(JSON.stringify([{ id: 1, name: 'Living Room', devices: [] }]), { status: 200 });
        }
      });

      const rooms = await client.getRooms();

      assert.strictEqual(mockFetch.mock.callCount(), 4);
      assert.strictEqual(rooms.length, 1);
      assert.strictEqual(rooms[0].name, 'Living Room');
    });

    it('should use Basic auth for initial authentication', async () => {
      let callIndex = 0;
      mockFetch.mock.mockImplementation(async () => {
        callIndex++;
        if (callIndex === 1) {
          return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
        } else if (callIndex === 2) {
          return new Response(JSON.stringify({ id: 123 }), { status: 200 });
        } else if (callIndex === 3) {
          return new Response(JSON.stringify([{ unit: 1, unitName: 'Unit 1' }]), { status: 200 });
        } else {
          return new Response(JSON.stringify([]), { status: 200 });
        }
      });

      await client.getRooms();

      const firstCall = mockFetch.mock.calls[0];
      const url = firstCall.arguments[0] as string;
      const options = firstCall.arguments[1] as RequestInit;
      assert.ok(url.includes('/auth/tokenwithrefresh'));
      assert.ok((options.headers as Record<string, string>).Authorization.startsWith('Basic '));
    });
  });

  describe('unit resolution', () => {
    it('should use custom unit when specified', async () => {
      const clientWithUnit = new IotasClient(mockLog, 'test@example.com', 'password123', 'Custom Unit');

      let callIndex = 0;
      mockFetch.mock.mockImplementation(async () => {
        callIndex++;
        if (callIndex === 1) {
          return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
        } else if (callIndex === 2) {
          return new Response(JSON.stringify({ id: 123 }), { status: 200 });
        } else if (callIndex === 3) {
          return new Response(
            JSON.stringify([
              { unit: 1, unitName: 'Unit 1' },
              { unit: 2, unitName: 'Custom Unit' },
            ]),
            { status: 200 },
          );
        } else {
          return new Response(JSON.stringify([]), { status: 200 });
        }
      });

      await clientWithUnit.getRooms();

      const infoMock = mockLog.info as unknown as ReturnType<typeof mock.fn>;
      assert.ok(
        infoMock.mock.calls.some(
          (call) => call.arguments[0] === 'Using custom unit:' && call.arguments[1] === 'Custom Unit',
        ),
      );
    });

    it('should fall back to first unit when custom unit not found', async () => {
      const clientWithUnit = new IotasClient(mockLog, 'test@example.com', 'password123', 'Nonexistent');

      let callIndex = 0;
      mockFetch.mock.mockImplementation(async () => {
        callIndex++;
        if (callIndex === 1) {
          return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
        } else if (callIndex === 2) {
          return new Response(JSON.stringify({ id: 123 }), { status: 200 });
        } else if (callIndex === 3) {
          return new Response(JSON.stringify([{ unit: 1, unitName: 'Unit 1' }]), { status: 200 });
        } else {
          return new Response(JSON.stringify([]), { status: 200 });
        }
      });

      await clientWithUnit.getRooms();

      const warnMock = mockLog.warn as unknown as ReturnType<typeof mock.fn>;
      assert.ok(
        warnMock.mock.calls.some(
          (call) => call.arguments[0] === 'Could not find unit' && call.arguments[1] === 'Nonexistent',
        ),
      );
    });
  });

  describe('getFeature', () => {
    it('should find feature by ID', async () => {
      let callIndex = 0;
      mockFetch.mock.mockImplementation(async () => {
        callIndex++;
        if (callIndex === 1) {
          return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
        } else if (callIndex === 2) {
          return new Response(JSON.stringify({ id: 123 }), { status: 200 });
        } else if (callIndex === 3) {
          return new Response(JSON.stringify([{ unit: 1, unitName: 'Unit 1' }]), { status: 200 });
        } else {
          return new Response(
            JSON.stringify([
              {
                id: 1,
                name: 'Living Room',
                devices: [
                  {
                    id: 10,
                    features: [
                      { id: 100, value: 1, eventTypeName: 'OnOff' },
                      { id: 101, value: 72, eventTypeName: 'Temperature' },
                    ],
                  },
                ],
              },
            ]),
            { status: 200 },
          );
        }
      });

      const feature = await client.getFeature('101');
      assert.ok(feature !== null);
      assert.strictEqual(feature.value, 72);
    });

    it('should return null when feature is not found', async () => {
      let callIndex = 0;
      mockFetch.mock.mockImplementation(async () => {
        callIndex++;
        if (callIndex === 1) {
          return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
        } else if (callIndex === 2) {
          return new Response(JSON.stringify({ id: 123 }), { status: 200 });
        } else if (callIndex === 3) {
          return new Response(JSON.stringify([{ unit: 1, unitName: 'Unit 1' }]), { status: 200 });
        } else {
          return new Response(JSON.stringify([{ id: 1, name: 'Living Room', devices: [] }]), { status: 200 });
        }
      });

      const feature = await client.getFeature('999');
      assert.strictEqual(feature, null);
    });
  });

  describe('updateFeature', () => {
    it('should make PUT request with correct body', async () => {
      let callIndex = 0;
      mockFetch.mock.mockImplementation(async () => {
        callIndex++;
        if (callIndex === 1) {
          return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
        } else {
          return new Response(JSON.stringify({}), { status: 200 });
        }
      });

      await client.updateFeature('100', 1);

      const putCall = mockFetch.mock.calls[1];
      const url = putCall.arguments[0] as string;
      const options = putCall.arguments[1] as RequestInit;
      assert.ok(url.includes('/feature/100/value'));
      assert.strictEqual(options.method, 'PUT');
      assert.deepStrictEqual(JSON.parse(options.body as string), { value: 1 });
    });

    it('should handle empty response body (HTTP 202)', async () => {
      let callIndex = 0;
      mockFetch.mock.mockImplementation(async () => {
        callIndex++;
        if (callIndex === 1) {
          return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
        } else {
          // Simulate real API: 202 Accepted with empty body
          return new Response('', { status: 202, headers: { 'Content-Length': '0' } });
        }
      });

      // Should not throw "Unexpected end of JSON input"
      await assert.doesNotReject(async () => {
        await client.updateFeature('100', 0.5);
      });
    });
  });

  describe('updateFeatureReliable', () => {
    it('should send redundant updates for Z-Wave reliability', async () => {
      let callIndex = 0;
      mockFetch.mock.mockImplementation(async () => {
        callIndex++;
        if (callIndex === 1) {
          return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
        } else {
          return new Response(JSON.stringify({}), { status: 200 });
        }
      });

      await client.updateFeatureReliable('100', 0);

      // Known quirk: some devices miss a single OFF command.
      // Send multiple identical updates to improve command delivery reliability.
      assert.strictEqual(mockFetch.mock.callCount(), 4);

      // Verify all 3 update calls went to the correct endpoint
      for (let i = 1; i <= 3; i++) {
        const call = mockFetch.mock.calls[i];
        const url = call.arguments[0] as string;
        const options = call.arguments[1] as RequestInit;
        assert.ok(url.includes('/feature/100/value'), `Call ${i} should target feature endpoint`);
        assert.strictEqual(options.method, 'PUT');
        assert.deepStrictEqual(JSON.parse(options.body as string), { value: 0 });
      }
    });
  });
});
