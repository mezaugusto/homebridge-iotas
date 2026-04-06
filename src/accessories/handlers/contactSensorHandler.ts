import type { Service as HAPService } from 'homebridge';

import { FEATURE_CATEGORIES } from '../../features/constants.js';
import type { Device, Feature } from '../../types.js';
import type { ServiceHandler, ServiceHandlerContext } from '../serviceHandler.js';
import { getOrAddService } from '../serviceUtils.js';

export class ContactSensorHandler implements ServiceHandler {
  canHandle(feature: Feature, device: Device): boolean {
    void device;
    return feature.featureTypeCategory === FEATURE_CATEGORIES.DOOR_STATE;
  }

  getServiceType(ctx: ServiceHandlerContext) {
    return ctx.Service.ContactSensor;
  }

  createService(ctx: ServiceHandlerContext, feature: Feature): HAPService {
    const { platform, accessory, Service, Characteristic } = ctx;

    const service = getOrAddService(accessory, Service.ContactSensor, `${accessory.displayName} Contact`);

    service.getCharacteristic(Characteristic.ContactSensorState).onGet(async () => {
      const feat = await platform.client.getFeature(feature.id.toString());
      return (feat?.value ?? 0) === 0
        ? Characteristic.ContactSensorState.CONTACT_DETECTED
        : Characteristic.ContactSensorState.CONTACT_NOT_DETECTED;
    });

    return service;
  }
}
