'use client';

import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useOrca } from '@/hooks/useOrca';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useSolana } from '@/contexts/SolanaContext';
import { useWallet } from '@solana/wallet-adapter-react';
import { Plus, Loader2 } from 'lucide-react';

const SOL_MINT = 'So11111111111111111111111111111111111111112';

export function AddLiquidityInterface() {
  const [poolAddress, setPoolAddress] = useState('');
  const [solAmount, setSolAmount] = useState('');
  const [bridgeAmount, setBridgeAmount] = useState('');
  
  const { addLiquidity, isLoading } = useOrca();
  const { bridgeConfig } = useSolana();
  const { publicKey } = useWallet();
  
  const { balance: solBalance } = useTokenBalance(new PublicKey(SOL_MINT), false);
  const { balance: bridgeBalance } = useTokenBalance(
    bridgeConfig?.bridgeTokenMint || null,
    false
  );

  const handleAddLiquidity = async () => {
    if (!poolAddress || !solAmount || !bridgeAmount) return;
    
    try {
      const poolPubkey = new PublicKey(poolAddress);
      await addLiquidity(
        poolPubkey,
        parseFloat(solAmount),
        parseFloat(bridgeAmount)
      );
      
      setSolAmount('');
      setBridgeAmount('');
    } catch (error) {
      console.error('Add liquidity failed:', error);
    }
  };

  if (!bridgeConfig || !publicKey) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Connect wallet and initialize bridge to add liquidity
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add Liquidity
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="pool-address">Pool Address</Label>
          <Input
            id="pool-address"
            placeholder="Enter pool address..."
            value={poolAddress}
            onChange={(e) => setPoolAddress(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="sol-amount">SOL Amount</Label>
            <div className="space-y-1">
              <Input
                id="sol-amount"
                type="number"
                placeholder="0.00"
                value={solAmount}
                onChange={(e) => setSolAmount(e.target.value)}
                step="any"
              />
              <div className="text-xs text-muted-foreground">
                Balance: {solBalance.toFixed(4)} SOL
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bridge-amount">Bridge Token Amount</Label>
            <div className="space-y-1">
              <Input
                id="bridge-amount"
                type="number"
                placeholder="0.00"
                value={bridgeAmount}
                onChange={(e) => setBridgeAmount(e.target.value)}
                step="any"
              />
              <div className="text-xs text-muted-foreground">
                Balance: {bridgeBalance.toFixed(4)} tokens
              </div>
            </div>
          </div>
        </div>

        <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
          <div className="text-sm font-medium">Important:</div>
          <div className="text-sm text-muted-foreground">
            Make sure you have sufficient balances of both tokens before adding liquidity
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleAddLiquidity}
          disabled={
            !poolAddress ||
            !solAmount ||
            !bridgeAmount ||
            parseFloat(solAmount) <= 0 ||
            parseFloat(bridgeAmount) <= 0 ||
            parseFloat(solAmount) > solBalance ||
            parseFloat(bridgeAmount) > bridgeBalance ||
            isLoading
          }
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Adding Liquidity...
            </>
          ) : (
            'Add Liquidity'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}