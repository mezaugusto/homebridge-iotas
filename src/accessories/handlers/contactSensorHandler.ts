import type { Service as HAPService } from 'homebridge';

import type { Device, Feature } from 'iotas-ts';

import { FeatureCategory } from 'iotas-ts';
import type { ServiceHandler, ServiceHandlerContext } from '../serviceHandler.js';
import { getOrAddService } from '../serviceUtils.js';

export class ContactSensorHandler implements ServiceHandler {
  canHandle(feature: Feature, device: Device): boolean {
    void device;
    return feature.featureTypeCategory === FeatureCategory.DoorState;
  }

  getServiceType(ctx: ServiceHandlerContext) {
    return ctx.Service.ContactSensor;
  }

  createService(ctx: ServiceHandlerContext, feature: Feature): HAPService {
    const { platform, accessory, Service, Characteristic } = ctx;
    const featureId = feature.id.toString();

    const service = getOrAddService(accessory, Service.ContactSensor, `${accessory.displayName} Contact`);

    service.getCharacteristic(Characteristic.ContactSensorState).onGet(() => {
      return (platform.cache.get(featureId) ?? 0) === 0
        ? Characteristic.ContactSensorState.CONTACT_DETECTED
        : Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
    });

    const disposer = platform.cache.subscribe([featureId], (changed) => {
      const newValue = changed.get(featureId);
      if (newValue !== undefined) {
        service.updateCharacteristic(
          Characteristic.ContactSensorState,
          newValue === 0
            ? Characteristic.ContactSensorState.CONTACT_DETECTED
            : Characteristic.ContactSensorState.CONTACT_NOT_DETECTED,
        );
      }
    });

    ctx.registerDisposer(disposer);

    return service;
  }
}
