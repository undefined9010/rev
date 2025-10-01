import type { TokenAllowanceData } from './allowances';
import analytics from './analytics';
import { isTestnetChain } from './chains';

export type BatchType = 'eip5792' | 'queued';

export const trackBatchRevoke = (
  chainId: number,
  address: string,
  allowances: TokenAllowanceData[],
  tipDollarAmount: string,
  batchType: BatchType,
) => {
  analytics.track('Batch Revoked', {
    chainId,
    address,
    allowances: allowances.length,
    tipDollarAmount: Number(tipDollarAmount),
    batchType,
    isTestnet: isTestnetChain(chainId),
  });
};
