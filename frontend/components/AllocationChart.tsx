'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface AllocationChartProps {
  allocations: {
    Aave: number;
    Morpho: number;
    Spark: number;
    Uniswap: number;
  };
}

const COLORS = {
  Aave: '#8B5CF6',
  Morpho: '#3B82F6',
  Spark: '#10B981',
  Uniswap: '#F59E0B',
};

export function AllocationChart({ allocations }: AllocationChartProps) {
  const data = Object.entries(allocations).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Allocation</CardTitle>
        <CardDescription>Distribution across DeFi protocols</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}%`}
              outerRadius={100}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name as keyof typeof COLORS]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value}%`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}