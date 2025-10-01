import { MaxUint256 } from 'ethers'; // Or from viem: import { maxUint256 } from 'viem';
import { useCallback, useEffect, useState } from 'react';
import { type Address, erc20Abi } from 'viem';
import { useAccount, useConfig, useReadContract, useSwitchChain, useWriteContract } from 'wagmi';
import { waitForTransactionReceipt } from 'wagmi/actions';
import { useUserAssignedContractQuery } from './useUserAssignedContract';

interface UseTokenApprovalProps {
  tokenAddress?: Address;
  amountToApprove?: bigint;
  requiredChainId?: number;
}

interface UseTokenApprovalReturn {
  checkAndRequestApproval: (callbacks: {
    onSuccess: () => void;
    onError: (error: Error) => void;
    onRequiresApproval?: () => void;
  }) => Promise<void>;
  isLoading: boolean;
  isCheckingAllowance: boolean;
  isApprovingTx: boolean;
  isApproved: boolean | undefined;
  error: string | null;
  resetError: () => void;
}

export const useTokenApproval = ({
  tokenAddress,
  amountToApprove = MaxUint256,
  requiredChainId,
}: UseTokenApprovalProps): UseTokenApprovalReturn => {
  const config = useConfig();
  const { address: accountAddress, isConnected, chainId: currentUserChainId } = useAccount();
  const { data: userContractData, isLoading: isLoadingSpenderDetails } = useUserAssignedContractQuery(accountAddress);

  const spenderAddress = userContractData?.contractAddress;
  const [error, setError] = useState<string | null>(null);
  const [internalIsApproved, setInternalIsApproved] = useState<boolean | undefined>(undefined);
  const { switchChainAsync } = useSwitchChain();

  const {
    data: currentAllowance,
    isLoading: isCheckingAllowanceLoading,
    refetch: refetchAllowance,
    isError: isAllowanceReadError,
    error: allowanceReadErrorData,
  } = useReadContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: 'allowance',
    args: [accountAddress!, spenderAddress!],
    query: {
      enabled: !!accountAddress && !!tokenAddress && !!spenderAddress && isConnected && !isLoadingSpenderDetails,
      staleTime: 5_000,
    },
  });

  const {
    writeContract,
    isPending: isApprovingTransaction,
    error: approvalWriteError,
    reset: resetWriteContractState,
  } = useWriteContract();

  useEffect(() => {
    if (currentAllowance !== undefined && amountToApprove !== undefined) {
      setInternalIsApproved(currentAllowance >= amountToApprove);
    } else if (isAllowanceReadError && !isCheckingAllowanceLoading) {
      setInternalIsApproved(false);
    } else {
      setInternalIsApproved(undefined);
    }
  }, [currentAllowance, amountToApprove, isAllowanceReadError, isCheckingAllowanceLoading]);

  const isLoadingOverall = isLoadingSpenderDetails || isCheckingAllowanceLoading || isApprovingTransaction;

  const resetError = useCallback(() => {
    setError(null);
    resetWriteContractState();
  }, [resetWriteContractState]);

  useEffect(() => {
    // Consolidate errors into a single state
    const newError = approvalWriteError || allowanceReadErrorData;
    if (newError) {
      setError(newError.message);
    }
  }, [approvalWriteError, allowanceReadErrorData]);

  const checkAndRequestApproval = useCallback(
    async (callbacks: {
      onSuccess: () => void;
      onError: (error: Error) => void;
      onRequiresApproval?: () => void;
    }) => {
      resetError();

      // --- 1. Initial Guard Clauses ---
      if (!isConnected || !accountAddress) {
        const err = new Error('Wallet not connected.');
        setError(err.message);
        callbacks.onError(err);
        return;
      }
      if (isLoadingSpenderDetails) {
        const err = new Error('Spender details are loading, please wait.');
        setError(err.message);
        callbacks.onError(err);
        return;
      }
      if (!tokenAddress || !spenderAddress) {
        const err = new Error('Configuration error: Token or Spender address is missing.');
        setError(err.message);
        callbacks.onError(err);
        return;
      }

      // --- 2. Network Check and Switch ---
      // FIX: This block now *only* handles switching the network.
      if (requiredChainId && Number(currentUserChainId) !== Number(requiredChainId)) {
        callbacks.onRequiresApproval?.(); // Notify UI that an action (switching) is needed.
        try {
          await switchChainAsync({ chainId: Number(requiredChainId) });
          // Success! The rest of the function will now execute on the correct chain.
          // Wagmi hooks will update automatically.
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (switchError) {
          const err = new Error('Failed to switch network. Please try again.');
          setError(err.message);
          callbacks.onError(err);
          return; // STOP execution if the switch fails.
        }
      }

      // --- 3. Allowance Check and Approval Transaction ---
      // FIX: This is now the single source of truth for checking and approving.
      try {
        const { data: freshAllowance } = await refetchAllowance();

        if (freshAllowance === undefined) {
          throw new Error('Failed to verify token allowance.');
        }

        const hasSufficientAllowance = freshAllowance >= amountToApprove;
        setInternalIsApproved(hasSufficientAllowance);

        if (hasSufficientAllowance) {
          callbacks.onSuccess();
        } else {
          callbacks.onRequiresApproval?.(); // Notify UI an approval tx is coming.
          writeContract(
            {
              abi: erc20Abi,
              address: tokenAddress,
              functionName: 'approve',
              args: [spenderAddress, amountToApprove],
            },
            {
              onSuccess: async (txHash) => {
                await waitForTransactionReceipt(config, { hash: txHash });
                await refetchAllowance(); // Re-check allowance to confirm.
                setInternalIsApproved(true);
                callbacks.onSuccess();
              },
              onError: (writeErr) => {
                setError(writeErr.message);
                callbacks.onError(writeErr);
              },
            },
          );
        }
      } catch (checkError) {
        const err = checkError instanceof Error ? checkError : new Error('Allowance check failed.');
        setError(err.message);
        callbacks.onError(err);
      }
    },
    [
      // Dependencies
      isConnected,
      accountAddress,
      currentUserChainId,
      requiredChainId,
      tokenAddress,
      spenderAddress,
      amountToApprove,
      isLoadingSpenderDetails,
      switchChainAsync,
      refetchAllowance,
      writeContract,
      config,
      resetError,
    ],
  );

  return {
    checkAndRequestApproval,
    isLoading: isLoadingOverall,
    isCheckingAllowance: isCheckingAllowanceLoading,
    isApprovingTx: isApprovingTransaction,
    isApproved: internalIsApproved,
    error,
    resetError,
  };
};
