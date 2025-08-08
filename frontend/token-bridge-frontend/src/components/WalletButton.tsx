'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from '@/components/ui/button';
import { Wallet } from 'lucide-react';

export function WalletButton() {
  return <WalletMultiButton />;
}

export function WalletStatus() {
  const { publicKey, connected, connecting } = useWallet();

  if (connecting) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
        <span className="text-sm">Connecting...</span>
      </div>
    );
  }

  if (!connected || !publicKey) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-muted rounded-md">
        <Wallet className="h-4 w-4" />
        <span className="text-sm">Not Connected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/20 rounded-md">
      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
      <span className="text-sm font-mono">
        {publicKey.toBase58().slice(0, 4)}...{publicKey.toBase58().slice(-4)}
      </span>
    </div>
  );
}