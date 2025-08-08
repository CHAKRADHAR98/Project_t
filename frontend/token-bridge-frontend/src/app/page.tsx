'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRight, Coins, ArrowLeftRight, TrendingUp, Shield, Zap } from 'lucide-react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';
import { useSolana } from '@/contexts/SolanaContext';

export default function HomePage() {
  const { connected } = useWallet();
  const { bridgeConfig, isLoading } = useSolana();

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <section className="text-center space-y-6">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
            Trade Token2022 on{' '}
            <span className="text-primary">Any AMM</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Bridge Token2022 tokens with Transfer Hooks to make them tradeable on all Solana AMMs. 
            Unlock the full potential of programmable tokens in DeFi.
          </p>
        </div>

        <div className="flex gap-4 justify-center">
          <Link href="/demo">
            <Button size="lg" className="gap-2">
              Try Demo <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <Link href="/create-token">
            <Button variant="outline" size="lg" className="gap-2">
              Create Token <Coins className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Status Card */}
      {connected && (
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Bridge Status</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center text-muted-foreground">Loading...</div>
            ) : bridgeConfig ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className={bridgeConfig.isActive ? "text-green-600" : "text-red-600"}>
                    {bridgeConfig.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Total Locked:</span>
                  <span className="font-mono">
                    {bridgeConfig.totalLockedAmount.toString()}
                  </span>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                Bridge not initialized
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* How It Works */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-center">How It Works</h2>
        
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>1. Wrap</CardTitle>
              <CardDescription>
                Lock your Token2022 tokens to mint tradeable bridge tokens
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>2. Trade</CardTitle>
              <CardDescription>
                Trade bridge tokens on any AMM - Jupiter, Raydium, Orca, Meteora
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <ArrowLeftRight className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>3. Unwrap</CardTitle>
              <CardDescription>
                Burn bridge tokens to unlock your original Token2022 tokens
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Features */}
      <section className="space-y-8">
        <h2 className="text-3xl font-bold text-center">Key Features</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Transfer Hook Compatibility
              </CardTitle>
              <CardDescription>
                Supports Token2022 tokens with Transfer Hooks like KYC, whitelisting, and transfer limits
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Universal AMM Support
              </CardTitle>
              <CardDescription>
                Bridge tokens work with ALL Solana AMMs without requiring protocol modifications
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowLeftRight className="h-5 w-5 text-primary" />
                1:1 Backing
              </CardTitle>
              <CardDescription>
                Every bridge token is backed 1:1 by locked Token2022 tokens in secure vaults
              </CardDescription>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                DeFi Integration
              </CardTitle>
              <CardDescription>
                Create liquidity pools, enable yield farming, and integrate with the entire DeFi ecosystem
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>
    </div>
  );
}