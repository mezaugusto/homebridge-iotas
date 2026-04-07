import type { Device, Feature } from '../types.js';
import {
  DEVICE_CATEGORIES,
  DISCOVERY_EVENT_TYPES,
  FEATURE_CATEGORIES,
  READ_ONLY_FEATURE_CATEGORIES,
  ZWAVE_MANUFACTURERS,
} from './constants.js';

export function isReadOnlyFeatureCategory(category: string): boolean {
  return READ_ONLY_FEATURE_CATEGORIES.has(category);
}

export function isSupportedFeature(feature: Feature): boolean {
  return Boolean(feature.featureTypeSettable) || isReadOnlyFeatureCategory(feature.featureTypeCategory);
}

export function isDiscoverableFeature(feature: Feature): boolean {
  return (
    (DISCOVERY_EVENT_TYPES.has(feature.eventTypeName ?? '') &&
      (Boolean(feature.featureTypeSettable) ||
        feature.featureTypeCategory === FEATURE_CATEGORIES.CURRENT_TEMPERATURE)) ||
    isReadOnlyFeatureCategory(feature.featureTypeCategory)
  );
}

export function isSupportedDevice(device: Device): boolean {
  if (!device.paired) {
    return false;
  }

  return device.features.some(isDiscoverableFeature);
}

/**
 * Detect Jasco dimmers which require retry logic for off commands.
 * These devices sometimes fail to respond to a single off command due to Z-Wave mesh reliability.
 */
export function isJascoDimmer(device: Device): boolean {
  return (
    device.category === DEVICE_CATEGORIES.DIMMER &&
    device.physicalDeviceDescription?.manufacturer === ZWAVE_MANUFACTURERS.JASCO
  );
}
