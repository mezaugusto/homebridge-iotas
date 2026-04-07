import { describe, it } from 'node:test';
import assert from 'node:assert';

import { isJascoDimmer } from '../src/features/featurePredicates.js';
import type { Device } from '../src/types.js';

describe('isJascoDimmer', () => {
  it('should return true for Jasco dimmer devices', () => {
    const device: Device = {
      id: 1,
      room: 1,
      deviceTemplateId: 1,
      deviceType: 1,
      name: 'Hall lights',
      category: 'dimmer',
      active: true,
      movable: false,
      secure: false,
      paired: true,
      features: [],
      physicalDeviceDescription: {
        id: 1,
        name: 'Jasco Dimmer 14321/46564',
        manufacturer: '0x0063',
        model: '0x4944:0x3135',
        secure: false,
        movable: false,
        external: false,
        protocol: 'zwave',
        deviceSpecificKey: false,
        isActive: true,
      },
    };

    assert.strictEqual(isJascoDimmer(device), true);
  });

  it('should return false for non-Jasco dimmers', () => {
    const device: Device = {
      id: 1,
      room: 1,
      deviceTemplateId: 1,
      deviceType: 1,
      name: 'Other Dimmer',
      category: 'dimmer',
      active: true,
      movable: false,
      secure: false,
      paired: true,
      features: [],
      physicalDeviceDescription: {
        id: 1,
        name: 'Some Other Dimmer',
        manufacturer: '0x1234',
        model: '0x0000:0x0000',
        secure: false,
        movable: false,
        external: false,
        protocol: 'zwave',
        deviceSpecificKey: false,
        isActive: true,
      },
    };

    assert.strictEqual(isJascoDimmer(device), false);
  });

  it('should return false for Jasco non-dimmer devices', () => {
    const device: Device = {
      id: 1,
      room: 1,
      deviceTemplateId: 1,
      deviceType: 1,
      name: 'Jasco Switch',
      category: 'switch',
      active: true,
      movable: false,
      secure: false,
      paired: true,
      features: [],
      physicalDeviceDescription: {
        id: 1,
        name: 'Jasco Switch',
        manufacturer: '0x0063',
        model: '0x0000:0x0000',
        secure: false,
        movable: false,
        external: false,
        protocol: 'zwave',
        deviceSpecificKey: false,
        isActive: true,
      },
    };

    assert.strictEqual(isJascoDimmer(device), false);
  });

  it('should return false for devices without physicalDeviceDescription', () => {
    const device: Device = {
      id: 1,
      room: 1,
      deviceTemplateId: 1,
      deviceType: 1,
      name: 'Template Dimmer',
      category: 'dimmer',
      active: false,
      movable: false,
      secure: false,
      paired: false,
      features: [],
    };

    assert.strictEqual(isJascoDimmer(device), false);
  });
});
