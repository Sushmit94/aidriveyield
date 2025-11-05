'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { ethers } from 'ethers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { YieldComparison } from '@/components/YieldComparison';
import { fetchYieldPredictions, fetchHistoricalYields } from '@/lib/api';
import { getYieldRates } from '@/lib/contract';
import { formatPercentage, formatUSD } from '@/lib/utils';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Shield, Clock, Target } from 'lucide-react';

export default function StrategiesPage() {
  const { isConnected } = useAccount();
  const [loading, setLoading] = useState(true);
  const [yields, setYields] = useState<any>(null);
  const [onChainRates, setOnChainRates] = useState<any>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [isConnected]);

  async function loadData() {
    try {
      setLoading(true);
      
      // Fetch AI yield predictions
      const yieldPredictions = await fetchYieldPredictions();
      setYields(yieldPredictions.yields);
      
      // Fetch on-chain yield rates
      if (isConnected && window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const rates = await getYieldRates(provider);
        setOnChainRates(rates);
      }
      
      // Fetch historical data (mock for now)
      const historical = await fetchHistoricalYields('Aave', 30);
      setHistoricalData(historical);
      
    } catch (error) {
      console.error('Error loading strategies:', error);
    } finally {
      setLoading(false);
    }
  }

  const strategies = [
    {
      name: 'Aave',
      description: 'Decentralized lending protocol with over $10B TVL',
      features: ['High liquidity', 'Battle-tested', 'Multiple collateral types'],
      risk: 'Low',
      icon: TrendingUp,
      color: 'text-purple-500',
    },
    {
      name: 'Morpho',
      description: 'Peer-to-peer layer improving lending efficiency',
      features: ['Enhanced rates', 'Capital efficient', 'Low gas costs'],
      risk: 'Medium',
      icon: Target,
      color: 'text-blue-500',
    },
    {
      name: 'Spark',
      description: 'MakerDAO\'s native lending protocol',
      features: ['DAI integration', 'Stable yields', 'DAO governance'],
      risk: 'Low',
      icon: Shield,
      color: 'text-green-500',
    },
    {
      name: 'Uniswap',
      description: 'Liquidity provision with v4 hooks',
      features: ['Trading fees', 'Flexible pools', 'Composable hooks'],
      risk: 'Medium',
      icon: Clock,
      color: 'text-orange-500',
    },
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="flex flex-col space-y-2">
        <h1 className="text-4xl font-bold">DeFi Strategies</h1>
        <p className="text-muted-foreground">
          Compare yield opportunities across different protocols
        </p>
      </div>

      {yields && <YieldComparison yields={yields} />}

      <Card>
        <CardHeader>
          <CardTitle>Historical Yield Performance</CardTitle>
          <CardDescription>30-day yield trends (Aave example)</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={historicalData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis label={{ value: 'Yield', angle: -90, position: 'insideLeft' }} />
              <Tooltip formatter={(value: any) => formatPercentage(value)} />
              <Legend />
              <Line type="monotone" dataKey="yield" stroke="#3B82F6" name="APY" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {strategies.map((strategy) => {
          const Icon = strategy.icon;
          const currentYield = yields?.[strategy.name];
          const onChainYield = onChainRates?.[strategy.name.toLowerCase()];
          
          return (
            <Card key={strategy.name} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg bg-secondary ${strategy.color}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle>{strategy.name}</CardTitle>
                      <CardDescription className="text-xs">
                        Risk: <span className={`font-semibold ${
                          strategy.risk === 'Low' ? 'text-green-500' : 'text-yellow-500'
                        }`}>{strategy.risk}</span>
                      </CardDescription>
                    </div>
                  </div>
                  {currentYield && (
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {formatPercentage(currentYield)}
                      </div>
                      <div className="text-xs text-muted-foreground">Predicted APY</div>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{strategy.description}</p>
                
                {onChainYield && (
                  <div className="flex items-center justify-between py-2 px-3 bg-secondary rounded-md">
                    <span className="text-sm font-medium">Current On-Chain Rate</span>
                    <span className="text-sm font-bold">{formatPercentage(onChainYield)}</span>
                  </div>
                )}
                
                <div className="space-y-2">
                  <p className="text-sm font-semibold">Key Features:</p>
                  <ul className="space-y-1">
                    {strategy.features.map((feature, idx) => (
                      <li key={idx} className="text-sm text-muted-foreground flex items-center space-x-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}