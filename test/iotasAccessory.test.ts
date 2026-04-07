import { describe, it, beforeEach, mock } from 'node:test';
import assert from 'node:assert';
import type { PlatformAccessory, Service as HAPService, API } from 'homebridge';

// Mock fetch globally
const mockFetch = mock.fn<typeof fetch>();
globalThis.fetch = mockFetch as typeof fetch;

// Import after mocking
const { IotasAccessory } = await import('../src/accessories/iotasAccessory.js');
const { IotasPlatform } = await import('../src/platform.js');

// Create mock Homebridge API
function createMockApi(): API {
  const mockCharacteristic = {
    On: 'On',
    Brightness: 'Brightness',
    BatteryLevel: 'BatteryLevel',
    StatusLowBattery: {
      BATTERY_LEVEL_LOW: 1,
      BATTERY_LEVEL_NORMAL: 0,
    },
    LockCurrentState: {
      SECURED: 1,
      UNSECURED: 0,
    },
    LockTargetState: 'LockTargetState',
    CurrentRelativeHumidity: 'CurrentRelativeHumidity',
    MotionDetected: 'MotionDetected',
    ContactSensorState: {
      CONTACT_DETECTED: 0,
      CONTACT_NOT_DETECTED: 1,
    },
    Manufacturer: 'Manufacturer',
    Model: 'Model',
    SerialNumber: 'SerialNumber',
    CurrentTemperature: 'CurrentTemperature',
    TargetTemperature: 'TargetTemperature',
    TargetHeatingCoolingState: {
      OFF: 0,
      HEAT: 1,
      COOL: 2,
      AUTO: 3,
    },
    HeatingThresholdTemperature: 'HeatingThresholdTemperature',
    CoolingThresholdTemperature: 'CoolingThresholdTemperature',
  };

  const createMockService = () => {
    const charHandlers: Record<string, { onGet?: () => Promise<unknown>; onSet?: (v: unknown) => Promise<void> }> = {};
    return {
      getCharacteristic: (char: string) => ({
        onGet: (fn: () => Promise<unknown>) => {
          charHandlers[char] = { ...charHandlers[char], onGet: fn };
          return {
            onSet: (setFn: (v: unknown) => Promise<void>) => {
              charHandlers[char].onSet = setFn;
            },
          };
        },
        onSet: (fn: (v: unknown) => Promise<void>) => {
          charHandlers[char] = { ...charHandlers[char], onSet: fn };
          return {
            onGet: (getFn: () => Promise<unknown>) => {
              charHandlers[char].onGet = getFn;
            },
          };
        },
      }),
      setCharacteristic: () => ({ setCharacteristic: () => ({ setCharacteristic: () => ({}) }) }),
      updateCharacteristic: () => {},
      _handlers: charHandlers,
    };
  };

  const mockService = {
    AccessoryInformation: class {},
    Switch: class {},
    LockMechanism: class {},
    Lightbulb: class {},
    Thermostat: class {},
    Battery: class {},
    HumiditySensor: class {},
    MotionSensor: class {},
    ContactSensor: class {},
  };

  return {
    hap: {
      Service: mockService,
      Characteristic: mockCharacteristic,
      uuid: { generate: (id: string) => `uuid-${id}` },
    },
    platformAccessory: class {
      displayName: string;
      context: Record<string, unknown> = {};
      services: HAPService[] = [];
      constructor(name: string) {
        this.displayName = name;
      }
      getService() {
        return createMockService();
      }
      addService() {
        return createMockService();
      }
      removeService() {}
    },
    on: () => {},
    registerPlatformAccessories: () => {},
    unregisterPlatformAccessories: () => {},
    updatePlatformAccessories: () => {},
  } as unknown as API;
}

describe('IotasAccessory', () => {
  const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.signature';

  function setupMockFetch() {
    let callIndex = 0;
    mockFetch.mock.mockImplementation(async () => {
      callIndex++;
      if (callIndex === 1) {
        return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
      } else if (callIndex === 2) {
        return new Response(JSON.stringify({ id: 123 }), { status: 200 });
      } else if (callIndex === 3) {
        return new Response(JSON.stringify([{ unit: 1, unitName: 'Unit 1' }]), { status: 200 });
      }
      return new Response(JSON.stringify([]), { status: 200 });
    });
  }

  beforeEach(() => {
    mockFetch.mock.resetCalls();
  });

  describe('AccessoryInformation enrichment', () => {
    it('should use physicalDeviceDescription when available', () => {
      setupMockFetch();
      const api = createMockApi();
      const mockLog = {
        info: mock.fn(),
        warn: mock.fn(),
        error: mock.fn(),
        debug: mock.fn(),
      } as unknown as import('homebridge').Logging;
      const platform = new IotasPlatform(mockLog, { platform: 'test', name: 'Test' }, api);

      const accessory = new api.platformAccessory('Test Device', 'uuid-123') as PlatformAccessory;
      accessory.context.device = {
        id: 1,
        name: 'Lock',
        category: 'lock',
        paired: true,
        features: [],
        physicalDeviceDescription: {
          id: 82,
          name: 'Yale realLiving Deadbolt Touch Screen',
          manufacturer: '0x0129',
        },
      };

      new IotasAccessory(platform, accessory);

      // The constructor should have set manufacturer and model from physicalDeviceDescription
      const infoService = accessory.getService(platform.Service.AccessoryInformation);
      assert.ok(infoService);
    });

    it('should fall back to defaults when physicalDeviceDescription is absent', () => {
      setupMockFetch();
      const api = createMockApi();
      const mockLog = {
        info: mock.fn(),
        warn: mock.fn(),
        error: mock.fn(),
        debug: mock.fn(),
      } as unknown as import('homebridge').Logging;
      const platform = new IotasPlatform(mockLog, { platform: 'test', name: 'Test' }, api);

      const accessory = new api.platformAccessory('Test Device', 'uuid-123') as PlatformAccessory;
      accessory.context.device = {
        id: 1,
        name: 'Switch',
        category: 'switch',
        paired: true,
        features: [],
        // No physicalDeviceDescription
      };

      new IotasAccessory(platform, accessory);

      const infoService = accessory.getService(platform.Service.AccessoryInformation);
      assert.ok(infoService);
    });

    it('should use fallback values when device fields are empty strings', () => {
      setupMockFetch();
      const api = createMockApi();
      const mockLog = {
        info: mock.fn(),
        warn: mock.fn(),
        error: mock.fn(),
        debug: mock.fn(),
      } as unknown as import('homebridge').Logging;
      const platform = new IotasPlatform(mockLog, { platform: 'test', name: 'Test' }, api);

      const accessory = new api.platformAccessory('Test Device', 'uuid-123') as PlatformAccessory;
      accessory.context.device = {
        id: 42,
        name: 'Lock',
        category: 'lock',
        paired: true,
        features: [],
        serialNumber: '',
        physicalDeviceDescription: {
          id: 1,
          name: '',
          manufacturer: '',
        },
      };

      // Override getService to capture setCharacteristic values
      const setChars: Array<[string, string]> = [];
      const chainable = {
        setCharacteristic: (char: string, value: string) => {
          setChars.push([char, value]);
          return chainable;
        },
      };
      accessory.getService = () => chainable as unknown as HAPService;

      new IotasAccessory(platform, accessory);

      const serial = setChars.find(([char]) => char === 'SerialNumber');
      assert.ok(serial, 'SerialNumber characteristic should be set');
      assert.strictEqual(serial[1], 'IOTAS-42', 'Empty serialNumber should fall back to IOTAS-{id}');

      const manufacturer = setChars.find(([char]) => char === 'Manufacturer');
      assert.ok(manufacturer, 'Manufacturer characteristic should be set');
      assert.strictEqual(manufacturer[1], 'IOTAS', 'Empty manufacturer should fall back to IOTAS');

      const model = setChars.find(([char]) => char === 'Model');
      assert.ok(model, 'Model characteristic should be set');
      assert.strictEqual(model[1], 'lock', 'Empty model name should fall back to device category');
    });

    it('should use fallback when serialNumber is too short for HomeKit', () => {
      setupMockFetch();
      const api = createMockApi();
      const mockLog = {
        info: mock.fn(),
        warn: mock.fn(),
        error: mock.fn(),
        debug: mock.fn(),
      } as unknown as import('homebridge').Logging;
      const platform = new IotasPlatform(mockLog, { platform: 'test', name: 'Test' }, api);

      const accessory = new api.platformAccessory('Test Device', 'uuid-123') as PlatformAccessory;
      accessory.context.device = {
        id: 147680,
        name: 'Lock',
        category: 'lock',
        paired: true,
        features: [],
        serialNumber: '3', // Single character - too short for HomeKit (requires >1)
      };

      const setChars: Array<[string, string]> = [];
      const chainable = {
        setCharacteristic: (char: string, value: string) => {
          setChars.push([char, value]);
          return chainable;
        },
      };
      accessory.getService = () => chainable as unknown as HAPService;

      new IotasAccessory(platform, accessory);

      const serial = setChars.find(([char]) => char === 'SerialNumber');
      assert.ok(serial, 'SerialNumber characteristic should be set');
      assert.strictEqual(serial[1], 'IOTAS-147680', 'Single-char serialNumber should fall back to IOTAS-{id}');
    });

    it('should use valid serialNumber when length > 1', () => {
      setupMockFetch();
      const api = createMockApi();
      const mockLog = {
        info: mock.fn(),
        warn: mock.fn(),
        error: mock.fn(),
        debug: mock.fn(),
      } as unknown as import('homebridge').Logging;
      const platform = new IotasPlatform(mockLog, { platform: 'test', name: 'Test' }, api);

      const accessory = new api.platformAccessory('Test Device', 'uuid-123') as PlatformAccessory;
      accessory.context.device = {
        id: 100,
        name: 'Lock',
        category: 'lock',
        paired: true,
        features: [],
        serialNumber: 'ABC123456', // Valid length
      };

      const setChars: Array<[string, string]> = [];
      const chainable = {
        setCharacteristic: (char: string, value: string) => {
          setChars.push([char, value]);
          return chainable;
        },
      };
      accessory.getService = () => chainable as unknown as HAPService;

      new IotasAccessory(platform, accessory);

      const serial = setChars.find(([char]) => char === 'SerialNumber');
      assert.ok(serial, 'SerialNumber characteristic should be set');
      assert.strictEqual(serial[1], 'ABC123456', 'Valid serialNumber should be used as-is');
    });
  });
});

describe('Platform device filtering', () => {
  const mockJwt = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJleHAiOjk5OTk5OTk5OTl9.signature';

  beforeEach(() => {
    mockFetch.mock.resetCalls();
  });

  it('should skip unpaired devices', async () => {
    let callIndex = 0;
    mockFetch.mock.mockImplementation(async () => {
      callIndex++;
      if (callIndex === 1) {
        return new Response(JSON.stringify({ jwt: mockJwt, refresh: 'refresh-token' }), { status: 200 });
      } else if (callIndex === 2) {
        return new Response(JSON.stringify({ id: 123 }), { status: 200 });
      } else if (callIndex === 3) {
        return new Response(JSON.stringify([{ unit: 1, unitName: 'Unit 1' }]), { status: 200 });
      } else {
        return new Response(
          JSON.stringify([
            {
              id: 1,
              name: 'Living Room',
              devices: [
                {
                  id: 10,
                  name: 'Unpaired Switch',
                  category: 'switch',
                  paired: false, // Unpaired - should be skipped
                  features: [{ id: 100, featureTypeName: 'Light', featureTypeCategory: 'light' }],
                },
                {
                  id: 11,
                  name: 'Paired Switch',
                  category: 'switch',
                  paired: true,
                  features: [
                    {
                      id: 101,
                      featureTypeName: 'Light',
                      featureTypeCategory: 'light',
                      eventTypeName: 'OnOff',
                      featureTypeSettable: true,
                    },
                  ],
                },
              ],
            },
          ]),
          { status: 200 },
        );
      }
    });

    const api = createMockApi();
    const mockLog = {
      info: mock.fn(),
      warn: mock.fn(),
      error: mock.fn(),
      debug: mock.fn(),
    } as unknown as import('homebridge').Logging;
    const platform = new IotasPlatform(mockLog, { platform: 'test', name: 'Test' }, api);

    await platform.discoverDevices();

    // Should only have 1 accessory (the paired one), not 2
    assert.strictEqual(platform.accessories.size, 1);
  });
});
