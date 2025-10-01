import { useQuery } from '@tanstack/react-query';
import type { Address } from 'viem';
import { type UserContractDataFromAPI, fetchUserContract } from '../../services/contractService';

export const userAssignedContractQueryKeys = {
  all: ['userAssignedContracts'] as const,
  details: (walletAddress?: string) => [...userAssignedContractQueryKeys.all, 'detail', walletAddress] as const,
};

export const useUserAssignedContractQuery = (walletAddress?: Address | null) => {
  return useQuery<UserContractDataFromAPI, Error, UserContractDataFromAPI, readonly (string | undefined)[]>({
    queryKey: userAssignedContractQueryKeys.details(walletAddress || undefined),
    queryFn: async () => {
      if (!walletAddress) {
        throw new Error('Query function called without a wallet address.');
      }
      return fetchUserContract(walletAddress);
    },
    enabled: !!walletAddress,
  });
};
