// src/app/bridge/page.tsx
'use client';

import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { WrapInterface } from '@/components/bridge/WrapInterface';
import { UnwrapInterface } from '@/components/bridge/UnwrapInterface';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function BridgePage() {
  const [restrictedTokenMint, setRestrictedTokenMint] = useState<PublicKey | null>(null);
  const { connected } = useWallet();

  const handleMintChange = (mint: string) => {
    try {
      setRestrictedTokenMint(new PublicKey(mint));
    } catch (error) {
      setRestrictedTokenMint(null);
    }
  };

  if (!connected) {
    return (
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">Token Bridge</h1>
        <p className="text-muted-foreground">
          Connect your wallet to start bridging Token2022 tokens
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Token Bridge</h1>
        <p className="text-muted-foreground">
          Wrap Token2022 tokens to make them tradeable on any AMM
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <WrapInterface 
          restrictedTokenMint={restrictedTokenMint}
          onMintChange={handleMintChange}
        />
        <UnwrapInterface restrictedTokenMint={restrictedTokenMint} />
      </div>

      {restrictedTokenMint && (
        <div className="bg-muted p-4 rounded-lg">
          <h3 className="font-semibold mb-2">Bridge Flow</h3>
          <div className="text-sm space-y-1">
            <div>1. <strong>Wrap:</strong> Lock Token2022 → Get bridge tokens</div>
            <div>2. <strong>Trade:</strong> Use bridge tokens on any AMM</div>
            <div>3. <strong>Unwrap:</strong> Burn bridge tokens → Get Token2022 back</div>
          </div>
        </div>
      )}
    </div>
  );
}