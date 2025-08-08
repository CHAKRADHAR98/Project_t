'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { 
  TOKEN_PROGRAM_ID, 
  TOKEN_2022_PROGRAM_ID, 
} from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import { useSolana } from '@/contexts/SolanaContext';
import { 
  getUserTokenAccount 
} from '@/lib/program-utils';
import { toast } from 'sonner';

export function useBridge() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { program, bridgeConfig, refreshBridgeConfig } = useSolana();
  const [isLoading, setIsLoading] = useState(false);

  const wrapTokens = async (
    restrictedTokenMint: PublicKey,
    amount: number,
    decimals: number = 9
  ): Promise<string> => {
    if (!program || !publicKey || !bridgeConfig) {
      throw new Error('Wallet not connected or program not initialized');
    }

    setIsLoading(true);
    try {
      const amountBN = new anchor.BN(amount * Math.pow(10, decimals));
      
      // Get only the required accounts - let Anchor handle the rest
      const userRestrictedTokenAccount = getUserTokenAccount(
        restrictedTokenMint, 
        publicKey, 
        true // Token2022
      );
      
      const userBridgeTokenAccount = getUserTokenAccount(
        bridgeConfig.bridgeTokenMint, 
        publicKey, 
        false // Standard SPL
      );

      // Build the transaction with proper account resolution
      const transaction = await (program.methods as any)
        .wrapTokens(amountBN)
        .accounts({
          user: publicKey,
          restrictedTokenMint,
          userRestrictedTokenAccount,
          bridgeTokenMint: bridgeConfig.bridgeTokenMint,
          userBridgeTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success(`Successfully wrapped ${amount} tokens!`);
      await refreshBridgeConfig();
      
      return signature;
    } catch (error: any) {
      console.error('Wrap tokens error:', error);
      toast.error(`Failed to wrap tokens: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const unwrapTokens = async (
    restrictedTokenMint: PublicKey,
    amount: number,
    decimals: number = 9
  ): Promise<string> => {
    if (!program || !publicKey || !bridgeConfig) {
      throw new Error('Wallet not connected or program not initialized');
    }

    setIsLoading(true);
    try {
      const amountBN = new anchor.BN(amount * Math.pow(10, decimals));
      
      // Get only the required accounts - let Anchor handle the rest
      const userRestrictedTokenAccount = getUserTokenAccount(
        restrictedTokenMint, 
        publicKey, 
        true // Token2022
      );
      
      const userBridgeTokenAccount = getUserTokenAccount(
        bridgeConfig.bridgeTokenMint, 
        publicKey, 
        false // Standard SPL
      );

      // Build the transaction with proper account resolution
      const transaction = await program.methods
        .unwrapTokens(amountBN)
        .accounts({
          user: publicKey,
          restrictedTokenMint,
          userRestrictedTokenAccount,
          bridgeTokenMint: bridgeConfig.bridgeTokenMint,
          userBridgeTokenAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          token2022Program: TOKEN_2022_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      const signature = await sendTransaction(transaction, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success(`Successfully unwrapped ${amount} tokens!`);
      await refreshBridgeConfig();
      
      return signature;
    } catch (error: any) {
      console.error('Unwrap tokens error:', error);
      toast.error(`Failed to unwrap tokens: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    wrapTokens,
    unwrapTokens,
    isLoading
  };
}