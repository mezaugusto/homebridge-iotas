import type { Service as HAPService } from 'homebridge';

import type { Device, Feature } from 'iotas-ts';

import { FeatureCategory } from 'iotas-ts';
import type { ServiceHandler, ServiceHandlerContext } from '../serviceHandler.js';
import { getOrAddService } from '../serviceUtils.js';

export class MotionSensorHandler implements ServiceHandler {
  canHandle(feature: Feature, device: Device): boolean {
    void device;
    return feature.featureTypeCategory === FeatureCategory.Motion;
  }

  getServiceType(ctx: ServiceHandlerContext) {
    return ctx.Service.MotionSensor;
  }

  createService(ctx: ServiceHandlerContext, feature: Feature): HAPService {
    const { platform, accessory, Service, Characteristic } = ctx;
    const featureId = feature.id.toString();

    const service = getOrAddService(accessory, Service.MotionSensor, `${accessory.displayName} Motion`);

    service.getCharacteristic(Characteristic.MotionDetected).onGet(() => {
      return (platform.cache.get(featureId) ?? 0) === 1;
    });

    const disposer = platform.cache.subscribe([featureId], (changed) => {
      const newValue = changed.get(featureId);
      if (newValue !== undefined) {
        service.updateCharacteristic(Characteristic.MotionDetected, newValue === 1);
      }
    });

    ctx.registerDisposer(disposer);

    return service;
  }
}
