'use client';

import { GuidedDemo } from '@/components/demo/GuidedDemo';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function DemoPage() {
  const { connected } = useWallet();

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold">Interactive Demo</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Follow this guided demo to see how Token2022 tokens with Transfer Hooks 
          can be made tradeable on all Solana AMMs using our bridge system.
        </p>

        {!connected && (
          <div className="pt-4">
            <WalletMultiButton />
          </div>
        )}
      </div>

      <GuidedDemo />

      {/* Demo Information */}
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-muted p-6 rounded-lg">
          <h3 className="font-semibold mb-3">What You'll Learn</h3>
          <div className="space-y-2 text-sm">
            <div>• How to create Token2022 with Transfer Hooks</div>
            <div>• Bridge mechanism: wrap restricted tokens</div>
            <div>• Create liquidity pools on Orca</div>
            <div>• Trade on Jupiter aggregation</div>
            <div>• Unwrap to get original tokens back</div>
          </div>
        </div>

        <div className="bg-muted p-6 rounded-lg">
          <h3 className="font-semibold mb-3">Demo Features</h3>
          <div className="space-y-2 text-sm">
            <div>• Live on Solana Devnet</div>
            <div>• Real transactions and smart contracts</div>
            <div>• Working integration with AMMs</div>
            <div>• Whitelist Transfer Hook example</div>
            <div>• Complete end-to-end flow</div>
          </div>
        </div>
      </div>
    </div>
  );
}