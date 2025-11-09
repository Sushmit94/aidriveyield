"""
inference.py
AI inference functions for yield prediction and risk analysis
Loads trained models and makes predictions
"""
"""
inference.py
AI inference functions for yield prediction and risk analysis
Loads trained models and makes predictions
"""
import pickle
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, Tuple

# Fix the relative import - THIS IS THE KEY FIX
try:
    from .fetch_data import fetch_protocol_metrics
except ImportError:
    # Fallback for direct execution
    import sys
    from pathlib import Path
    
    # Add parent directory to path
    current_dir = Path(__file__).parent
    sys.path.insert(0, str(current_dir))
    
    from fetch_data import fetch_protocol_metrics

# Rest of your code stays the same...

PROTOCOL_ENCODING = {
    "Aave": 0,
    "Morpho": 1,
    "Spark": 2,
    "Uniswap": 3
}

def load_models() -> Tuple:
    """Load trained models from disk"""
    models_dir = Path(__file__).parent.parent / "models"
    
    # Load yield predictor
    with open(models_dir / "yield_predictor.pkl", "rb") as f:
        yield_model, yield_scaler = pickle.load(f)
    
    # Load risk analyzer
    with open(models_dir / "risk_analyzer.pkl", "rb") as f:
        risk_model, risk_scaler = pickle.load(f)
    
    return yield_model, yield_scaler, risk_model, risk_scaler

def predict_yield() -> Dict[str, float]:
    """
    Predict future yield (APY) for each protocol
    Returns dict mapping protocol name to predicted APY (as decimal)
    """
    try:
        yield_model, yield_scaler, _, _ = load_models()
    except FileNotFoundError:
        # Fallback to simple predictions if models not trained
        return {
            "Aave": 0.072,
            "Morpho": 0.068,
            "Spark": 0.070,
            "Uniswap": 0.065
        }
    
    # Fetch current metrics
    df = fetch_protocol_metrics()
    
    predictions = {}
    
    for _, row in df.iterrows():
        protocol = row["protocol"]
        protocol_encoded = PROTOCOL_ENCODING[protocol]
        
        # Prepare features
        features = np.array([[
            protocol_encoded,
            row["apy"],  # historical_apy
            np.log(row["tvl"]) if row["tvl"] > 0 else 0,  # log(tvl)
            row["volatility"],
            0.7  # market_condition (mock)
        ]])
        
        # Scale and predict
        features_scaled = yield_scaler.transform(features)
        predicted_apy = yield_model.predict(features_scaled)[0]
        
        # Ensure non-negative
        predictions[protocol] = max(0, predicted_apy)
    
    return predictions

def predict_risk() -> Dict[str, float]:
    """
    Predict risk scores for each protocol (0-1, lower is better)
    Returns dict mapping protocol name to risk score
    """
    try:
        _, _, risk_model, risk_scaler = load_models()
    except FileNotFoundError:
        # Fallback to simple risk scores
        return {
            "Aave": 0.30,
            "Morpho": 0.25,
            "Spark": 0.35,
            "Uniswap": 0.40
        }
    
    df = fetch_protocol_metrics()
    
    risk_scores = {}
    
    for _, row in df.iterrows():
        protocol = row["protocol"]
        protocol_encoded = PROTOCOL_ENCODING[protocol]
        
        features = np.array([[
            protocol_encoded,
            row["apy"],
            np.log(row["tvl"]) if row["tvl"] > 0 else 0,
            row["volatility"]
        ]])
        
        features_scaled = risk_scaler.transform(features)
        risk_score = risk_model.predict(features_scaled)[0]
        
        # Clamp to [0, 1]
        risk_scores[protocol] = max(0, min(1, risk_score))
    
    return risk_scores

def compute_optimal_allocation() -> Dict[str, float]:
    """
    Compute optimal allocation weights based on yield predictions and risk
    Returns dict mapping protocol name to allocation weight (0-1, sums to 1)
    """
    yields = predict_yield()
    risks = predict_risk()
    
    # Compute risk-adjusted yield (yield / risk)
    risk_adjusted_scores = {}
    for protocol in yields:
        if risks[protocol] > 0:
            risk_adjusted_scores[protocol] = yields[protocol] / (1 + risks[protocol])
        else:
            risk_adjusted_scores[protocol] = yields[protocol]
    
    # Normalize to get allocation weights (sum to 1.0)
    total_score = sum(risk_adjusted_scores.values())
    
    if total_score == 0:
        # Equal allocation if no scores
        return {protocol: 0.25 for protocol in yields.keys()}
    
    allocation = {
        protocol: score / total_score
        for protocol, score in risk_adjusted_scores.items()
    }
    
    # Ensure minimum 5% allocation per protocol (diversification)
    min_allocation = 0.05
    allocation_adjusted = {}
    excess = 0
    
    for protocol, weight in allocation.items():
        if weight < min_allocation:
            excess += (min_allocation - weight)
            allocation_adjusted[protocol] = min_allocation
        else:
            allocation_adjusted[protocol] = weight
    
    # Redistribute excess proportionally
    if excess > 0:
        total_above_min = sum(w for w in allocation.values() if w >= min_allocation)
        if total_above_min > 0:
            for protocol in allocation_adjusted:
                if allocation[protocol] >= min_allocation:
                    allocation_adjusted[protocol] += excess * (allocation[protocol] / total_above_min)
    
    # Normalize again to ensure sum = 1.0
    total = sum(allocation_adjusted.values())
    return {protocol: w / total for protocol, w in allocation_adjusted.items()}

if __name__ == "__main__":
    print("Yield Predictions:")
    print(predict_yield())
    
    print("\nRisk Scores:")
    print(predict_risk())
    
    print("\nOptimal Allocation:")
    print(compute_optimal_allocation())


