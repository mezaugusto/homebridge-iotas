import type { PlatformConfig } from 'homebridge';

export interface IotasConfig extends PlatformConfig {
  username: string;
  password: string;
  unit?: string;
}

export type Rooms = Room[];

export interface Room {
  id: number;
  unit: number;
  name: string;
  devices: Device[];
}

export interface PhysicalDeviceDescription {
  id: number;
  name: string;
  manufacturer: string;
  model: string;
  secure: boolean;
  movable: boolean;
  external: boolean;
  protocol: string;
  deviceSpecificKey: boolean;
  isActive: boolean;
}

export interface Device {
  id: number;
  room: number;
  roomName?: string;
  deviceTemplateId: number;
  deviceType: number;
  triggerTags?: string[];
  name: string;
  category: string;
  icon?: string;
  active: boolean;
  movable: boolean;
  secure: boolean;
  paired: boolean;
  serialNumber?: string;
  features: Feature[];
  physicalDevice?: number;
  physicalDeviceDescription?: PhysicalDeviceDescription;
}

/**
 * Feature interface.
 * Note: Many fields are only present when the parent device is paired.
 * Unpaired devices have template features with only base fields.
 */
export interface Feature {
  // Base fields (always present)
  id: number;
  device: number;
  featureType: number;
  featureTypeName: string;
  featureTypeCategory: string;
  name: string;
  isLight: boolean;

  // Fields only present when device is paired
  eventType?: number;
  eventTypeName?: string;
  physical?: number;
  physicalFeatureDescription?: number;
  featureTypeSettable?: boolean;
  value?: number;
  values?: string;

  // Optional UI state
  uiStoredValue?: number;
}

export interface Residency {
  id: string;
  accountId: number;
  unit: number;
  buildingId: number;
  unitName: string;
  dateFrom: string;
  tenant: boolean;
  unitAdmin: boolean;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  createdAt: string;
  suspended: boolean;
  account: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    hasPassword: boolean;
  };
}

export interface AuthResponse {
  jwt: string;
  refresh: string;
}

export interface AccountResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  hasPassword?: boolean;
  phoneNumber?: string;
  passwordSetAt?: string;
  passwordFirstSetAt?: string;
  createdAt?: string;
  keepConnected?: boolean;
  shareData?: boolean;
  accessibilityColor?: boolean;
  onboardingComplete?: boolean;
  soSecureRegistered?: boolean;
  phoneNumberVerified?: boolean;
  isAdmin?: boolean;
  isSuperAdmin?: boolean;
  mfaEnabled?: boolean;
  mfaPopup?: boolean;
  showPairingInstructions?: boolean;
}
