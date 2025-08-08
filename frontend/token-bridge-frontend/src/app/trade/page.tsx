'use client';

import { SwapInterface } from '@/components/trading/SwapInterface';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { useSolana } from '@/contexts/SolanaContext';

export default function TradePage() {
  const { connected } = useWallet();
  const { bridgeConfig } = useSolana();

  if (!connected) {
    return (
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">Token Trading</h1>
        <p className="text-muted-foreground">
          Connect your wallet to start trading bridge tokens
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Trade Tokens</h1>
        <p className="text-muted-foreground">
          Swap bridge tokens using Jupiter aggregation
        </p>
      </div>

      <SwapInterface />

      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-semibold mb-2">About Bridge Token Trading</h3>
        <div className="text-sm space-y-1">
          <div>• Bridge tokens are standard SPL tokens</div>
          <div>• Trade on any AMM - Jupiter, Raydium, Orca</div>
          <div>• 1:1 backed by locked Token2022 tokens</div>
          <div>• Unwrap anytime to get original tokens back</div>
        </div>
      </div>

      {bridgeConfig && (
        <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
          <div className="text-sm font-medium">Bridge Token Address:</div>
          <div className="text-sm font-mono break-all">
            {bridgeConfig.bridgeTokenMint.toString()}
          </div>
        </div>
      )}
    </div>
  );
}