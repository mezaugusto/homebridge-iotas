import type { Service as HAPService } from 'homebridge';

import { FEATURE_TYPE_NAMES } from '../../features/constants.js';
import type { Device, Feature } from '../../types.js';
import type { ServiceHandler, ServiceHandlerContext } from '../serviceHandler.js';
import { getOrAddService } from '../serviceUtils.js';

export class BatteryServiceHandler implements ServiceHandler {
  canHandle(feature: Feature, device: Device): boolean {
    void device;
    return feature.featureTypeName === FEATURE_TYPE_NAMES.BATTERY;
  }

  getServiceType(ctx: ServiceHandlerContext) {
    return ctx.Service.Battery;
  }

  createService(ctx: ServiceHandlerContext, feature: Feature): HAPService {
    const { platform, accessory, Service, Characteristic } = ctx;

    const service = getOrAddService(accessory, Service.Battery, accessory.displayName);

    service.getCharacteristic(Characteristic.BatteryLevel).onGet(async () => {
      const feat = await platform.client.getFeature(feature.id.toString());
      return feat?.value ?? 0;
    });

    service.getCharacteristic(Characteristic.StatusLowBattery).onGet(async () => {
      const feat = await platform.client.getFeature(feature.id.toString());
      const level = feat?.value ?? 100;
      return level < 20
        ? Characteristic.StatusLowBattery.BATTERY_LEVEL_LOW
        : Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL;
    });

    return service;
  }
}
