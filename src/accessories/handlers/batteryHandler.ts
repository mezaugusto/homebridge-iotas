import type { Service as HAPService } from 'homebridge';

import type { Device, Feature } from 'iotas-ts';
import { LOW_BATTERY_THRESHOLD, FeatureTypeName } from 'iotas-ts';
import type { ServiceHandler, ServiceHandlerContext } from '../serviceHandler.js';
import { getOrAddService } from '../serviceUtils.js';

export class BatteryServiceHandler implements ServiceHandler {
  canHandle(feature: Feature, device: Device): boolean {
    void device;
    return feature.featureTypeName === FeatureTypeName.Battery;
  }

  getServiceType(ctx: ServiceHandlerContext) {
    return ctx.Service.Battery;
  }

  createService(ctx: ServiceHandlerContext, feature: Feature): HAPService {
    const { platform, accessory, Service, Characteristic } = ctx;
    const featureId = feature.id.toString();

    const service = getOrAddService(accessory, Service.Battery, accessory.displayName);

    service.getCharacteristic(Characteristic.BatteryLevel).onGet(() => {
      return platform.cache.get(featureId) ?? 0;
    });

    service.getCharacteristic(Characteristic.StatusLowBattery).onGet(() => {
      const level = platform.cache.get(featureId) ?? 100;
      return level < LOW_BATTERY_THRESHOLD
        ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
        : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
    });

    const disposer = platform.cache.subscribe([featureId], (changed) => {
      const level = changed.get(featureId);
      if (level !== undefined) {
        service.updateCharacteristic(Characteristic.BatteryLevel, level);
        service.updateCharacteristic(
          Characteristic.StatusLowBattery,
          level < LOW_BATTERY_THRESHOLD
            ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
            : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL,
        );
      }
    });

    ctx.registerDisposer(disposer);

    return service;
  }
}
