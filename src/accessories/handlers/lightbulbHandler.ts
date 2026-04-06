import type { CharacteristicValue, Service as HAPService } from 'homebridge';

import { BRIGHTNESS_UPDATE_GUARD_MS, LIGHTBULB_ON_SET_DELAY_MS } from '../defaults.js';
import { EVENT_TYPE_NAMES, FEATURE_CATEGORIES } from '../../features/constants.js';
import type { Device, Feature } from '../../types.js';
import type { ServiceHandler, ServiceHandlerContext } from '../serviceHandler.js';
import { getOrAddService } from '../serviceUtils.js';

export class LightbulbServiceHandler implements ServiceHandler {
  canHandle(feature: Feature, device: Device): boolean {
    void device;
    return feature.eventTypeName === EVENT_TYPE_NAMES.LEVEL && feature.featureTypeCategory === FEATURE_CATEGORIES.LIGHT;
  }

  getServiceType(ctx: ServiceHandlerContext) {
    return ctx.Service.Lightbulb;
  }

  createService(ctx: ServiceHandlerContext, feature: Feature): HAPService {
    const { platform, accessory, Service, Characteristic, lastUpdatedBrightness } = ctx;

    const service = getOrAddService(accessory, Service.Lightbulb, accessory.displayName);

    service
      .getCharacteristic(Characteristic.On)
      .onGet(async () => {
        const feat = await platform.client.getFeature(feature.id.toString());
        return (feat?.value ?? 0) > 0;
      })
      .onSet(async (value: CharacteristicValue) => {
        setTimeout(async () => {
          const lastUpdate = lastUpdatedBrightness[accessory.UUID] || 0;
          if (value === false || Date.now() - lastUpdate > BRIGHTNESS_UPDATE_GUARD_MS) {
            await platform.client.updateFeature(feature.id.toString(), value ? 1 : 0);
            service.updateCharacteristic(Characteristic.Brightness, value ? 100 : 0);
          }
        }, LIGHTBULB_ON_SET_DELAY_MS);
      });

    service
      .getCharacteristic(Characteristic.Brightness)
      .onGet(async () => {
        const feat = await platform.client.getFeature(feature.id.toString());
        return (feat?.value ?? 0) * 100;
      })
      .onSet(async (value: CharacteristicValue) => {
        lastUpdatedBrightness[accessory.UUID] = Date.now();
        await platform.client.updateFeature(feature.id.toString(), (value as number) / 100);
      });

    return service;
  }
}
