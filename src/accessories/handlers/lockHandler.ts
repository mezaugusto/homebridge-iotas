import type { CharacteristicValue, Service as HAPService } from 'homebridge';

import type { Device, Feature } from 'iotas-ts';

import { FeatureCategory } from 'iotas-ts';
import type { ServiceHandler, ServiceHandlerContext } from '../serviceHandler.js';
import { getOrAddService } from '../serviceUtils.js';
import { safeSet } from '../handlerUtils.js';

export class LockServiceHandler implements ServiceHandler {
  canHandle(feature: Feature, device: Device): boolean {
    void device;
    return feature.featureTypeCategory === FeatureCategory.Lock;
  }

  getServiceType(ctx: ServiceHandlerContext) {
    return ctx.Service.LockMechanism;
  }

  createService(ctx: ServiceHandlerContext, feature: Feature): HAPService {
    const { platform, accessory, Service, Characteristic } = ctx;
    const featureId = feature.id.toString();

    const service = getOrAddService(accessory, Service.LockMechanism, accessory.displayName);

    service.getCharacteristic(Characteristic.LockCurrentState).onGet(() => {
      const value = platform.cache.get(featureId) ?? 0;
      return value === 1 ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED;
    });

    service.getCharacteristic(Characteristic.LockTargetState).onSet(async (value: CharacteristicValue) => {
      await safeSet(ctx, 'LockTargetState', async () => {
        platform.cache.writeThrough(featureId, value as number);
      });
    });

    const disposer = platform.cache.subscribe([featureId], (changed) => {
      const newValue = changed.get(featureId);
      if (newValue !== undefined) {
        service.updateCharacteristic(
          Characteristic.LockCurrentState,
          newValue === 1 ? Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED,
        );
      }
    });

    ctx.registerDisposer(disposer);

    return service;
  }
}
