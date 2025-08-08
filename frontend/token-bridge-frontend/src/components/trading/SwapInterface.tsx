'use client';

import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useJupiter } from '@/hooks/useJupiter';
import { useTokenBalance } from '@/hooks/useTokenBalance';
import { useSolana } from '@/contexts/SolanaContext';
import { TrendingUp, Loader2, ArrowDownUp } from 'lucide-react';

// Common token addresses on devnet
const COMMON_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'BRjpCHtyQLNCo8gqRUr8jtdAj5AjPYQaoqbvcZiHok1k', // devUSDC
};

export function SwapInterface() {
  const [inputMint, setInputMint] = useState(COMMON_TOKENS.SOL);
  const [outputMint, setOutputMint] = useState('');
  const [inputAmount, setInputAmount] = useState('');
  const [quote, setQuote] = useState<any>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  
  const { getQuote, executeSwap, isLoading } = useJupiter();
  const { bridgeConfig } = useSolana();
  
  const { balance: inputBalance } = useTokenBalance(
    inputMint ? new PublicKey(inputMint) : null,
    false
  );

  // Set bridge token as default output if available
  useEffect(() => {
    if (bridgeConfig && !outputMint) {
      setOutputMint(bridgeConfig.bridgeTokenMint.toString());
    }
  }, [bridgeConfig, outputMint]);

  // Get quote when inputs change
  useEffect(() => {
    if (inputMint && outputMint && inputAmount && parseFloat(inputAmount) > 0) {
      const delayedQuote = setTimeout(async () => {
        setQuoteLoading(true);
        try {
          const amount = Math.floor(parseFloat(inputAmount) * Math.pow(10, 9)); // Assume 9 decimals
          const quoteResponse = await getQuote(inputMint, outputMint, amount);
          setQuote(quoteResponse);
        } catch (error) {
          console.error('Quote failed:', error);
        } finally {
          setQuoteLoading(false);
        }
      }, 500); // Debounce quotes

      return () => clearTimeout(delayedQuote);
    } else {
      setQuote(null);
    }
  }, [inputMint, outputMint, inputAmount, getQuote]);

  const handleSwap = async () => {
    if (!quote) return;
    
    try {
      await executeSwap(quote);
      setInputAmount('');
      setQuote(null);
    } catch (error) {
      console.error('Swap failed:', error);
    }
  };

  const swapTokens = () => {
    const tempInput = inputMint;
    setInputMint(outputMint);
    setOutputMint(tempInput);
    setInputAmount('');
    setQuote(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Token Swap
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Input Token */}
        <div className="space-y-2">
          <Label>From</Label>
          <div className="space-y-2">
            <select
              value={inputMint}
              onChange={(e) => setInputMint(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value={COMMON_TOKENS.SOL}>SOL</option>
              <option value={COMMON_TOKENS.USDC}>USDC (Dev)</option>
              {bridgeConfig && (
                <option value={bridgeConfig.bridgeTokenMint.toString()}>
                  Bridge Token
                </option>
              )}
            </select>
            
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0.00"
                value={inputAmount}
                onChange={(e) => setInputAmount(e.target.value)}
                step="any"
              />
              <Button
                variant="outline"
                onClick={() => setInputAmount(inputBalance.toString())}
                disabled={inputBalance === 0}
              >
                Max
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              Balance: {inputBalance.toFixed(4)}
            </div>
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="icon"
            onClick={swapTokens}
            disabled={!inputMint || !outputMint}
          >
            <ArrowDownUp className="h-4 w-4" />
          </Button>
        </div>

        {/* Output Token */}
        <div className="space-y-2">
          <Label>To</Label>
          <div className="space-y-2">
            <select
              value={outputMint}
              onChange={(e) => setOutputMint(e.target.value)}
              className="w-full p-2 border rounded-md bg-background"
            >
              <option value="">Select token...</option>
              <option value={COMMON_TOKENS.SOL}>SOL</option>
              <option value={COMMON_TOKENS.USDC}>USDC (Dev)</option>
              {bridgeConfig && (
                <option value={bridgeConfig.bridgeTokenMint.toString()}>
                  Bridge Token
                </option>
              )}
            </select>
            
            <div className="p-3 bg-muted rounded-md">
              <div className="text-sm text-muted-foreground">You'll receive</div>
              <div className="font-mono">
                {quoteLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : quote ? (
                  `${(parseInt(quote.outAmount) / Math.pow(10, 9)).toFixed(6)}`
                ) : (
                  '0.00'
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Quote Details */}
        {quote && (
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md space-y-1">
            <div className="flex justify-between text-sm">
              <span>Price Impact:</span>
              <span className={parseFloat(quote.priceImpactPct) > 5 ? 'text-red-600' : 'text-green-600'}>
                {(parseFloat(quote.priceImpactPct) * 100).toFixed(2)}%
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Route:</span>
              <span>{quote.routePlan?.length || 0} hop(s)</span>
            </div>
          </div>
        )}
      </CardContent>

      <CardFooter>
        <Button
          onClick={handleSwap}
          disabled={
            !quote || 
            isLoading || 
            !inputAmount || 
            parseFloat(inputAmount) <= 0 ||
            parseFloat(inputAmount) > inputBalance
          }
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Swapping...
            </>
          ) : (
            'Swap Tokens'
          )}
        </Button>
      </CardFooter>
    </Card>
  );
}