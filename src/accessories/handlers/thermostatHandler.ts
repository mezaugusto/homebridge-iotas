import type { CharacteristicValue, Service as HAPService } from 'homebridge';

import type { Device, Feature } from 'iotas-ts';
import {
  Temperature,
  findFeatureByCategory,
  parseThermostatModes,
  getThermostatModeAt,
  findThermostatModeIndex,
  ThermostatMode,
  DEFAULT_CURRENT_TEMPERATURE_F,
  DEFAULT_HEAT_SETPOINT_F,
  DEFAULT_COOL_SETPOINT_F,
} from 'iotas-ts';

import { DEFAULT_TARGET_TEMPERATURE_C, THERMOSTAT_MAX_TEMP_C, THERMOSTAT_MIN_TEMP_C } from '../defaults.js';
import { EventTypeName, FeatureCategory } from 'iotas-ts';
import type { ServiceHandler, ServiceHandlerContext } from '../serviceHandler.js';
import { getOrAddService } from '../serviceUtils.js';
import { safeSet } from '../handlerUtils.js';

export class ThermostatServiceHandler implements ServiceHandler {
  canHandle(feature: Feature, device: Device): boolean {
    return (
      (feature.eventTypeName === EventTypeName.Temperature && device.category !== FeatureCategory.Lock) ||
      feature.eventTypeName === EventTypeName.ThermostatMode
    );
  }

  getServiceType(ctx: ServiceHandlerContext) {
    return ctx.Service.Thermostat;
  }

  createService(ctx: ServiceHandlerContext, feature: Feature): HAPService {
    const { accessory, Service } = ctx;

    const service = getOrAddService(accessory, Service.Thermostat, accessory.displayName);

    if (feature.eventTypeName === EventTypeName.Temperature) {
      this.initTemperatureCharacteristics(ctx, service, feature);
    }

    if (feature.eventTypeName === EventTypeName.ThermostatMode) {
      this.initModeCharacteristics(ctx, service, feature);
    }

    return service;
  }

  private initTemperatureCharacteristics(ctx: ServiceHandlerContext, service: HAPService, feature: Feature): void {
    const { platform, Characteristic, device } = ctx;
    const featureId = feature.id.toString();

    if (feature.featureTypeCategory === FeatureCategory.CurrentTemperature) {
      service.getCharacteristic(Characteristic.CurrentTemperature).onGet(() => {
        const value = platform.cache.get(featureId) ?? DEFAULT_CURRENT_TEMPERATURE_F;
        return Temperature.toCelsius(value);
      });

      const disposer = platform.cache.subscribe([featureId], (changed) => {
        const newValue = changed.get(featureId);
        if (newValue !== undefined) {
          service.updateCharacteristic(Characteristic.CurrentTemperature, Temperature.toCelsius(newValue));
        }
      });

      ctx.registerDisposer(disposer);
    }

    if (feature.featureTypeCategory === FeatureCategory.HeatSetPoint) {
      service
        .getCharacteristic(Characteristic.HeatingThresholdTemperature)
        .setProps({ minValue: THERMOSTAT_MIN_TEMP_C, maxValue: THERMOSTAT_MAX_TEMP_C })
        .onGet(() => {
          const value = platform.cache.get(featureId) ?? DEFAULT_HEAT_SETPOINT_F;
          return Temperature.toCelsius(value);
        })
        .onSet(async (value: CharacteristicValue) => {
          await safeSet(ctx, 'HeatingThresholdTemperature', async () => {
            const fahrenheit = Temperature.toFahrenheit(value as number);
            platform.cache.writeThrough(featureId, fahrenheit);
          });
        });

      const disposer = platform.cache.subscribe([featureId], (changed) => {
        const newValue = changed.get(featureId);
        if (newValue !== undefined) {
          service.updateCharacteristic(Characteristic.HeatingThresholdTemperature, Temperature.toCelsius(newValue));
        }
      });

      ctx.registerDisposer(disposer);
    }

    if (feature.featureTypeCategory === FeatureCategory.CoolSetPoint) {
      service
        .getCharacteristic(Characteristic.CoolingThresholdTemperature)
        .setProps({ minValue: THERMOSTAT_MIN_TEMP_C, maxValue: THERMOSTAT_MAX_TEMP_C })
        .onGet(() => {
          const value = platform.cache.get(featureId) ?? DEFAULT_COOL_SETPOINT_F;
          return Temperature.toCelsius(value);
        })
        .onSet(async (value: CharacteristicValue) => {
          await safeSet(ctx, 'CoolingThresholdTemperature', async () => {
            const fahrenheit = Temperature.toFahrenheit(value as number);
            platform.cache.writeThrough(featureId, fahrenheit);
          });
        });

      const disposer = platform.cache.subscribe([featureId], (changed) => {
        const newValue = changed.get(featureId);
        if (newValue !== undefined) {
          service.updateCharacteristic(Characteristic.CoolingThresholdTemperature, Temperature.toCelsius(newValue));
        }
      });

      ctx.registerDisposer(disposer);

      this.initTargetTemperature(ctx, service, device);
    }
  }

  private initModeCharacteristics(ctx: ServiceHandlerContext, service: HAPService, feature: Feature): void {
    const { platform, Characteristic } = ctx;
    const featureId = feature.id.toString();
    const modes = parseThermostatModes(feature.values);

    const thermostatModeToHomeKit = (mode: ThermostatMode): number => {
      switch (mode) {
        case ThermostatMode.Heat:
          return Characteristic.TargetHeatingCoolingState.HEAT;
        case ThermostatMode.Cool:
          return Characteristic.TargetHeatingCoolingState.COOL;
        case ThermostatMode.Off:
          return Characteristic.TargetHeatingCoolingState.OFF;
        case ThermostatMode.Auto:
        default:
          return Characteristic.TargetHeatingCoolingState.AUTO;
      }
    };

    const homeKitToThermostatMode = (hkState: number): ThermostatMode => {
      switch (hkState) {
        case Characteristic.TargetHeatingCoolingState.HEAT:
          return ThermostatMode.Heat;
        case Characteristic.TargetHeatingCoolingState.COOL:
          return ThermostatMode.Cool;
        case Characteristic.TargetHeatingCoolingState.OFF:
          return ThermostatMode.Off;
        case Characteristic.TargetHeatingCoolingState.AUTO:
        default:
          return ThermostatMode.Auto;
      }
    };

    service
      .getCharacteristic(Characteristic.TargetHeatingCoolingState)
      .onGet(() => {
        const value = platform.cache.get(featureId) ?? 0;
        const mode = getThermostatModeAt(modes, value);
        return thermostatModeToHomeKit(mode);
      })
      .onSet(async (value: CharacteristicValue) => {
        await safeSet(ctx, 'TargetHeatingCoolingState', async () => {
          const targetMode = homeKitToThermostatMode(value as number);
          const index = findThermostatModeIndex(modes, targetMode);
          if (index >= 0) {
            platform.cache.writeThrough(featureId, index);
          }
        });
      });

    const disposer = platform.cache.subscribe([featureId], (changed) => {
      const newValue = changed.get(featureId);
      if (newValue !== undefined) {
        const mode = getThermostatModeAt(modes, newValue);
        service.updateCharacteristic(Characteristic.TargetHeatingCoolingState, thermostatModeToHomeKit(mode));
      }
    });

    ctx.registerDisposer(disposer);
  }

  private initTargetTemperature(ctx: ServiceHandlerContext, service: HAPService, device: Device): void {
    const { platform, Characteristic } = ctx;
    const coolSetPoint = findFeatureByCategory(device, FeatureCategory.CoolSetPoint);
    const heatSetPoint = findFeatureByCategory(device, FeatureCategory.HeatSetPoint);
    const modeFeature = findFeatureByCategory(device, FeatureCategory.ThermostatMode);

    if (!modeFeature) {
      return;
    }

    const modeFeatureId = modeFeature.id.toString();
    const coolFeatureId = coolSetPoint?.id.toString();
    const heatFeatureId = heatSetPoint?.id.toString();
    const modes = parseThermostatModes(modeFeature.values);

    const getTargetTemperature = (): number => {
      const modeValue = platform.cache.get(modeFeatureId) ?? 0;
      const mode = getThermostatModeAt(modes, modeValue);

      if (mode === ThermostatMode.Cool && coolFeatureId) {
        const value = platform.cache.get(coolFeatureId) ?? DEFAULT_COOL_SETPOINT_F;
        return Temperature.toCelsius(value);
      }

      if (mode === ThermostatMode.Heat && heatFeatureId) {
        const value = platform.cache.get(heatFeatureId) ?? DEFAULT_HEAT_SETPOINT_F;
        return Temperature.toCelsius(value);
      }

      if (coolFeatureId && heatFeatureId) {
        const coolValue = platform.cache.get(coolFeatureId) ?? DEFAULT_COOL_SETPOINT_F;
        const heatValue = platform.cache.get(heatFeatureId) ?? DEFAULT_HEAT_SETPOINT_F;
        return (Temperature.toCelsius(coolValue) + Temperature.toCelsius(heatValue)) / 2;
      }

      return DEFAULT_TARGET_TEMPERATURE_C;
    };

    service
      .getCharacteristic(Characteristic.TargetTemperature)
      .setProps({ minValue: THERMOSTAT_MIN_TEMP_C, maxValue: THERMOSTAT_MAX_TEMP_C })
      .onGet(() => getTargetTemperature())
      .onSet(async (value: CharacteristicValue) => {
        await safeSet(ctx, 'TargetTemperature', async () => {
          const modeValue = platform.cache.get(modeFeatureId) ?? 0;
          const mode = getThermostatModeAt(modes, modeValue);
          const fahrenheit = Temperature.toFahrenheit(value as number);

          if (mode === ThermostatMode.Cool && coolFeatureId) {
            platform.cache.writeThrough(coolFeatureId, fahrenheit);
          } else if (mode === ThermostatMode.Heat && heatFeatureId) {
            platform.cache.writeThrough(heatFeatureId, fahrenheit);
          }
        });
      });

    const featureIds = [modeFeatureId, coolFeatureId, heatFeatureId].filter(Boolean) as string[];
    const disposer = platform.cache.subscribe(featureIds, () => {
      service.updateCharacteristic(Characteristic.TargetTemperature, getTargetTemperature());
    });

    ctx.registerDisposer(disposer);
  }
}
