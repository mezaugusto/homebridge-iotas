import type { CharacteristicValue, Service as HAPService } from 'homebridge';

import type { Device, Feature } from 'iotas-ts';

import { BRIGHTNESS_UPDATE_GUARD_MS, LIGHTBULB_ON_SET_DELAY_MS } from '../defaults.js';
import { EventTypeName, FeatureCategory } from 'iotas-ts';
import type { ServiceHandler, ServiceHandlerContext } from '../serviceHandler.js';
import { getOrAddService } from '../serviceUtils.js';
import { safeSet } from '../handlerUtils.js';

export class LightbulbServiceHandler implements ServiceHandler {
  canHandle(feature: Feature, device: Device): boolean {
    void device;
    return feature.eventTypeName === EventTypeName.Level && feature.featureTypeCategory === FeatureCategory.Light;
  }

  getServiceType(ctx: ServiceHandlerContext) {
    return ctx.Service.Lightbulb;
  }

  createService(ctx: ServiceHandlerContext, feature: Feature): HAPService {
    const { platform, accessory, Service, Characteristic, lastUpdatedBrightness } = ctx;
    const featureId = feature.id.toString();

    const updateLightValue = (targetValue: number): void => {
      platform.cache.writeThrough(featureId, targetValue);
    };

    const service = getOrAddService(accessory, Service.Lightbulb, accessory.displayName);

    service
      .getCharacteristic(Characteristic.On)
      .onGet(() => {
        const value = platform.cache.get(featureId) ?? 0;
        return value > 0;
      })
      .onSet(async (value: CharacteristicValue) => {
        await safeSet(ctx, 'On', async () => {
          setTimeout(() => {
            const lastUpdate = lastUpdatedBrightness[accessory.UUID] || 0;
            if (value === false || Date.now() - lastUpdate > BRIGHTNESS_UPDATE_GUARD_MS) {
              const targetValue = value ? 1 : 0;
              updateLightValue(targetValue);
              service.updateCharacteristic(Characteristic.Brightness, value ? 100 : 0);
            }
          }, LIGHTBULB_ON_SET_DELAY_MS);
        });
      });

    service
      .getCharacteristic(Characteristic.Brightness)
      .onGet(() => {
        const value = platform.cache.get(featureId) ?? 0;
        return value * 100;
      })
      .onSet(async (value: CharacteristicValue) => {
        await safeSet(ctx, 'Brightness', async () => {
          lastUpdatedBrightness[accessory.UUID] = Date.now();
          const targetValue = (value as number) / 100;
          updateLightValue(targetValue);
        });
      });

    const disposer = platform.cache.subscribe([featureId], (changed) => {
      const newValue = changed.get(featureId);
      if (newValue !== undefined) {
        service.updateCharacteristic(Characteristic.On, newValue > 0);
        service.updateCharacteristic(Characteristic.Brightness, newValue * 100);
      }
    });

    ctx.registerDisposer(disposer);

    return service;
  }
}
