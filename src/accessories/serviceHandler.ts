import type { PlatformAccessory, Service as HAPService } from 'homebridge';

import type { IotasPlatform } from '../platform.js';
import type { Device, Feature } from '../types.js';

export type ServiceConstructor = abstract new (...args: never[]) => HAPService;

export interface ServiceHandlerContext {
  platform: IotasPlatform;
  accessory: PlatformAccessory;
  device: Device;
  lastUpdatedBrightness: Record<string, number>;
  Service: IotasPlatform['Service'];
  Characteristic: IotasPlatform['Characteristic'];
}

export interface ServiceHandler {
  canHandle(feature: Feature, device: Device): boolean;
  createService(ctx: ServiceHandlerContext, feature: Feature): HAPService;
  getServiceType(ctx: ServiceHandlerContext): ServiceConstructor;
}
