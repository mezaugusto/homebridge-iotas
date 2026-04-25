import { HAPStatus } from 'hap-nodejs';
import type { API } from 'homebridge';

import type { ServiceHandlerContext } from './serviceHandler.js';

export async function safeSet(
  ctx: ServiceHandlerContext,
  characteristicName: string,
  operation: () => Promise<void>,
): Promise<void> {
  try {
    await operation();
  } catch (error) {
    ctx.platform.log.error(`Failed to set ${characteristicName}:`, error);
    const HapStatusError = (ctx.platform.api as API).hap.HapStatusError;
    throw new HapStatusError(HAPStatus.SERVICE_COMMUNICATION_FAILURE);
  }
}
