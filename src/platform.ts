import type {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
  Service,
} from 'homebridge';

import { FeatureCache, IotasClient, isSupportedDevice } from 'iotas-ts';
import type { Device, Rooms } from 'iotas-ts';

import { IotasAccessory } from './accessories/iotasAccessory.js';
import type { IotasConfig } from './config.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';

const DEFAULT_HEARTRATE_S = 5;

export class IotasPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;
  public readonly accessories: Map<string, PlatformAccessory> = new Map();
  private readonly discoveredUUIDs: Set<string> = new Set();
  private readonly accessoryRuntimes: Map<string, IotasAccessory> = new Map();
  public readonly client: IotasClient;
  public readonly cache: FeatureCache;

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    const iotasConfig = config as IotasConfig;
    this.client = IotasClient.withCredentials(log, iotasConfig.username, iotasConfig.password, iotasConfig.unit);

    const heartrateS = iotasConfig.heartrate ?? DEFAULT_HEARTRATE_S;
    this.cache = new FeatureCache(log, this.client, { pollIntervalMs: heartrateS * 1000 });

    this.log.debug('Finished initializing platform:', this.config.name);

    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });

    this.api.on('shutdown', () => {
      log.debug('Shutdown event received, stopping cache polling');
      this.cache.stop();
    });
  }

  configureAccessory(accessory: PlatformAccessory): void {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.set(accessory.UUID, accessory);
  }

  async discoverDevices(): Promise<void> {
    try {
      this.discoveredUUIDs.clear();
      this.cache.reset();
      const rooms = await this.client.getRooms();
      this.cache.seed(rooms);

      this.registerDevices(rooms);

      // Remove accessories that are no longer present
      for (const [uuid, accessory] of this.accessories) {
        if (!this.discoveredUUIDs.has(uuid)) {
          this.log.info('Removing existing accessory from cache:', accessory.displayName);
          this.cleanupAccessoryRuntime(uuid);
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
          this.accessories.delete(uuid);
        }
      }
      this.cache.start();
    } catch (error) {
      this.log.error('Failed to discover devices:', error);
    }
  }

  private registerDevices(rooms: Rooms): void {
    for (const room of rooms) {
      for (const device of room.devices) {
        this.tryAddDevice(room.name, device);
      }
    }
  }

  private cleanupAccessoryRuntime(uuid: string): void {
    const runtime = this.accessoryRuntimes.get(uuid);
    if (runtime) {
      runtime.cleanup();
      this.accessoryRuntimes.delete(uuid);
    }
  }

  private tryAddDevice(roomName: string, device: Device): void {
    if (!isSupportedDevice(device)) {
      return;
    }

    const uuid = this.api.hap.uuid.generate(device.id.toString());
    const name = `${roomName} ${device.name}`;

    this.discoveredUUIDs.add(uuid);

    const existingAccessory = this.accessories.get(uuid);

    if (existingAccessory) {
      this.cleanupAccessoryRuntime(uuid);

      this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
      existingAccessory.context.device = device;
      this.api.updatePlatformAccessories([existingAccessory]);
      const runtime = new IotasAccessory(this, existingAccessory);
      this.accessoryRuntimes.set(uuid, runtime);
    } else {
      this.log.info('Adding new accessory:', name);
      const accessory = new this.api.platformAccessory(name, uuid);
      accessory.context.device = device;
      const runtime = new IotasAccessory(this, accessory);
      this.accessoryRuntimes.set(uuid, runtime);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      this.accessories.set(uuid, accessory);
    }
  }
}
