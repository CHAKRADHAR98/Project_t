'use client';

import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToken2022 } from '@/hooks/useToken2022';
import { Coins, Loader2, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CreateToken2022Props {
  onTokenCreated?: (mint: PublicKey) => void;
}

export function CreateToken2022({ onTokenCreated }: CreateToken2022Props) {
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    decimals: 9,
    initialSupply: 1000,
    enableWhitelist: false
  });
  const [createdToken, setCreatedToken] = useState<{
    mint: PublicKey;
    signature: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  
  const { createToken2022, isLoading } = useToken2022();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await createToken2022(
        formData.name,
        formData.symbol,
        formData.decimals,
        formData.initialSupply,
        formData.enableWhitelist
      );
      
      setCreatedToken({
        mint: result.mint,
        signature: result.signature
      });
      
      onTokenCreated?.(result.mint);
    } catch (error) {
      console.error('Token creation failed:', error);
    }
  };

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (createdToken) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-600">
            <Check className="h-5 w-5" />
            Token Created Successfully!
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mint Address</Label>
            <div className="flex items-center gap-2">
              <Input 
                value={createdToken.mint.toBase58()} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(createdToken.mint.toBase58())}
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label>Transaction Signature</Label>
            <div className="flex items-center gap-2">
              <Input 
                value={createdToken.signature} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(createdToken.signature)}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-md">
            <div className="text-sm font-medium">Next Steps:</div>
            <div className="text-sm text-muted-foreground space-y-1">
              <div>1. Use the mint address in the Bridge tab to wrap tokens</div>
              <div>2. Create liquidity pools with bridge tokens</div>
              <div>3. Trade on any Solana AMM!</div>
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={() => {
              setCreatedToken(null);
              setFormData({
                name: '',
                symbol: '',
                decimals: 9,
                initialSupply: 1000,
                enableWhitelist: false
              });
            }}
            variant="outline"
            className="w-full"
          >
            Create Another Token
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Coins className="h-5 w-5" />
          Create Token2022
        </CardTitle>
      </CardHeader>
      
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Token Name</Label>
              <Input
                id="name"
                placeholder="My RWA Token"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                placeholder="RWA"
                value={formData.symbol}
                onChange={(e) => setFormData(prev => ({ ...prev, symbol: e.target.value }))}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="decimals">Decimals</Label>
              <Input
                id="decimals"
                type="number"
                min="0"
                max="18"
                value={formData.decimals}
                onChange={(e) => setFormData(prev => ({ ...prev, decimals: parseInt(e.target.value) }))}
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="supply">Initial Supply</Label>
              <Input
                id="supply"
                type="number"
                min="0"
                value={formData.initialSupply}
                onChange={(e) => setFormData(prev => ({ ...prev, initialSupply: parseFloat(e.target.value) }))}
                required
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="whitelist"
              checked={formData.enableWhitelist}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, enableWhitelist: checked as boolean }))
              }
            />
            <Label htmlFor="whitelist" className="text-sm">
              Enable Transfer Hook (Whitelist)
            </Label>
          </div>

          {formData.enableWhitelist && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
              <div className="text-sm font-medium">Transfer Hook Enabled</div>
              <div className="text-sm text-muted-foreground">
                Only whitelisted addresses will be able to receive this token. 
                You can manage the whitelist after creation.
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creating Token...
              </>
            ) : (
              'Create Token2022'
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}