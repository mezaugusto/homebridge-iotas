import type { PlatformAccessory, Service as HAPService } from 'homebridge';

export function getOrAddService<T extends HAPService>(
  accessory: PlatformAccessory,
  serviceType: unknown,
  name: string,
): T {
  const acc = accessory as unknown as {
    getService: (type: unknown) => T | null;
    addService: (type: unknown, displayName: string) => T;
  };

  const existing = acc.getService(serviceType);
  if (existing) {
    return existing;
  }

  return acc.addService(serviceType, name);
}
