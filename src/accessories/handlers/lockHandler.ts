import type { CharacteristicValue, Service as HAPService } from 'homebridge';

import { FEATURE_CATEGORIES } from '../../features/constants.js';
import type { Device, Feature } from '../../types.js';
import type { ServiceHandler, ServiceHandlerContext } from '../serviceHandler.js';
import { getOrAddService } from '../serviceUtils.js';

export class LockServiceHandler implements ServiceHandler {
  canHandle(feature: Feature, device: Device): boolean {
    void device;
    return feature.featureTypeCategory === FEATURE_CATEGORIES.LOCK;
  }

  getServiceType(ctx: ServiceHandlerContext) {
    return ctx.Service.LockMechanism;
  }

  createService(ctx: ServiceHandlerContext, feature: Feature): HAPService {
    const { platform, accessory, Service, Characteristic } = ctx;

    const service = getOrAddService(accessory, Service.LockMechanism, accessory.displayName);

    service.getCharacteristic(Characteristic.LockCurrentState).onGet(async () => {
      const feat = await platform.client.getFeature(feature.id.toString());
      return feat?.value === 1 ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED;
    });

    service.getCharacteristic(Characteristic.LockTargetState).onSet(async (value: CharacteristicValue) => {
      await platform.client.updateFeature(feature.id.toString(), value as number);
    });

    return service;
  }
}
