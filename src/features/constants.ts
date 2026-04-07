/**
 * Canonical IOTAS event type names.
 */
export const EVENT_TYPE_NAMES = {
  TEMPERATURE: 'Temperature',
  ON_OFF: 'OnOff',
  LEVEL: 'Level',
  THERMOSTAT_MODE: 'ThermostatMode',
  LOCK: 'Lock',
} as const;

/**
 * Canonical IOTAS feature type names.
 */
export const FEATURE_TYPE_NAMES = {
  LIGHT: 'Light',
  OPERATION_MODE: 'Operation Mode',
  BATTERY: 'Battery',
} as const;

/**
 * Canonical IOTAS feature categories.
 */
export const FEATURE_CATEGORIES = {
  LIGHT: 'light',
  LOCK: 'lock',
  CURRENT_TEMPERATURE: 'current_temperature',
  HEAT_SET_POINT: 'heat_set_point',
  COOL_SET_POINT: 'cool_set_point',
  THERMOSTAT_MODE: 'thermostat_mode',
  BATTERY: 'battery',
  HUMIDITY: 'humidity',
  MOTION: 'motion',
  DOOR_STATE: 'door_state',
} as const;

/**
 * Canonical IOTAS device categories.
 */
export const DEVICE_CATEGORIES = {
  DIMMER: 'dimmer',
} as const;

/**
 * Z-Wave manufacturer IDs for devices with known quirks.
 */
export const ZWAVE_MANUFACTURERS = {
  JASCO: '0x0063',
} as const;

/**
 * Read-only categories still exposed to HomeKit.
 */
export const READ_ONLY_FEATURE_CATEGORIES = new Set<string>([
  FEATURE_CATEGORIES.CURRENT_TEMPERATURE,
  FEATURE_CATEGORIES.BATTERY,
  FEATURE_CATEGORIES.HUMIDITY,
  FEATURE_CATEGORIES.MOTION,
  FEATURE_CATEGORIES.DOOR_STATE,
]);

/**
 * Event types that indicate a controllable core capability.
 */
export const DISCOVERY_EVENT_TYPES = new Set<string>([
  EVENT_TYPE_NAMES.TEMPERATURE,
  EVENT_TYPE_NAMES.ON_OFF,
  EVENT_TYPE_NAMES.LEVEL,
  EVENT_TYPE_NAMES.THERMOSTAT_MODE,
  EVENT_TYPE_NAMES.LOCK,
]);
