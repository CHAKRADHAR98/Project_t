'use client';

import { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { 
  Keypair, 
  PublicKey, 
  SystemProgram, 
  Transaction,
  sendAndConfirmTransaction 
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  createInitializeMintInstruction,
  createMintToInstruction,
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  getMintLen,
  ExtensionType
} from '@solana/spl-token';
import { useSolana } from '@/contexts/SolanaContext';
import { getWhitelistPDA, getInitializeWhitelistAccounts, getManageWhitelistAccounts } from '@/lib/program-utils';
import { toast } from 'sonner';

export function useToken2022() {
  const { publicKey, sendTransaction } = useWallet();
  const { connection } = useConnection();
  const { program } = useSolana();
  const [isLoading, setIsLoading] = useState(false);

  const createToken2022 = async (
    name: string,
    symbol: string,
    decimals: number,
    initialSupply: number,
    enableWhitelist: boolean = false
  ) => {
    if (!publicKey) {
      throw new Error('Wallet not connected');
    }

    setIsLoading(true);
    try {
      // Generate mint keypair
      const mintKeypair = Keypair.generate();
      const mint = mintKeypair.publicKey;

      // Calculate space for mint account
      const extensions = enableWhitelist ? [ExtensionType.TransferHook] : [];
      const mintSpace = getMintLen(extensions);
      
      // Calculate rent
      const mintRent = await connection.getMinimumBalanceForRentExemption(mintSpace);

      // Create transaction
      const transaction = new Transaction();

      // Create mint account
      transaction.add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mint,
          space: mintSpace,
          lamports: mintRent,
          programId: TOKEN_2022_PROGRAM_ID,
        })
      );

      // Initialize mint
      transaction.add(
        createInitializeMintInstruction(
          mint,
          decimals,
          publicKey, // mint authority
          null, // freeze authority
          TOKEN_2022_PROGRAM_ID
        )
      );

      // Create user's associated token account
      const userTokenAccount = getAssociatedTokenAddressSync(
        mint,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      transaction.add(
        createAssociatedTokenAccountInstruction(
          publicKey, // payer
          userTokenAccount,
          publicKey, // owner
          mint,
          TOKEN_2022_PROGRAM_ID
        )
      );

      // Mint initial supply to user
      if (initialSupply > 0) {
        const amount = initialSupply * Math.pow(10, decimals);
        transaction.add(
          createMintToInstruction(
            mint,
            userTokenAccount,
            publicKey, // mint authority
            amount,
            [],
            TOKEN_2022_PROGRAM_ID
          )
        );
      }

      // Send transaction
      const signature = await sendTransaction(transaction, connection, {
        signers: [mintKeypair]
      });
      
      await connection.confirmTransaction(signature, 'confirmed');

      // Initialize whitelist if enabled
      if (enableWhitelist && program) {
        try {
          const accounts = getInitializeWhitelistAccounts(publicKey, mint);
          
          const whitelistTx = await program.methods
            .initializeWhitelist()
            .accounts(accounts)
            .transaction();

          const whitelistSignature = await sendTransaction(whitelistTx, connection);
          await connection.confirmTransaction(whitelistSignature, 'confirmed');
          
          toast.success('Token created with whitelist enabled!');
        } catch (error) {
          console.error('Failed to initialize whitelist:', error);
          toast.success('Token created, but whitelist initialization failed');
        }
      } else {
        toast.success('Token2022 created successfully!');
      }

      return {
        mint,
        signature,
        userTokenAccount,
      };
    } catch (error: any) {
      console.error('Create token error:', error);
      toast.error(`Failed to create token: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const addToWhitelist = async (mint: PublicKey, userToAdd: PublicKey) => {
    if (!program || !publicKey) {
      throw new Error('Program or wallet not available');
    }

    setIsLoading(true);
    try {
      const accounts = getManageWhitelistAccounts(publicKey, mint);
      
      const tx = await program.methods
        .addToWhitelist(userToAdd)
        .accounts(accounts)
        .transaction();

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, 'confirmed');
      
      toast.success('User added to whitelist!');
      return signature;
    } catch (error: any) {
      console.error('Add to whitelist error:', error);
      toast.error(`Failed to add to whitelist: ${error.message}`);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createToken2022,
    addToWhitelist,
    isLoading
  };
}