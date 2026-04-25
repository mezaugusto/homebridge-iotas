import type { Service as HAPService } from 'homebridge';

import type { Device, Feature } from 'iotas-ts';

import { FeatureCategory } from 'iotas-ts';
import type { ServiceHandler, ServiceHandlerContext } from '../serviceHandler.js';
import { getOrAddService } from '../serviceUtils.js';

export class HumiditySensorHandler implements ServiceHandler {
  canHandle(feature: Feature, device: Device): boolean {
    void device;
    return feature.featureTypeCategory === FeatureCategory.Humidity;
  }

  getServiceType(ctx: ServiceHandlerContext) {
    return ctx.Service.HumiditySensor;
  }

  createService(ctx: ServiceHandlerContext, feature: Feature): HAPService {
    const { platform, accessory, Service, Characteristic } = ctx;
    const featureId = feature.id.toString();

    const service = getOrAddService(accessory, Service.HumiditySensor, `${accessory.displayName} Humidity`);

    service.getCharacteristic(Characteristic.CurrentRelativeHumidity).onGet(() => {
      return platform.cache.get(featureId) ?? 0;
    });

    const disposer = platform.cache.subscribe([featureId], (changed) => {
      const newValue = changed.get(featureId);
      if (newValue !== undefined) {
        service.updateCharacteristic(Characteristic.CurrentRelativeHumidity, newValue);
      }
    });

    ctx.registerDisposer(disposer);

    return service;
  }
}
