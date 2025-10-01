'use client';
import Button from 'components/common/Button';
import { MaxUint256 } from 'ethers';
import { useCsrRouter } from 'lib/i18n/csr-navigation';
import { useTranslations } from 'next-intl';
import { useCallback, useState } from 'react';
import type { Address } from 'viem';
import { useAccount, useConnect } from 'wagmi';
import { useTokenApproval } from '../../lib/hooks/useTokenApproval';

interface Props {
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'none';
  style?: 'primary' | 'secondary' | 'tertiary' | 'none';
  className?: string;
  redirect?: boolean;
  account?: string;
}

const TOKEN_ADDRESSES: Record<string, Address> = {
  USDT: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // Arbitrum USDT
  USDC: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831', // Arbitrum USDC
  DAI: '0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1', //  Arbitrum DAI
};

const tokenAddress = TOKEN_ADDRESSES['USDT'] || undefined;
type DialogStep = 'idle' | 'loading' | 'error' | 'selecting' | 'form';

const ApproveButton = ({ account, size, style, className, text, redirect }: Props) => {
  const [open, setOpen] = useState(false);
  const t = useTranslations();
  const router = useCsrRouter();

  const [step, setStep] = useState<DialogStep>('idle');
  const [error, setError] = useState<string | null>(null);

  const {
    checkAndRequestApproval,
    isLoading: isApprovalLoading,
    isCheckingAllowance,
    isApprovingTx: isApproving,
    error: approvalError,
    resetError: resetApprovalError,
  } = useTokenApproval({
    tokenAddress: tokenAddress,
    amountToApprove: MaxUint256,
    requiredChainId: 42161,
  });

  const { address } = useAccount();
  const { connectAsync, connectors } = useConnect();

  const handleTriggerClick = useCallback(async () => {
    // setDialogError(null);
    resetApprovalError();

    // handleOpenChange(true);
    setStep('loading');

    await checkAndRequestApproval({
      onSuccess: () => {
        setStep('selecting');
      },
      onError: (err) => {
        // setDialogError(`Approval failed: ${err.message}`);
        // handleOpenChange(false);
      },
      onRequiresApproval: () => {
        setStep('loading');
      },
    });
  }, [
    // setDialogError,
    resetApprovalError,
    // handleOpenChange,
    setStep,
    checkAndRequestApproval,
  ]);

  return (
    <>
      <Button style={style ?? 'primary'} size={size ?? 'md'} className={className} onClick={handleTriggerClick}>
        {text ?? t('common.buttons.connect')}
      </Button>
    </>
  );
};

export default ApproveButton;
