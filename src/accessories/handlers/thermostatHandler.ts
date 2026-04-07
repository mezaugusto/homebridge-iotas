import type { CharacteristicValue, Service as HAPService } from 'homebridge';

import {
  DEFAULT_COOL_SETPOINT_F,
  DEFAULT_CURRENT_TEMPERATURE_F,
  DEFAULT_HEAT_SETPOINT_F,
  DEFAULT_TARGET_TEMPERATURE_C,
  THERMOSTAT_MAX_TEMP_C,
  THERMOSTAT_MIN_TEMP_C,
} from '../defaults.js';
import { EVENT_TYPE_NAMES, FEATURE_CATEGORIES } from '../../features/constants.js';
import type { Device, Feature } from '../../types.js';
import { Temperature } from '../../utils.js';
import type { ServiceHandler, ServiceHandlerContext } from '../serviceHandler.js';
import { getOrAddService } from '../serviceUtils.js';

export class ThermostatServiceHandler implements ServiceHandler {
  canHandle(feature: Feature, device: Device): boolean {
    return (
      (feature.eventTypeName === EVENT_TYPE_NAMES.TEMPERATURE && device.category !== FEATURE_CATEGORIES.LOCK) ||
      feature.eventTypeName === EVENT_TYPE_NAMES.THERMOSTAT_MODE
    );
  }

  getServiceType(ctx: ServiceHandlerContext) {
    return ctx.Service.Thermostat;
  }

  createService(ctx: ServiceHandlerContext, feature: Feature): HAPService {
    const { accessory, Service } = ctx;

    const service = getOrAddService(accessory, Service.Thermostat, accessory.displayName);

    if (feature.eventTypeName === EVENT_TYPE_NAMES.TEMPERATURE) {
      this.initTemperatureCharacteristics(ctx, service, feature);
    }

    if (feature.eventTypeName === EVENT_TYPE_NAMES.THERMOSTAT_MODE) {
      this.initModeCharacteristics(ctx, service, feature);
    }

    return service;
  }

  private initTemperatureCharacteristics(ctx: ServiceHandlerContext, service: HAPService, feature: Feature): void {
    const { platform, Characteristic, device } = ctx;

    if (feature.featureTypeCategory === FEATURE_CATEGORIES.CURRENT_TEMPERATURE) {
      service.getCharacteristic(Characteristic.CurrentTemperature).onGet(async () => {
        const feat = await platform.client.getFeature(feature.id.toString());
        return Temperature.toCelsius(feat?.value ?? DEFAULT_CURRENT_TEMPERATURE_F);
      });
    }

    if (feature.featureTypeCategory === FEATURE_CATEGORIES.HEAT_SET_POINT) {
      service
        .getCharacteristic(Characteristic.HeatingThresholdTemperature)
        .setProps({ minValue: THERMOSTAT_MIN_TEMP_C, maxValue: THERMOSTAT_MAX_TEMP_C })
        .onGet(async () => {
          const feat = await platform.client.getFeature(feature.id.toString());
          return Temperature.toCelsius(feat?.value ?? DEFAULT_HEAT_SETPOINT_F);
        })
        .onSet(async (value: CharacteristicValue) => {
          await platform.client.updateFeature(feature.id.toString(), Temperature.toFahrenheit(value as number));
        });
    }

    if (feature.featureTypeCategory === FEATURE_CATEGORIES.COOL_SET_POINT) {
      service
        .getCharacteristic(Characteristic.CoolingThresholdTemperature)
        .setProps({ minValue: THERMOSTAT_MIN_TEMP_C, maxValue: THERMOSTAT_MAX_TEMP_C })
        .onGet(async () => {
          const feat = await platform.client.getFeature(feature.id.toString());
          return Temperature.toCelsius(feat?.value ?? DEFAULT_COOL_SETPOINT_F);
        })
        .onSet(async (value: CharacteristicValue) => {
          await platform.client.updateFeature(feature.id.toString(), Temperature.toFahrenheit(value as number));
        });

      this.initTargetTemperature(ctx, service, device);
    }
  }

  private initModeCharacteristics(ctx: ServiceHandlerContext, service: HAPService, feature: Feature): void {
    const { platform, Characteristic } = ctx;
    const split = feature.values?.split(':') ?? [];
    const states = split.map((state) => {
      const s = state.toLowerCase();
      if (s.includes('heat')) {
        return Characteristic.TargetHeatingCoolingState.HEAT;
      }
      if (s.includes('cool')) {
        return Characteristic.TargetHeatingCoolingState.COOL;
      }
      if (s.includes('off')) {
        return Characteristic.TargetHeatingCoolingState.OFF;
      }
      return Characteristic.TargetHeatingCoolingState.AUTO;
    });

    service
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .onGet(async () => {
        const feat = await platform.client.getFeature(feature.id.toString());
        return states[feat?.value ?? 0] ?? Characteristic.TargetHeatingCoolingState.OFF;
      })
      .onSet(async (value: CharacteristicValue) => {
        const stateMap: Record<number, number> = {
          [Characteristic.TargetHeatingCoolingState.HEAT]: split.findIndex((s) => s.toLowerCase().includes('heat')),
          [Characteristic.TargetHeatingCoolingState.COOL]: split.findIndex((s) => s.toLowerCase().includes('cool')),
          [Characteristic.TargetHeatingCoolingState.OFF]: split.findIndex((s) => s.toLowerCase().includes('off')),
          [Characteristic.TargetHeatingCoolingState.AUTO]: split.findIndex((s) => s.toLowerCase().includes('auto')),
        };

        const index = stateMap[value as number];
        if (index >= 0) {
          await platform.client.updateFeature(feature.id.toString(), index);
        }
      });
  }

  private initTargetTemperature(ctx: ServiceHandlerContext, service: HAPService, device: Device): void {
    const { platform, Characteristic } = ctx;
    const features = {
      coolSetPoint: device.features.find((f) => f.featureTypeCategory === FEATURE_CATEGORIES.COOL_SET_POINT),
      heatSetPoint: device.features.find((f) => f.featureTypeCategory === FEATURE_CATEGORIES.HEAT_SET_POINT),
    };
    const modeFeature = device.features.find((f) => f.featureTypeCategory === FEATURE_CATEGORIES.THERMOSTAT_MODE);

    if (!modeFeature) {
      return;
    }

    service
      .getCharacteristic(Characteristic.TargetTemperature)
      .setProps({ minValue: THERMOSTAT_MIN_TEMP_C, maxValue: THERMOSTAT_MAX_TEMP_C })
      .onGet(async () => {
        const modeFeat = await platform.client.getFeature(modeFeature.id.toString());
        const modeValue = modeFeat?.value ?? 0;
        const mode = (modeFeature.values?.split(':') ?? [])[modeValue]?.toLowerCase() ?? '';

        if (mode.includes('cool') && features.coolSetPoint) {
          const feat = await platform.client.getFeature(features.coolSetPoint.id.toString());
          return Temperature.toCelsius(feat?.value ?? DEFAULT_COOL_SETPOINT_F);
        }

        if (mode.includes('heat') && features.heatSetPoint) {
          const feat = await platform.client.getFeature(features.heatSetPoint.id.toString());
          return Temperature.toCelsius(feat?.value ?? DEFAULT_HEAT_SETPOINT_F);
        }

        if (features.coolSetPoint && features.heatSetPoint) {
          const coolFeat = await platform.client.getFeature(features.coolSetPoint.id.toString());
          const heatFeat = await platform.client.getFeature(features.heatSetPoint.id.toString());
          return (
            (Temperature.toCelsius(coolFeat?.value ?? DEFAULT_COOL_SETPOINT_F) +
              Temperature.toCelsius(heatFeat?.value ?? DEFAULT_HEAT_SETPOINT_F)) /
            2
          );
        }

        return DEFAULT_TARGET_TEMPERATURE_C;
      })
      .onSet(async (value: CharacteristicValue) => {
        const modeFeat = await platform.client.getFeature(modeFeature.id.toString());
        const modeValue = modeFeat?.value ?? 0;
        const mode = (modeFeature.values?.split(':') ?? [])[modeValue]?.toLowerCase() ?? '';

        if (mode.includes('cool') && features.coolSetPoint) {
          await platform.client.updateFeature(
            features.coolSetPoint.id.toString(),
            Temperature.toFahrenheit(value as number),
          );
        } else if (mode.includes('heat') && features.heatSetPoint) {
          await platform.client.updateFeature(
            features.heatSetPoint.id.toString(),
            Temperature.toFahrenheit(value as number),
          );
        }
      });
  }
}
