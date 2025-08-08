'use client';

import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { CreateToken2022 } from '@/components/token/CreateToken2022';
import { WhitelistManager } from '@/components/token/WhitelistManager';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function CreateTokenPage() {
  const [createdMint, setCreatedMint] = useState<PublicKey | null>(null);
  const [showWhitelistManager, setShowWhitelistManager] = useState(false);
  const { connected } = useWallet();

  const handleTokenCreated = (mint: PublicKey) => {
    setCreatedMint(mint);
    setShowWhitelistManager(true);
  };

  if (!connected) {
    return (
      <div className="text-center space-y-6">
        <h1 className="text-3xl font-bold">Create Token2022</h1>
        <p className="text-muted-foreground">
          Connect your wallet to create Token2022 tokens with Transfer Hooks
        </p>
        <WalletMultiButton />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Create Token2022</h1>
        <p className="text-muted-foreground">
          Create Token2022 tokens with optional Transfer Hook support
        </p>
      </div>

      <CreateToken2022 onTokenCreated={handleTokenCreated} />

      {createdMint && showWhitelistManager && (
        <WhitelistManager mint={createdMint} />
      )}

      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-semibold mb-2">What are Token2022 Transfer Hooks?</h3>
        <div className="text-sm space-y-1">
          <div>• <strong>Whitelist:</strong> Only approved addresses can receive tokens</div>
          <div>• <strong>KYC:</strong> Enforce identity verification for transfers</div>
          <div>• <strong>Transfer Limits:</strong> Set maximum transfer amounts</div>
          <div>• <strong>Perfect for RWA:</strong> Real-world assets need compliance controls</div>
        </div>
      </div>
    </div>
  );
}