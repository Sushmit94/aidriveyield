'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Button } from './ui/button';
import { shortenAddress } from '@/lib/utils';
import { Wallet, LogOut, BarChart3 } from 'lucide-react';

export function Navbar() {
  const { address, isConnected } = useAccount();
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  // Track when component is mounted on client
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Left side navigation */}
          <div className="flex items-center space-x-8">
            <Link href="/" className="flex items-center space-x-2">
              <BarChart3 className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold">AI Yield Allocator</span>
            </Link>
            <div className="hidden md:flex space-x-6">
              <Link href="/" className="text-sm font-medium hover:text-primary transition-colors">
                Dashboard
              </Link>
              <Link href="/strategies" className="text-sm font-medium hover:text-primary transition-colors">
                Strategies
              </Link>
              <Link href="/donate" className="text-sm font-medium hover:text-primary transition-colors">
                Donations
              </Link>
            </div>
          </div>

          {/* Right side wallet controls */}
          <div className="flex items-center space-x-4">
            {!isMounted ? (
              // Render SSR-safe placeholder (same for server & client)
              <div className="w-32 h-10 bg-muted animate-pulse rounded-md" />
            ) : !isConnected ? (
              <Button
                onClick={() => connect({ connector: connectors[0] })}
                className="flex items-center space-x-2"
              >
                <Wallet className="h-4 w-4" />
                <span>Connect Wallet</span>
              </Button>
            ) : (
              <div className="flex items-center space-x-2">
                <div className="hidden sm:block px-3 py-2 bg-secondary rounded-md text-sm font-medium">
                  {shortenAddress(address || '')}
                </div>
                <Button variant="outline" size="icon" onClick={() => disconnect()}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
