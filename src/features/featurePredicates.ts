import type { Device, Feature } from '../types.js';
import { DISCOVERY_EVENT_TYPES, FEATURE_CATEGORIES, READ_ONLY_FEATURE_CATEGORIES } from './constants.js';

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
