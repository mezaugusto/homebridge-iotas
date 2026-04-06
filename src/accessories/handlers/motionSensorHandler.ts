import type { Service as HAPService } from 'homebridge';

import { FEATURE_CATEGORIES } from '../../features/constants.js';
import type { Device, Feature } from '../../types.js';
import type { ServiceHandler, ServiceHandlerContext } from '../serviceHandler.js';
import { getOrAddService } from '../serviceUtils.js';

export class MotionSensorHandler implements ServiceHandler {
  canHandle(feature: Feature, device: Device): boolean {
    void device;
    return feature.featureTypeCategory === FEATURE_CATEGORIES.MOTION;
  }

  getServiceType(ctx: ServiceHandlerContext) {
    return ctx.Service.MotionSensor;
  }

  createService(ctx: ServiceHandlerContext, feature: Feature): HAPService {
    const { platform, accessory, Service, Characteristic } = ctx;

    const service = getOrAddService(accessory, Service.MotionSensor, `${accessory.displayName} Motion`);

    service.getCharacteristic(Characteristic.MotionDetected).onGet(async () => {
      const feat = await platform.client.getFeature(feature.id.toString());
      return (feat?.value ?? 0) === 1;
    });

    return service;
  }
}
