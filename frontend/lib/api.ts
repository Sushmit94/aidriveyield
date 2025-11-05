import axios from 'axios';

// Update this to your deployed AI service URL
const AI_API_BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: AI_API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Response types matching your AI service
export interface AllocationRecommendation {
  allocations: {
    Aave: number;
    Morpho: number;
    Spark: number;
    Uniswap: number;
  };
  timestamp: string;
  confidence: number;
}

export interface RiskPrediction {
  risks: {
    Aave: number;
    Morpho: number;
    Spark: number;
    Uniswap: number;
  };
  overall_risk: string; // "low", "medium", "high"
  timestamp: string;
}

export interface YieldPrediction {
  yields: {
    Aave: number;
    Morpho: number;
    Spark: number;
    Uniswap: number;
  };
  timestamp: string;
}

/**
 * Fetch AI-recommended allocation weights for DeFi protocols
 * @returns Allocation percentages for each protocol
 */
export async function fetchAllocationRecommendation(): Promise<AllocationRecommendation> {
  try {
    const response = await apiClient.get<AllocationRecommendation>('/recommendation');
    return response.data;
  } catch (error) {
    console.error('Error fetching allocation recommendation:', error);
    // Return default allocation on error
    return {
      allocations: {
        Aave: 25,
        Morpho: 25,
        Spark: 25,
        Uniswap: 25,
      },
      timestamp: new Date().toISOString(),
      confidence: 0.5,
    };
  }
}

/**
 * Fetch risk predictions for each protocol
 * @returns Risk scores and overall risk level
 */
export async function fetchRiskPredictions(): Promise<RiskPrediction> {
  try {
    const response = await apiClient.get<RiskPrediction>('/risk');
    return response.data;
  } catch (error) {
    console.error('Error fetching risk predictions:', error);
    return {
      risks: {
        Aave: 0.15,
        Morpho: 0.18,
        Spark: 0.16,
        Uniswap: 0.22,
      },
      overall_risk: 'medium',
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Fetch yield predictions for each protocol
 * @returns Predicted APY for each protocol
 */
export async function fetchYieldPredictions(): Promise<YieldPrediction> {
  try {
    const response = await apiClient.get<YieldPrediction>('/yields');
    return response.data;
  } catch (error) {
    console.error('Error fetching yield predictions:', error);
    return {
      yields: {
        Aave: 0.072,
        Morpho: 0.068,
        Spark: 0.070,
        Uniswap: 0.065,
      },
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Fetch historical yield data for charts
 * @param protocol Protocol name
 * @param days Number of days of history
 */
export async function fetchHistoricalYields(protocol: string, days: number = 30) {
  try {
    const response = await apiClient.get(`/historical/${protocol}`, {
      params: { days },
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching historical yields:', error);
    // Return mock data
    return generateMockHistoricalData(days);
  }
}

// Helper function to generate mock historical data
function generateMockHistoricalData(days: number) {
  const data = [];
  const baseYield = 0.07;
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toISOString().split('T')[0],
      yield: baseYield + (Math.random() - 0.5) * 0.02,
    });
  }
  return data;
}