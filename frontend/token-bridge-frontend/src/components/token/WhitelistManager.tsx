'use client';

import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToken2022 } from '@/hooks/useToken2022';
import { Shield, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';

interface WhitelistManagerProps {
  mint: PublicKey;
}

export function WhitelistManager({ mint }: WhitelistManagerProps) {
  const [userToAdd, setUserToAdd] = useState('');
  const { addToWhitelist, isLoading } = useToken2022();

  const handleAddToWhitelist = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const userPubkey = new PublicKey(userToAdd);
      await addToWhitelist(mint, userPubkey);
      setUserToAdd('');
    } catch (error) {
      toast.error('Invalid public key or failed to add to whitelist');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5" />
          Whitelist Manager
        </CardTitle>
      </CardHeader>

      <form onSubmit={handleAddToWhitelist}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="user-address">User Address to Whitelist</Label>
            <Input
              id="user-address"
              placeholder="Enter user's public key..."
              value={userToAdd}
              onChange={(e) => setUserToAdd(e.target.value)}
              required
            />
          </div>

          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-md">
            <div className="text-sm font-medium">Note:</div>
            <div className="text-sm text-muted-foreground">
              Only whitelisted addresses can receive this token. Add addresses carefully.
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            disabled={isLoading || !userToAdd}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Adding to Whitelist...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4 mr-2" />
                Add to Whitelist
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
