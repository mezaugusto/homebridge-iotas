import type { PlatformConfig } from 'homebridge';

export interface IotasConfig extends PlatformConfig {
  username: string;
  password: string;
  unit?: string;
  heartrate?: number;
}
