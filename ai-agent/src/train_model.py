"""
train_model.py
Training pipeline for yield prediction and risk analysis models
For hackathon, uses simple regression models with mock data
"""
import pandas as pd
import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
import pickle
import os
from pathlib import Path

# Mock training data generator
def generate_training_data(n_samples: int = 1000) -> pd.DataFrame:
    """
    Generate mock training data with features:
    - protocol (encoded)
    - historical_apy
    - tvl
    - volatility
    - market_condition (0-1)
    """
    np.random.seed(42)
    
    protocols = ["Aave", "Morpho", "Spark", "Uniswap"]
    data = []
    
    for _ in range(n_samples):
        protocol_idx = np.random.randint(0, len(protocols))
        protocol = protocols[protocol_idx]
        
        # Base APY varies by protocol
        base_apy = {
            "Aave": 0.072,
            "Morpho": 0.068,
            "Spark": 0.070,
            "Uniswap": 0.065
        }[protocol]
        
        historical_apy = base_apy + np.random.normal(0, 0.01)
        tvl = np.random.lognormal(15, 0.5)
        volatility = np.random.uniform(0.10, 0.25)
        market_condition = np.random.uniform(0, 1)
        
        # Target: future APY (with some relationship to features)
        future_apy = (
            base_apy +
            0.3 * (historical_apy - base_apy) +
            0.1 * np.log(tvl) / 20 -
            0.2 * volatility +
            np.random.normal(0, 0.005)
        )
        
        data.append({
            "protocol_encoded": protocol_idx,
            "historical_apy": historical_apy,
            "tvl": np.log(tvl),  # Log transform for better distribution
            "volatility": volatility,
            "market_condition": market_condition,
            "target_apy": future_apy
        })
    
    return pd.DataFrame(data)

def train_yield_predictor() -> tuple:
    """
    Train a model to predict future yield for each protocol
    Returns (model, scaler)
    """
    # Generate training data
    df = generate_training_data(1000)
    
    # Features
    X = df[["protocol_encoded", "historical_apy", "tvl", "volatility", "market_condition"]]
    y = df["target_apy"]
    
    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    # Train model (Random Forest for non-linearity)
    model = RandomForestRegressor(n_estimators=100, random_state=42, max_depth=10)
    model.fit(X_scaled, y)
    
    return model, scaler

def train_risk_analyzer() -> tuple:
    """
    Train a model to predict risk scores for protocols
    Returns (model, scaler)
    """
    df = generate_training_data(1000)
    
    # Risk score is inversely related to APY stability and TVL
    df["risk_score"] = (
        0.3 * df["volatility"] +
        0.2 * (1 - df["tvl"] / df["tvl"].max()) +
        0.5 * np.random.uniform(0.2, 0.5, len(df))
    )
    
    X = df[["protocol_encoded", "historical_apy", "tvl", "volatility"]]
    y = df["risk_score"]
    
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)
    
    model = LinearRegression()
    model.fit(X_scaled, y)
    
    return model, scaler

def save_models():
    """Save trained models to disk"""
    models_dir = Path(__file__).parent.parent / "models"
    models_dir.mkdir(exist_ok=True)
    
    # Train and save yield predictor
    yield_model, yield_scaler = train_yield_predictor()
    with open(models_dir / "yield_predictor.pkl", "wb") as f:
        pickle.dump((yield_model, yield_scaler), f)
    print("Saved yield_predictor.pkl")
    
    # Train and save risk analyzer
    risk_model, risk_scaler = train_risk_analyzer()
    with open(models_dir / "risk_analyzer.pkl", "wb") as f:
        pickle.dump((risk_model, risk_scaler), f)
    print("Saved risk_analyzer.pkl")

if __name__ == "__main__":
    save_models()
    print("Models trained and saved successfully!")


