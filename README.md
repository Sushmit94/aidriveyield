# AI Agent - Yield Allocation Service

FastAPI microservice providing AI-driven yield predictions and risk analysis for DeFi protocols.

## Setup

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Train Models

Before running the API, train the prediction models:

```bash
python src/train_model.py
```

This will generate:
- `models/yield_predictor.pkl` - Model for predicting future yields
- `models/risk_analyzer.pkl` - Model for risk assessment

## Run Server

```bash
uvicorn src.main:app --reload
```

API will be available at `http://localhost:8000`

## API Endpoints

### GET `/recommendation`
Returns AI-recommended allocation weights, yield predictions, and risk scores.

**Response:**
```json
{
  "allocation": {
    "aave": 4000,
    "morpho": 3000,
    "spark": 2000,
    "uniswap": 1000
  },
  "predicted_yields": {
    "Aave": 0.072,
    "Morpho": 0.068,
    "Spark": 0.070,
    "Uniswap": 0.065
  },
  "risk_scores": {
    "Aave": 0.30,
    "Morpho": 0.25,
    "Spark": 0.35,
    "Uniswap": 0.40
  },
  "confidence": 0.85
}
```

### GET `/risk`
Returns risk analysis for all protocols.

### GET `/yields`
Returns yield predictions only.

## Integration

The frontend and StrategyManager contract can call these endpoints to:
1. Display current predictions
2. Get allocation recommendations for on-chain rebalancing
3. Monitor risk levels

See `docs/ARCHITECTURE.md` for integration flow.


