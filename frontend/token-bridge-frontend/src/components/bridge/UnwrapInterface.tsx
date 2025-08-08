// src/components/bridge/UnwrapInterface.tsx
'use client';

import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useBridge } from '@/hooks/useBridge';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useSolana } from '@/contexts/SolanaContext';
import { ArrowUp, Loader2, AlertTriangle, Info } from 'lucide-react';

interface UnwrapInterfaceProps {
  restrictedTokenMint: PublicKey | null;
}

export function UnwrapInterface({ restrictedTokenMint }: UnwrapInterfaceProps) {
  const [amount, setAmount] = useState('');
  const { unwrapTokens, isLoading } = useBridge();
  const { bridgeConfig } = useSolana();
  
  const { 
    balance: bridgeBalance, 
    decimals: bridgeDecimals,
    isLoading: balanceLoading 
  } = useTokenBalance(bridgeConfig?.bridgeTokenMint || null, false);

  const handleUnwrap = async () => {
    if (!restrictedTokenMint || !amount) return;
    
    try {
      await unwrapTokens(restrictedTokenMint, parseFloat(amount), bridgeDecimals);
      setAmount('');
    } catch (error) {
      console.error('Unwrap failed:', error);
    }
  };

  const handleMaxClick = () => {
    setAmount(bridgeBalance.toString());
  };

  if (!bridgeConfig) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ArrowUp className="h-5 w-5" />
            Unwrap Tokens
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <AlertTriangle className="h-4 w-4" />
            <span>Bridge not initialized. Please initialize the bridge first.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ArrowUp className="h-5 w-5" />
          Unwrap Tokens
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Bridge Token Balance Display */}
        <div className="p-3 bg-muted rounded-md">
          <div className="text-sm text-muted-foreground">Bridge Token Balance</div>
          <div className="font-mono text-lg">
            {balanceLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading...</span>
              </div>
            ) : (
              `${bridgeBalance.toFixed(4)} tokens`
            )}
          </div>
          <div className="text-xs text-muted-foreground mt-1">
            Bridge Token Mint: {bridgeConfig.bridgeTokenMint.toBase58().slice(0, 8)}...
          </div>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="unwrap-amount">Amount to Unwrap</Label>
          <div className="flex gap-2">
            <Input
              id="unwrap-amount"
              type="number"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              step="any"
              min="0"
              max={bridgeBalance}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleMaxClick}
              disabled={bridgeBalance === 0 || balanceLoading}
              className="px-3"
            >
              Max
            </Button>
          </div>
          
          {/* Input validation feedback */}
          {amount && parseFloat(amount) > bridgeBalance && (
            <div className="text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Amount exceeds available balance
            </div>
          )}
          
          {amount && parseFloat(amount) <= 0 && (
            <div className="text-sm text-red-600 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Amount must be greater than 0
            </div>
          )}
        </div>

        {/* Transfer Hook Warning */}
        {restrictedTokenMint && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-blue-900 dark:text-blue-100">
                  Transfer Hook Validation
                </div>
                <div className="text-blue-700 dark:text-blue-300 mt-1">
                  Unwrapping will validate any Transfer Hook restrictions (KYC, whitelist, transfer limits, etc.) 
                  for the original Token2022. Make sure you meet all requirements.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Token Information */}
        {restrictedTokenMint && (
          <div className="p-3 bg-muted rounded-md">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Target Token:</span>
                <span className="font-mono text-xs">
                  {restrictedTokenMint.toBase58().slice(0, 8)}...{restrictedTokenMint.toBase58().slice(-8)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Token Type:</span>
                <span className="text-sm">Token2022 with Transfer Hook</span>
              </div>
            </div>
          </div>
        )}

        {/* Exchange Rate Information */}
        {amount && parseFloat(amount) > 0 && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md border border-green-200 dark:border-green-800">
            <div className="text-sm space-y-1">
              <div className="font-medium text-green-900 dark:text-green-100">
                Unwrap Summary
              </div>
              <div className="flex justify-between text-green-700 dark:text-green-300">
                <span>Bridge Tokens to Burn:</span>
                <span className="font-mono">{parseFloat(amount).toFixed(4)}</span>
              </div>
              <div className="flex justify-between text-green-700 dark:text-green-300">
                <span>Token2022 to Receive:</span>
                <span className="font-mono">{parseFloat(amount).toFixed(4)}</span>
              </div>
              <div className="text-xs text-green-600 dark:text-green-400 mt-2">
                1:1 exchange rate guaranteed
              </div>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleUnwrap}
          disabled={
            !restrictedTokenMint || 
            !amount || 
            parseFloat(amount) <= 0 || 
            parseFloat(amount) > bridgeBalance ||
            isLoading ||
            balanceLoading
          }
          className="w-full"
          size="lg"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Unwrapping...
            </>
          ) : (
            'Unwrap Tokens'
          )}
        </Button>
        
        {/* Additional info below button */}
        <div className="w-full mt-2">
          <div className="text-xs text-center text-muted-foreground">
            {restrictedTokenMint ? (
              "This will burn bridge tokens and return your original Token2022"
            ) : (
              "Enter a Token2022 mint address in the Wrap section first"
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}