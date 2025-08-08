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
import { Droplets, Loader2, Info } from 'lucide-react';

// SOL mint address
const SOL_MINT = 'So11111111111111111111111111111111111111112';

export function CreatePoolInterface() {
  const [initialPrice, setInitialPrice] = useState('');
  const [poolCreated, setPoolCreated] = useState<{
    poolAddress: PublicKey;
    signature: string;
  } | null>(null);
  
  const { createSplashPool, isLoading } = useOrca();
  const { bridgeConfig } = useSolana();
  
  const { balance: bridgeTokenBalance } = useTokenBalance(
    bridgeConfig?.bridgeTokenMint || null,
    false
  );

  const handleCreatePool = async () => {
    if (!bridgeConfig || !initialPrice) return;
    
    try {
      const tokenA = new PublicKey(SOL_MINT);
      const tokenB = bridgeConfig.bridgeTokenMint;
      
      const result = await createSplashPool(
        tokenA,
        tokenB,
        parseFloat(initialPrice)
      );
      
      setPoolCreated({
        poolAddress: result.poolAddress,
        signature: result.signature
      });
    } catch (error) {
      console.error('Pool creation failed:', error);
    }
  };

  if (!bridgeConfig) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            Bridge not initialized. Please initialize the bridge first.
          </div>
        </CardContent>
      </Card>
    );
  }

  if (poolCreated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Droplets className="h-5 w-5" />
            Pool Created Successfully!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Pool Address</Label>
            <Input 
              value={poolCreated.poolAddress.toBase58()} 
              readOnly 
              className="font-mono text-sm"
            />
          </div>
          
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
            <div className="text-sm font-medium">Next Steps:</div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>1. Add initial liquidity to the pool</div>
              <div>2. Pool will be tradeable on Orca</div>
              <div>3. Users can swap SOL ↔ Bridge Tokens</div>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={() => {
              setPoolCreated(null);
              setInitialPrice('');
            }}
            variant="outline"
            className="w-full"
          >
            Create Another Pool
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Droplets className="h-5 w-5" />
          Create Splash Pool
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
          <div className="flex items-start gap-2">
            <Info className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="text-sm">
              <div className="font-medium">Creating SOL/Bridge Token Pool</div>
              <div className="text-muted-foreground">
                This will create a liquidity pool on Orca for trading your bridge tokens against SOL
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Token A</Label>
            <Input value="SOL" readOnly className="bg-muted" />
          </div>
          
          <div className="space-y-2">
            <Label>Token B</Label>
            <Input 
              value="Bridge Token" 
              readOnly 
              className="bg-muted" 
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">Initial Price (Bridge Token per SOL)</Label>
          <Input
            id="price"
            type="number"
            placeholder="0.01"
            value={initialPrice}
            onChange={(e) => setInitialPrice(e.target.value)}
            step="any"
          />
          <div className="text-sm text-muted-foreground">
            How many bridge tokens equal 1 SOL?
          </div>
        </div>

        <div className="p-3 bg-muted rounded-md">
          <div className="text-sm text-muted-foreground">Bridge Token Balance</div>
          <div className="font-mono">
            {bridgeTokenBalance.toFixed(4)} tokens
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            You'll need bridge tokens to add initial liquidity
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleCreatePool}
          disabled={
            !initialPrice || 
            parseFloat(initialPrice) <= 0 ||
            isLoading
          }
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Creating Pool...
            </>
          ) : (
            'Create Splash Pool'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}