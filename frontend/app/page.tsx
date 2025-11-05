'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AllocationChart } from '@/components/AllocationChart';
import { RiskAlert } from '@/components/RiskAlert';
import { DonationCard } from '@/components/DonationCard';
import { fetchAllocationRecommendation, fetchRiskPredictions } from '@/lib/api';
import { getVaultInfo, getAllocationStatus, CONTRACT_ADDRESSES, VAULT_ABI, STRATEGY_MANAGER_ABI, getContract } from '@/lib/contract';
import { formatUSD, formatNumber, basisPointsToPercentage } from '@/lib/utils';
import { TrendingUp, DollarSign, Activity, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(true);
  const [vaultInfo, setVaultInfo] = useState<any>(null);
  const [allocationStatus, setAllocationStatus] = useState<any>(null);
  const [aiRecommendation, setAiRecommendation] = useState<any>(null);
  const [riskPrediction, setRiskPrediction] = useState<any>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  useEffect(() => {
    loadData();
  }, [isConnected]);

  async function loadData() {
    try {
      setLoading(true);
      
      // Fetch AI predictions
      const [recommendation, risk] = await Promise.all([
        fetchAllocationRecommendation(),
        fetchRiskPredictions(),
      ]);
      
      setAiRecommendation(recommendation);
      setRiskPrediction(risk);

      // Fetch on-chain data if connected
      if (isConnected && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const [vault, allocation] = await Promise.all([
          getVaultInfo(provider),
          getAllocationStatus(provider),
        ]);
        
        setVaultInfo(vault);
        setAllocationStatus(allocation);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeposit() {
    if (!isConnected || !depositAmount || !window.ethereum) return;
    
    try {
      setIsDepositing(true);
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const vault = getContract(CONTRACT_ADDRESSES.VAULT, VAULT_ABI, signer);
      
      const amount = ethers.parseEther(depositAmount);
      const tx = await vault.deposit(amount, address);
      await tx.wait();
      
      setDepositAmount('');
      await loadData();
    } catch (error) {
      console.error('Deposit failed:', error);
    } finally {
      setIsDepositing(false);
    }
  }

  async function handleRebalance() {
    if (!isConnected || !window.ethereum) return;
    
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const strategyManager = getContract(CONTRACT_ADDRESSES.STRATEGY_MANAGER, STRATEGY_MANAGER_ABI, signer);
      
      const tx = await strategyManager.rebalance();
      await tx.wait();
      
      await loadData();
    } catch (error) {
      console.error('Rebalance failed:', error);
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  const currentAllocation = allocationStatus?.weights
    ? {
        Aave: basisPointsToPercentage(allocationStatus.weights.aave),
        Morpho: basisPointsToPercentage(allocationStatus.weights.morpho),
        Spark: basisPointsToPercentage(allocationStatus.weights.spark),
        Uniswap: basisPointsToPercentage(allocationStatus.weights.uniswap),
      }
    : aiRecommendation?.allocations;

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          AI-powered yield allocation with automated public goods donations
        </p>
      </div>

      {riskPrediction && (
        <RiskAlert riskLevel={riskPrediction.overall_risk} />
      )}

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value Locked</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vaultInfo ? formatUSD(parseFloat(vaultInfo.totalAssets)) : '--'}
            </div>
            <p className="text-xs text-muted-foreground">Across all protocols</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Accumulated Yield</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {vaultInfo ? formatUSD(parseFloat(vaultInfo.accumulatedYield)) : '--'}
            </div>
            <p className="text-xs text-muted-foreground">Ready for donation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Confidence</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {aiRecommendation ? `${(aiRecommendation.confidence * 100).toFixed(0)}%` : '--'}
            </div>
            <p className="text-xs text-muted-foreground">Recommendation strength</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {currentAllocation && <AllocationChart allocations={currentAllocation} />}
        
        <Card>
          <CardHeader>
            <CardTitle>Deposit & Manage</CardTitle>
            <CardDescription>Deposit assets to start earning yield for public goods</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected ? (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Deposit Amount (ETH)</label>
                  <input
                    type="number"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.0"
                    className="w-full px-4 py-2 border rounded-md"
                  />
                </div>
                <Button 
                  onClick={handleDeposit} 
                  disabled={!depositAmount || isDepositing}
                  className="w-full"
                >
                  {isDepositing ? 'Depositing...' : 'Deposit'}
                </Button>
                <Button 
                  onClick={handleRebalance} 
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Rebalance Based on AI
                </Button>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Connect your wallet to deposit and manage funds
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {vaultInfo && (
        <DonationCard
          totalDonated={0} // TODO: Track from events
          accumulatedYield={parseFloat(vaultInfo.accumulatedYield)}
          recipientAddress={vaultInfo.donationAddress}
        />
      )}
    </div>
  );
}