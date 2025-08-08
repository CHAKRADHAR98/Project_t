'use client';

import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBridge } from '@/hooks/useBridge';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { ArrowDown, Loader2 } from 'lucide-react';

interface WrapInterfaceProps {
  restrictedTokenMint: PublicKey | null;
  onMintChange: (mint: string) => void;
}

export function WrapInterface({ restrictedTokenMint, onMintChange }: WrapInterfaceProps) {
  const [amount, setAmount] = useState('');
  const [mintInput, setMintInput] = useState('');
  const { wrapTokens, isLoading } = useBridge();

  const { 
    balance: restrictedBalance, 
    decimals: restrictedDecimals,
    isLoading: balanceLoading 
  } = useTokenBalance(restrictedTokenMint, true);

  const handleWrap = async () => {
    if (!restrictedTokenMint || !amount) return;

    try {
      await wrapTokens(restrictedTokenMint, parseFloat(amount), restrictedDecimals);
      setAmount('');
    } catch (error) {
      console.error('Wrap failed:', error);
    }
  };

  const handleMintInputChange = (value: string) => {
    setMintInput(value);
    try {
      new PublicKey(value);
      onMintChange(value);
    } catch (error) {
      // Invalid public key, don't update
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowDown className="h-5 w-5" />
          Wrap Tokens
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="mint">Token2022 Mint Address</Label>
          <Input
            id="mint"
            placeholder="Enter Token2022 mint address..."
            value={mintInput}
            onChange={(e) => handleMintInputChange(e.target.value)}
          />
        </div>

        {restrictedTokenMint && (
          <>
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground">Available Balance</div>
              <div className="font-mono">
                {balanceLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  {`${restrictedBalance.toFixed(4)} tokens`}
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount to Wrap</Label>
              <div className="flex gap-2">
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="any"
                />
                <Button
                  variant="outline"
                  onClick={() => setAmount(restrictedBalance.toString())}
                  disabled={restrictedBalance === 0}
                >
                  Max
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleWrap}
          disabled={
            !restrictedTokenMint || 
            !amount || 
            parseFloat(amount) <= 0 || 
            parseFloat(amount) > restrictedBalance ||
            isLoading
          }
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Wrapping...
            </>
          ) : (
            'Wrap Tokens'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}