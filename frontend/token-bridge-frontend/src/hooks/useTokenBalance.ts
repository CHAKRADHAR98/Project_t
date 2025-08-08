'use client';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { useState, useEffect } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { getAccount, getMint } from '@solana/spl-token';
import { getUserTokenAccount } from '@/lib/program-utils';

export function useTokenBalance(
  mintAddress: PublicKey | null,
  isToken2022: boolean = false
) {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<number>(0);
  const [decimals, setDecimals] = useState<number>(9);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!mintAddress || !publicKey) {
      setBalance(0);
      return;
    }

    const fetchBalance = async () => {
      setIsLoading(true);
      try {
        // Get mint info for decimals
        const mintInfo = await getMint(
          connection,
          mintAddress,
          'confirmed',
          isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID
        );
        setDecimals(mintInfo.decimals);

        // Get user token account
        const tokenAccount = getUserTokenAccount(mintAddress, publicKey, isToken2022);

        try {
          const accountInfo = await getAccount(
            connection,
            tokenAccount,
            'confirmed',
            isToken2022 ? TOKEN_2022_PROGRAM_ID : TOKEN_PROGRAM_ID
          );
          setBalance(Number(accountInfo.amount) / Math.pow(10, mintInfo.decimals));
        } catch (error) {
          // Account doesn't exist, balance is 0
          setBalance(0);
        }
      } catch (error) {
        console.error('Error fetching balance:', error);
        setBalance(0);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBalance();
  }, [mintAddress, publicKey, connection, isToken2022]);

  return { balance, decimals, isLoading };
}