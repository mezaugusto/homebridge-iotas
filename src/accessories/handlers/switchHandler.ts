import type { Service as HAPService } from 'homebridge';

import type { Device, Feature } from 'iotas-ts';

import { EventTypeName, FeatureTypeName } from 'iotas-ts';
import type { ServiceHandler, ServiceHandlerContext } from '../serviceHandler.js';
import { getOrAddService } from '../serviceUtils.js';
import { safeSet } from '../handlerUtils.js';

export class SwitchServiceHandler implements ServiceHandler {
  canHandle(feature: Feature, device: Device): boolean {
    void device;
    return (
      feature.eventTypeName === EventTypeName.OnOff &&
      (feature.featureTypeName === FeatureTypeName.Light || feature.featureTypeName === FeatureTypeName.OperationMode)
    );
  }

  getServiceType(ctx: ServiceHandlerContext) {
    return ctx.Service.Switch;
  }

  createService(ctx: ServiceHandlerContext, feature: Feature): HAPService {
    const { platform, accessory, Service, Characteristic } = ctx;
    const featureId = feature.id.toString();

    const service = getOrAddService(accessory, Service.Switch, accessory.displayName);

    service
      .getCharacteristic(Characteristic.On)
      .onGet(() => {
        const value = platform.cache.get(featureId) ?? 0;
        return value === 1;
      })
      .onSet(async (value) => {
        await safeSet(ctx, 'On', async () => {
          const targetValue = value ? 1 : 0;
          platform.cache.writeThrough(featureId, targetValue);
        });
      });

    const disposer = platform.cache.subscribe([featureId], (changed) => {
      const newValue = changed.get(featureId);
      if (newValue !== undefined) {
        service.updateCharacteristic(Characteristic.On, newValue === 1);
      }
    });

    ctx.registerDisposer(disposer);

    return service;
  }
}
