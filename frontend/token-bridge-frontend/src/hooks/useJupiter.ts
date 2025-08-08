'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, VersionedTransaction } from '@solana/web3.js';
import { toast } from 'sonner';

interface QuoteResponse {
  inputMint: string;
  inAmount: string;
  outputMint: string;
  outAmount: string;
  otherAmountThreshold: string;
  swapMode: string;
  slippageBps: number;
  platformFee: any;
  priceImpactPct: string;
  routePlan: any[];
}

export function useJupiter() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const [isLoading, setIsLoading] = useState(false);

  const getQuote = async (
    inputMint: string,
    outputMint: string,
    amount: number,
    slippageBps: number = 50
  ): Promise<QuoteResponse | null> => {
    try {
      const url = `${(process.env.NEXT_PUBLIC_JUPITER_API as string)}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error('Failed to get quote');
      }

      return await response.json();
    } catch (error) {
      console.error('Quote error:', error);
      return null;
    }
  };

  const executeSwap = async (quoteResponse: QuoteResponse) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    try {
      // Get swap transaction from Jupiter
      const swapResponse = await fetch(
        `${process.env.NEXT_PUBLIC_JUPITER_API}/swap`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quoteResponse,
            userPublicKey: publicKey.toString(),
            wrapAndUnwrapSol: true,
          }),
        }
      );

      if (!swapResponse.ok) {
        throw new Error('Failed to get swap transaction');
      }

      const { swapTransaction } = await swapResponse.json();

      // Deserialize and send transaction
      const swapTransactionBuf = Buffer.from(swapTransaction, 'base64');
      const transaction = VersionedTransaction.deserialize(swapTransactionBuf);

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');

      toast.success('Swap executed successfully!');
      return signature;
    } catch (error: any) {
      console.error('Swap error:', error);
      toast.error(Swap failed: ${error.message});
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    getQuote,
    executeSwap,
    isLoading
  };
}