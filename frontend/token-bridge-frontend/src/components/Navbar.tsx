'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { WalletButton, WalletStatus } from './WalletButton';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  Coins, 
  ArrowLeftRight, 
  TrendingUp, 
  Droplets,
  Play,
  Home 
} from 'lucide-react';

const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Create Token', href: '/create-token', icon: Coins },
  { name: 'Bridge', href: '/bridge', icon: ArrowLeftRight },
  { name: 'Trade', href: '/trade', icon: TrendingUp },
  { name: 'Pools', href: '/pools', icon: Droplets },
  { name: 'Demo', href: '/demo', icon: Play },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <Coins className="h-6 w-6 text-primary" />
              Token Bridge
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link key={item.name} href={item.href}>
                    <Button
                      variant={pathname === item.href ? "default" : "ghost"}
                      size="sm"
                      className="gap-2"
                    >
                      <Icon className="h-4 w-4" />
                      {item.name}
                    </Button>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <WalletStatus />
            <WalletButton />
          </div>
        </div>
      </div>
    </nav>
  );
}