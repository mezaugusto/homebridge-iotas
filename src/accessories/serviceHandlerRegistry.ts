import type { Device, Feature } from '../types.js';
import {
  BatteryServiceHandler,
  ContactSensorHandler,
  HumiditySensorHandler,
  LightbulbServiceHandler,
  LockServiceHandler,
  MotionSensorHandler,
  SwitchServiceHandler,
  ThermostatServiceHandler,
} from './handlers/index.js';
import type { ServiceHandler, ServiceHandlerContext } from './serviceHandler.js';

export class ServiceHandlerRegistry {
  private static readonly handlers: ServiceHandler[] = [
    new SwitchServiceHandler(),
    new LockServiceHandler(),
    new LightbulbServiceHandler(),
    new ThermostatServiceHandler(),
    new BatteryServiceHandler(),
    new HumiditySensorHandler(),
    new MotionSensorHandler(),
    new ContactSensorHandler(),
  ];

  static getHandlerFor(feature: Feature, device: Device): ServiceHandler | null {
    return this.handlers.find((handler) => handler.canHandle(feature, device)) ?? null;
  }

  static getAllServiceTypes(ctx: ServiceHandlerContext) {
    return this.handlers.map((handler) => handler.getServiceType(ctx));
  }
}
