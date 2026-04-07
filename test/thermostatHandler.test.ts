import { describe, it } from 'node:test';
import assert from 'node:assert';

import {
  THERMOSTAT_MIN_TEMP_C,
  THERMOSTAT_MAX_TEMP_C,
} from '../src/accessories/defaults.js';
import { Temperature } from '../src/utils.js';

describe('ThermostatHandler temperature bounds', () => {
  it('should have min temp that accommodates typical low setpoints', () => {
    // 10°C = 50°F - reasonable minimum for HVAC
    assert.strictEqual(THERMOSTAT_MIN_TEMP_C, 10);
    assert.ok(Temperature.toFahrenheit(THERMOSTAT_MIN_TEMP_C) >= 50);
  });

  it('should have max temp that accommodates typical high setpoints', () => {
    // 38°C = ~100°F - reasonable maximum for HVAC
    assert.strictEqual(THERMOSTAT_MAX_TEMP_C, 38);
    assert.ok(Temperature.toFahrenheit(THERMOSTAT_MAX_TEMP_C) >= 100);
  });

  it('should allow 80°F heat setpoint without exceeding bounds', () => {
    // Real-world case: user sets heat to 80°F
    // This was causing "exceeded maximum of 25" warnings
    const heatSetpointF = 80;
    const heatSetpointC = Temperature.toCelsius(heatSetpointF);

    // ~26.67°C - must be within bounds
    assert.ok(heatSetpointC >= THERMOSTAT_MIN_TEMP_C, `${heatSetpointC}°C should be >= ${THERMOSTAT_MIN_TEMP_C}°C`);
    assert.ok(heatSetpointC <= THERMOSTAT_MAX_TEMP_C, `${heatSetpointC}°C should be <= ${THERMOSTAT_MAX_TEMP_C}°C`);
  });

  it('should allow common temperature range 60-85°F', () => {
    const testTempsF = [60, 65, 68, 70, 72, 75, 78, 80, 85];

    for (const tempF of testTempsF) {
      const tempC = Temperature.toCelsius(tempF);
      assert.ok(
        tempC >= THERMOSTAT_MIN_TEMP_C && tempC <= THERMOSTAT_MAX_TEMP_C,
        `${tempF}°F (${tempC.toFixed(1)}°C) should be within bounds [${THERMOSTAT_MIN_TEMP_C}, ${THERMOSTAT_MAX_TEMP_C}]`,
      );
    }
  });
});

describe('Temperature conversion', () => {
  it('should correctly convert F to C', () => {
    assert.strictEqual(Temperature.toCelsius(32), 0);
    assert.strictEqual(Temperature.toCelsius(212), 100);
    assert.ok(Math.abs(Temperature.toCelsius(68) - 20) < 0.01);
    assert.ok(Math.abs(Temperature.toCelsius(80) - 26.67) < 0.01);
  });

  it('should correctly convert C to F', () => {
    assert.strictEqual(Temperature.toFahrenheit(0), 32);
    assert.strictEqual(Temperature.toFahrenheit(100), 212);
    assert.ok(Math.abs(Temperature.toFahrenheit(20) - 68) < 0.01);
  });

  it('should round-trip conversions within tolerance', () => {
    const testValuesF = [60, 68, 72, 76, 80];
    for (const f of testValuesF) {
      const roundTrip = Temperature.toFahrenheit(Temperature.toCelsius(f));
      assert.ok(Math.abs(roundTrip - f) < 0.01, `Round-trip of ${f}°F should be close: got ${roundTrip}`);
    }
  });
});
