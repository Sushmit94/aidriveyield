'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getVaultInfo, CONTRACT_ADDRESSES, VAULT_ABI, getContract } from '@/lib/contract';
import { formatUSD, shortenAddress } from '@/lib/utils';
import { Heart, Send, Users, TrendingUp, DollarSign } from 'lucide-react';

export default function DonatePage() {
  const { isConnected } = useAccount();
  const [loading, setLoading] = useState(true);
  const [vaultInfo, setVaultInfo] = useState<any>(null);
  const [isDonating, setIsDonating] = useState(false);
  const [newRecipient, setNewRecipient] = useState('');

  useEffect(() => {
    loadData();
  }, [isConnected]);

  async function loadData() {
    try {
      setLoading(true);
      
      if (isConnected && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const vault = await getVaultInfo(provider);
        setVaultInfo(vault);
      }
    } catch (error) {
      console.error('Error loading donation data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDonateYield() {
    if (!isConnected || !window.ethereum) return;
    
    try {
      setIsDonating(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vault = getContract(CONTRACT_ADDRESSES.VAULT, VAULT_ABI, signer);
      
      const tx = await vault.donateYield();
      await tx.wait();
      
      await loadData();
    } catch (error) {
      console.error('Donation failed:', error);
    } finally {
      setIsDonating(false);
    }
  }

  async function handleUpdateRecipient() {
    if (!isConnected || !newRecipient || !window.ethereum) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vault = getContract(CONTRACT_ADDRESSES.VAULT, VAULT_ABI, signer);
      
      const tx = await vault.setDonationAddress(newRecipient);
      await tx.wait();
      
      setNewRecipient('');
      await loadData();
    } catch (error) {
      console.error('Update failed:', error);
    }
  }

  const publicGoodsProjects = [
    {
      name: 'Ethereum Foundation',
      description: 'Core Ethereum protocol development and research',
      category: 'Infrastructure',
      impact: 'High',
    },
    {
      name: 'Gitcoin Grants',
      description: 'Funding open source projects through quadratic funding',
      category: 'Funding',
      impact: 'High',
    },
    {
      name: 'Protocol Guild',
      description: 'Funding Ethereum core protocol contributors',
      category: 'Development',
      impact: 'High',
    },
    {
      name: 'Public Goods Network',
      description: 'L2 dedicated to funding public goods',
      category: 'Infrastructure',
      impact: 'Medium',
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold">Public Goods Donations</h1>
        <p className="text-muted-foreground">
          All yield generated is automatically donated to support public goods initiatives
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Donated</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {formatUSD(0)} {/* TODO: Track from events */}
            </div>
            <p className="text-xs text-muted-foreground">Lifetime donations</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Yield</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vaultInfo ? formatUSD(parseFloat(vaultInfo.accumulatedYield)) : '--'}
            </div>
            <p className="text-xs text-muted-foreground">Ready to donate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recipients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1</div>
            <p className="text-xs text-muted-foreground">Active recipient</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <Send className="h-5 w-5 text-primary" />
              <CardTitle>Donate Yield</CardTitle>
            </div>
            <CardDescription>Transfer accumulated yield to public goods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {vaultInfo && (
              <div className="space-y-4">
                <div className="p-4 bg-secondary rounded-lg space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Available Yield</span>
                    <span className="font-semibold">{formatUSD(parseFloat(vaultInfo.accumulatedYield))}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Recipient</span>
                    <code className="text-xs">{shortenAddress(vaultInfo.donationAddress)}</code>
                  </div>
                </div>

                {isConnected ? (
                  <Button 
                    onClick={handleDonateYield} 
                    disabled={isDonating || parseFloat(vaultInfo.accumulatedYield) === 0}
                    className="w-full"
                  >
                    <Heart className="h-4 w-4 mr-2" />
                    {isDonating ? 'Processing...' : 'Donate Yield Now'}
                  </Button>
                ) : (
                  <div className="text-center py-4 text-muted-foreground text-sm">
                    Connect wallet to donate yield
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Update Recipient</CardTitle>
            <CardDescription>Change the donation recipient address (owner only)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {vaultInfo && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Current Recipient</label>
                <code className="block text-xs bg-secondary px-3 py-2 rounded-md break-all">
                  {vaultInfo.donationAddress}
                </code>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">New Recipient Address</label>
              <input
                type="text"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                placeholder="0x..."
                className="w-full px-4 py-2 border rounded-md text-sm"
              />
            </div>

            {isConnected ? (
              <Button 
                onClick={handleUpdateRecipient} 
                disabled={!newRecipient}
                variant="outline"
                className="w-full"
              >
                Update Recipient
              </Button>
            ) : (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Connect wallet to update recipient
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Featured Public Goods Projects</CardTitle>
          <CardDescription>
            Examples of initiatives that benefit from DeFi yield donations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {publicGoodsProjects.map((project) => (
              <div
                key={project.name}
                className="p-4 border rounded-lg space-y-2 hover:bg-secondary/50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{project.name}</h3>
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                    {project.category}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{project.description}</p>
                <div className="flex items-center space-x-2 text-xs">
                  <TrendingUp className="h-3 w-3" />
                  <span>Impact: {project.impact}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Heart className="h-6 w-6 text-primary" />
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold text-lg">How It Works</h3>
              <p className="text-sm text-muted-foreground">
                When you deposit assets into the vault, they are allocated across multiple DeFi protocols based on AI recommendations. The yield generated from these allocations is automatically tracked and can be donated to public goods initiatives with a single transaction. This creates a sustainable funding mechanism for projects that benefit the entire Ethereum ecosystem.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}