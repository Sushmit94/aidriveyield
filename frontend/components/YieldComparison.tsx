'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { formatPercentage } from '@/lib/utils';

interface YieldComparisonProps {
  yields: {
    Aave: number;
    Morpho: number;
    Spark: number;
    Uniswap: number;
  };
}

export function YieldComparison({ yields }: YieldComparisonProps) {
  const data = Object.entries(yields).map(([name, apy]) => ({
    name,
    apy: (apy * 100).toFixed(2),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Yield Comparison</CardTitle>
        <CardDescription>Current APY across different protocols</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis label={{ value: 'APY (%)', angle: -90, position: 'insideLeft' }} />
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
            <Bar dataKey="apy" fill="#3B82F6" name="APY" />
          </BarChart>
        </ResponsiveContainer>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {Object.entries(yields).map(([name, apy]) => (
            <div key={name} className="text-center space-y-1">
              <p className="text-sm font-medium text-muted-foreground">{name}</p>
              <p className="text-2xl font-bold">{formatPercentage(apy)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}