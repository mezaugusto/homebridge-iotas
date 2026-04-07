import type { PlatformAccessory, Service } from 'homebridge';

import { FEATURE_CATEGORIES } from '../features/constants.js';
import { isSupportedFeature } from '../features/featurePredicates.js';
import type { IotasPlatform } from '../platform.js';
import type { Device } from '../types.js';
import type { ServiceHandlerContext } from './serviceHandler.js';
import { ServiceHandlerRegistry } from './serviceHandlerRegistry.js';

/**
 * IotasAccessory
 * An instance of this class is created for each accessory registered.
 * Each accessory may expose multiple services based on device features.
 */
export class IotasAccessory {
  private readonly device: Device;
  private readonly ctx: ServiceHandlerContext;
  private readonly lastUpdatedBrightness: Record<string, number> = {};

  constructor(
    private readonly platform: IotasPlatform,
    private readonly accessory: PlatformAccessory,
  ) {
    this.device = accessory.context.device as Device;

    this.ctx = {
      platform,
      accessory,
      device: this.device,
      lastUpdatedBrightness: this.lastUpdatedBrightness,
      Service: platform.Service,
      Characteristic: platform.Characteristic,
    };

    const manufacturer = this.device.physicalDeviceDescription?.manufacturer || 'IOTAS';
    const model = this.device.physicalDeviceDescription?.name || this.device.category || FEATURE_CATEGORIES.LIGHT;
    // Serial number must be >1 character for HomeKit; fallback to device ID if invalid
    const rawSerial = this.device.serialNumber;
    const serialNumber = rawSerial && rawSerial.length > 1 ? rawSerial : `IOTAS-${this.device.id}`;

    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, manufacturer)
      .setCharacteristic(this.platform.Characteristic.Model, model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, serialNumber);

    this.initServices();
  }

  private initServices(): void {
    const activeServices = new Set<Service>();

    for (const feature of this.device.features ?? []) {
      if (!isSupportedFeature(feature)) {
        continue;
      }

      const handler = ServiceHandlerRegistry.getHandlerFor(feature, this.device);
      if (handler) {
        const service = handler.createService(this.ctx, feature);
        activeServices.add(service);
      }
    }

    this.cleanupOrphanedServices(activeServices);
  }

  private cleanupOrphanedServices(activeServices: Set<Service>): void {
    const managedServiceTypes = ServiceHandlerRegistry.getAllServiceTypes(this.ctx);

    for (const service of this.accessory.services) {
      if (service instanceof this.platform.Service.AccessoryInformation) {
        continue;
      }

      const isManagedService = managedServiceTypes.some((ServiceType) => service instanceof ServiceType);
      if (isManagedService && !activeServices.has(service)) {
        this.accessory.removeService(service);
      }
    }
  }
}
