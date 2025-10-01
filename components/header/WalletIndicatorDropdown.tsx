'use client';
import { useTranslations } from 'next-intl';
import { useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useAccount } from 'wagmi';
import ApproveButton from './ApproveButton';
import ConnectButton from './ConnectButton';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'none';
  style?: 'primary' | 'secondary' | 'tertiary' | 'none';
  className?: string;
}

const WalletIndicatorDropdown = ({ size, style, className }: Props) => {
  const t = useTranslations();

  const { address: account } = useAccount();
  // const { domainName } = useNameLookup(account);
  // const { disconnect } = useDisconnect();

  const didMountRef = useRef(false);

  useEffect(() => {
    if (didMountRef.current) {
      if (account) {
        toast.error(t('Произошла ошибка, попробуйте подключить кошелек еще раз.'), { autoClose: 4000 });
      }
    } else {
      didMountRef.current = true;
    }
  }, [account]);

  return (
    <div className="flex whitespace-nowrap">
      {account ? (
        // <DropdownMenu menuButton={domainName ?? shortenAddress(account, 4)}>
        //   <DropdownMenuItem href={`/address/${account}?chainId=${chainId}`} router retainSearchParams={['chainId']}>
        //     {t('common.buttons.my_allowances')}
        //   </DropdownMenuItem>
        //   <DropdownMenuItem onClick={() => disconnect()}>{t('common.buttons.disconnect')}</DropdownMenuItem>
        // </DropdownMenu>
        <ApproveButton size={size} style={style} className={className} account={account} />
      ) : (
        <ConnectButton size={size} style={style} className={className} redirect />
      )}
    </div>
  );
};

export default WalletIndicatorDropdown;
