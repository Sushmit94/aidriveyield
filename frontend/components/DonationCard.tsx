'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { formatUSD } from '@/lib/utils';
import { Heart, TrendingUp, Users } from 'lucide-react';

interface DonationCardProps {
  totalDonated: number;
  accumulatedYield: number;
  recipientAddress: string;
  recipientCount?: number;
}

export function DonationCard({
  totalDonated,
  accumulatedYield,
  recipientAddress,
  recipientCount = 1,
}: DonationCardProps) {
  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Heart className="h-5 w-5 text-primary" />
          <CardTitle>Public Goods Impact</CardTitle>
        </div>
        <CardDescription>Total yield donated to public goods initiatives</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Total Donated</span>
            </div>
            <div className="text-2xl font-bold text-primary">{formatUSD(totalDonated)}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Heart className="h-4 w-4" />
              <span>Pending Yield</span>
            </div>
            <div className="text-2xl font-bold">{formatUSD(accumulatedYield)}</div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>Recipients</span>
            </div>
            <div className="text-2xl font-bold">{recipientCount}</div>
          </div>
        </div>

        <div className="space-y-2 pt-4 border-t">
          <p className="text-sm font-medium">Current Recipient</p>
          <code className="block text-xs bg-secondary px-3 py-2 rounded-md break-all">
            {recipientAddress}
          </code>
        </div>

        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
          <Heart className="h-4 w-4 fill-primary text-primary" />
          <span>All yield is automatically donated to support public goods</span>
        </div>
      </CardContent>
    </Card>
  );
}