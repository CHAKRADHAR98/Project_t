'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Connection, PublicKey } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program } from '@coral-xyz/anchor';
import { getProgram } from '@/lib/anchor-setup';
import type { BridgeConfig } from '@/lib/anchor-setup';
import { getBridgeConfigPDA } from '@/lib/program-utils';

interface SolanaContextType {
  program: Program<any> | null;
  bridgeConfig: BridgeConfig | null;
  isLoading: boolean;
  refreshBridgeConfig: () => Promise<void>;
}

const SolanaContext = createContext<SolanaContextType>({
  program: null,
  bridgeConfig: null,
  isLoading: true,
  refreshBridgeConfig: async () => {},
});

export function SolanaProvider({ children }: { children: React.ReactNode }) {
  const { wallet } = useWallet();
  const { connection } = useConnection();
  const [program, setProgram] = useState<Program<any> | null>(null);
  const [bridgeConfig, setBridgeConfig] = useState<BridgeConfig | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (wallet?.adapter) {
      try {
        const prog = getProgram(connection, wallet.adapter as any);
        setProgram(prog);
      } catch (error) {
        console.error('Failed to initialize program:', error);
        setProgram(null);
      }
    } else {
      setProgram(null);
    }
  }, [wallet, connection]);

  const refreshBridgeConfig = async () => {
    if (!program) return;
    
    try {
      setIsLoading(true);
      const [bridgeConfigPDA] = getBridgeConfigPDA();
      
      // Fix: Use proper account fetching with type assertion
      // Replace 'bridgeConfig' with the actual account name from your Anchor IDL
      const accountData = await (program.account as any).bridgeConfig.fetch(bridgeConfigPDA);
      
      // Transform the raw account data to our TypeScript interface
      const config: BridgeConfig = {
        authority: accountData.authority,
        bump: accountData.bump,
        bridgeTokenMint: accountData.bridgeTokenMint,
        approvedHookPrograms: accountData.approvedHookPrograms,
        totalLockedAmount: accountData.totalLockedAmount,
        isActive: accountData.isActive,
      };
      
      setBridgeConfig(config);
    } catch (error) {
      console.error('Failed to fetch bridge config:', error);
      setBridgeConfig(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (program) {
      refreshBridgeConfig();
    } else {
      setIsLoading(false);
    }
  }, [program]);

  return (
    <SolanaContext.Provider
      value={{
        program,
        bridgeConfig,
        isLoading,
        refreshBridgeConfig,
      }}
    >
      {children}
    </SolanaContext.Provider>
  );
}

export const useSolana = () => {
  const context = useContext(SolanaContext);
  if (!context) {
    throw new Error('useSolana must be used within a SolanaProvider');
  }
  return context;
};