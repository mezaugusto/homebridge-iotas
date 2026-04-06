import type { Service as HAPService } from 'homebridge';

import { FEATURE_CATEGORIES } from '../../features/constants.js';
import type { Device, Feature } from '../../types.js';
import type { ServiceHandler, ServiceHandlerContext } from '../serviceHandler.js';
import { getOrAddService } from '../serviceUtils.js';

export class HumiditySensorHandler implements ServiceHandler {
  canHandle(feature: Feature, device: Device): boolean {
    void device;
    return feature.featureTypeCategory === FEATURE_CATEGORIES.HUMIDITY;
  }

  getServiceType(ctx: ServiceHandlerContext) {
    return ctx.Service.HumiditySensor;
  }

  createService(ctx: ServiceHandlerContext, feature: Feature): HAPService {
    const { platform, accessory, Service, Characteristic } = ctx;

    const service = getOrAddService(accessory, Service.HumiditySensor, `${accessory.displayName} Humidity`);

    service.getCharacteristic(Characteristic.CurrentRelativeHumidity).onGet(async () => {
      const feat = await platform.client.getFeature(feature.id.toString());
      return feat?.value ?? 0;
    });

    return service;
  }
}
