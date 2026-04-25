import type { PlatformAccessory, Service } from 'homebridge';

import { FeatureCategory, getManufacturer, getModel, getSerialNumber, isSupportedFeature, type Device } from 'iotas-ts';
import type { IotasPlatform } from '../platform.js';
import type { ServiceHandlerContext } from './serviceHandler.js';
import { ServiceHandlerRegistry } from './serviceHandlerRegistry.js';

export class IotasAccessory {
  private readonly device: Device;
  private readonly ctx: ServiceHandlerContext;
  private readonly lastUpdatedBrightness: Record<string, number> = {};
  private readonly subscriptionDisposers: (() => void)[] = [];

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
      registerDisposer: (disposer: () => void) => this.registerDisposer(disposer),
    };
    const manufacturer = getManufacturer(this.device);
    const model = getModel(this.device) || FeatureCategory.Light;
    const serialNumber = getSerialNumber(this.device);

    this.accessory
      .getService(this.platform.Service.AccessoryInformation)!
      .setCharacteristic(this.platform.Characteristic.Manufacturer, manufacturer)
      .setCharacteristic(this.platform.Characteristic.Model, model)
      .setCharacteristic(this.platform.Characteristic.SerialNumber, serialNumber);

    this.initServices();
  }

  private registerDisposer(disposer: () => void): void {
    this.subscriptionDisposers.push(disposer);
  }

  cleanup(): void {
    for (const dispose of this.subscriptionDisposers) {
      dispose();
    }
    this.subscriptionDisposers.length = 0;
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
