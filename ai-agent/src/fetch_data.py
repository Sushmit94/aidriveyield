"""
fetch_data.py
Simulates fetching on-chain data from DeFi protocols (Aave, Morpho, Spark, Uniswap)
In production, this would query TheGraph, Dune Analytics, or direct RPC calls
"""
import pandas as pd
import numpy as np
from typing import Dict, List
import json

# Mock data - in production, this would fetch from APIs
PROTOCOL_DATA = {
    "Aave": {
        "base_apy": 0.072,  # 7.2%
        "tvl": 5_000_000,
        "volatility": 0.15,
        "risk_score": 0.3
    },
    "Morpho": {
        "base_apy": 0.068,  # 6.8%
        "tvl": 3_000_000,
        "volatility": 0.12,
        "risk_score": 0.25
    },
    "Spark": {
        "base_apy": 0.070,  # 7.0%
        "tvl": 2_000_000,
        "volatility": 0.18,
        "risk_score": 0.35
    },
    "Uniswap": {
        "base_apy": 0.065,  # 6.5%
        "tvl": 4_000_000,
        "volatility": 0.20,
        "risk_score": 0.40
    }
}

def fetch_protocol_metrics() -> pd.DataFrame:
    """
    Fetch current metrics for all protocols
    Returns DataFrame with columns: protocol, apy, tvl, volatility, risk_score
    """
    data = []
    for protocol, metrics in PROTOCOL_DATA.items():
        # Add some random variation to simulate real-time updates
        apy_variation = np.random.normal(0, 0.001)  # ±0.1% variation
        data.append({
            "protocol": protocol,
            "apy": metrics["base_apy"] + apy_variation,
            "tvl": metrics["tvl"],
            "volatility": metrics["volatility"] + np.random.normal(0, 0.01),
            "risk_score": metrics["risk_score"] + np.random.normal(0, 0.02),
            "timestamp": pd.Timestamp.now()
        })
    
    df = pd.DataFrame(data)
    return df

def fetch_historical_yield(protocol: str, days: int = 30) -> List[float]:
    """
    Fetch historical yield data for a protocol
    In production, would query historical APY data from subgraphs
    """
    base_apy = PROTOCOL_DATA[protocol]["base_apy"]
    # Generate mock historical data with trend
    historical = []
    for i in range(days):
        variation = np.random.normal(0, 0.005)
        trend = 0.0001 * (days - i)  # Slight upward trend
        historical.append(base_apy + variation + trend)
    
    return historical

def fetch_protocol_risk_metrics() -> Dict[str, float]:
    """
    Fetch risk metrics for all protocols
    Returns dict mapping protocol name to risk score (0-1, lower is better)
    """
    return {
        protocol: metrics["risk_score"]
        for protocol, metrics in PROTOCOL_DATA.items()
    }

if __name__ == "__main__":
    # Test data fetching
    df = fetch_protocol_metrics()
    print("Protocol Metrics:")
    print(df)
    
    print("\nRisk Metrics:")
    print(fetch_protocol_risk_metrics())


