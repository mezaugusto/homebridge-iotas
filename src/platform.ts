import type {
  API,
  Characteristic,
  DynamicPlatformPlugin,
  Logging,
  PlatformAccessory,
  PlatformConfig,
  Service,
} from 'homebridge';

import { IotasClient } from './api/iotasClient.js';
import { IotasAccessory } from './accessories/iotasAccessory.js';
import { isSupportedDevice } from './features/featurePredicates.js';
import { PLATFORM_NAME, PLUGIN_NAME } from './settings.js';
import type { Device } from './types.js';

/**
 * IotasPlatform
 * This class is the main constructor for the plugin, responsible for
 * parsing config and discovering/registering accessories with Homebridge.
 */
export class IotasPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service;
  public readonly Characteristic: typeof Characteristic;

  // Track restored cached accessories
  public readonly accessories: Map<string, PlatformAccessory> = new Map();
  private readonly discoveredUUIDs: Set<string> = new Set();

  // IOTAS API client
  public readonly client: IotasClient;

  constructor(
    public readonly log: Logging,
    public readonly config: PlatformConfig,
    public readonly api: API,
  ) {
    this.Service = api.hap.Service;
    this.Characteristic = api.hap.Characteristic;

    // Initialize the API client
    this.client = new IotasClient(log, config.username, config.password, config.unit);

    this.log.debug('Finished initializing platform:', this.config.name);

    // Wait for Homebridge to restore cached accessories before discovering new ones
    this.api.on('didFinishLaunching', () => {
      log.debug('Executed didFinishLaunching callback');
      this.discoverDevices();
    });
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   */
  configureAccessory(accessory: PlatformAccessory): void {
    this.log.info('Loading accessory from cache:', accessory.displayName);
    this.accessories.set(accessory.UUID, accessory);
  }

  /**
   * Discover devices from the IOTAS API and register them as accessories.
   */
  async discoverDevices(): Promise<void> {
    try {
      this.discoveredUUIDs.clear();
      const rooms = await this.client.getRooms();

      for (const room of rooms) {
        for (const device of room.devices) {
          this.tryAddDevice(room.name, device);
        }
      }

      // Remove accessories that are no longer present
      for (const [uuid, accessory] of this.accessories) {
        if (!this.discoveredUUIDs.has(uuid)) {
          this.log.info('Removing existing accessory from cache:', accessory.displayName);
          this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
          this.accessories.delete(uuid);
        }
      }
    } catch (error) {
      this.log.error('Failed to discover devices:', error);
    }
  }

  /**
   * Check if a device should be added and register it as an accessory.
   */
  private tryAddDevice(roomName: string, device: Device): void {
    if (!isSupportedDevice(device)) {
      return;
    }

    const uuid = this.api.hap.uuid.generate(device.id.toString());
    const name = `${roomName} ${device.name}`;

    this.discoveredUUIDs.add(uuid);

    const existingAccessory = this.accessories.get(uuid);

    if (existingAccessory) {
      // Update existing accessory
      this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
      existingAccessory.context.device = device;
      this.api.updatePlatformAccessories([existingAccessory]);
      new IotasAccessory(this, existingAccessory);
    } else {
      // Create new accessory
      this.log.info('Adding new accessory:', name);
      const accessory = new this.api.platformAccessory(name, uuid);
      accessory.context.device = device;
      new IotasAccessory(this, accessory);
      this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
      this.accessories.set(uuid, accessory);
    }
  }
}
