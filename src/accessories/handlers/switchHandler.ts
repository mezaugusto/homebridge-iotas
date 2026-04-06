import type { Service as HAPService } from 'homebridge';

import { EVENT_TYPE_NAMES, FEATURE_TYPE_NAMES } from '../../features/constants.js';
import type { Device, Feature } from '../../types.js';
import type { ServiceHandler, ServiceHandlerContext } from '../serviceHandler.js';
import { getOrAddService } from '../serviceUtils.js';

export class SwitchServiceHandler implements ServiceHandler {
  canHandle(feature: Feature, device: Device): boolean {
    void device;
    return (
      feature.eventTypeName === EVENT_TYPE_NAMES.ON_OFF &&
      (feature.featureTypeName === FEATURE_TYPE_NAMES.LIGHT ||
        feature.featureTypeName === FEATURE_TYPE_NAMES.OPERATION_MODE)
    );
  }

  getServiceType(ctx: ServiceHandlerContext) {
    return ctx.Service.Switch;
  }

  createService(ctx: ServiceHandlerContext, feature: Feature): HAPService {
    const { platform, accessory, Service, Characteristic } = ctx;

    const service = getOrAddService(accessory, Service.Switch, accessory.displayName);

    service
      .getCharacteristic(Characteristic.On)
      .onGet(async () => {
        const feat = await platform.client.getFeature(feature.id.toString());
        return feat?.value === 1;
      })
      .onSet(async (value) => {
        await platform.client.updateFeature(feature.id.toString(), value ? 1 : 0);
      });

    return service;
  }
}
