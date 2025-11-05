'use client';

import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface RiskAlertProps {
  riskLevel: 'low' | 'medium' | 'high';
  message?: string;
}

export function RiskAlert({ riskLevel, message }: RiskAlertProps) {
  const config = {
    low: {
      icon: CheckCircle,
      title: 'Low Risk',
      description: message || 'All protocols operating within normal parameters. No immediate concerns.',
      className: 'border-green-500/50 text-green-600 dark:text-green-400',
      iconColor: 'text-green-600',
    },
    medium: {
      icon: Info,
      title: 'Medium Risk',
      description: message || 'Some volatility detected. Monitor allocations closely.',
      className: 'border-yellow-500/50 text-yellow-600 dark:text-yellow-400',
      iconColor: 'text-yellow-600',
    },
    high: {
      icon: AlertTriangle,
      title: 'High Risk',
      description: message || 'Significant volatility or risk detected. Consider rebalancing.',
      className: 'border-red-500/50 text-red-600 dark:text-red-400',
      iconColor: 'text-red-600',
    },
  };

  const { icon: Icon, title, description, className, iconColor } = config[riskLevel];

  return (
    <Alert className={className}>
      <Icon className={`h-4 w-4 ${iconColor}`} />
      <AlertTitle className="font-semibold">{title}</AlertTitle>
      <AlertDescription>{description}</AlertDescription>
    </Alert>
  );
}