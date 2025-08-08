'use client';

import { CreatePoolInterface } from '@/components/pools/CreatePoolInterface';
import { AddLiquidityInterface } from '@/components/pools/AddLiquidityInterface';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function PoolsPage() {
  const { connected } = useWallet();

  if (!connected) {
    return (
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">Liquidity Pools</h1>
        <p className="text-muted-foreground">
          Connect your wallet to create and manage liquidity pools
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Liquidity Pools</h1>
        <p className="text-muted-foreground">
          Create pools and add liquidity for bridge token trading
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <CreatePoolInterface />
        <AddLiquidityInterface />
      </div>

      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-semibold mb-2">About Orca Splash Pools</h3>
        <div className="text-sm space-y-1">
          <div>• <strong>Simple Setup:</strong> Just set initial price and provide liquidity</div>
          <div>• <strong>Lower Fees:</strong> Optimized for new token launches</div>
          <div>• <strong>Community Friendly:</strong> Perfect for bridge tokens and RWA</div>
          <div>• <strong>Instant Trading:</strong> Start earning fees immediately</div>
        </div>
      </div>
    </div>
  );
}