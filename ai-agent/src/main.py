"""
main.py
FastAPI server exposing AI endpoints for yield prediction and allocation recommendations
Frontend and StrategyManager (via oracle) can call these endpoints
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Optional
import inference

app = FastAPI(
    title="AI Yield Allocation Service",
    description="AI-driven yield prediction and risk analysis for DeFi protocols",
    version="1.0.0"
)

# CORS middleware for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=[ "http://localhost:3000",
        "https://*.vercel.app",],  # In production, specify frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AllocationWeights(BaseModel):
    """Allocation weights in basis points (e.g., 4000 = 40%)"""
    aave: int
    morpho: int
    spark: int
    uniswap: int

class RecommendationResponse(BaseModel):
    """Response containing allocation recommendation"""
    allocation: AllocationWeights
    predicted_yields: Dict[str, float]
    risk_scores: Dict[str, float]
    confidence: float

class RiskResponse(BaseModel):
    """Response containing risk analysis"""
    risk_scores: Dict[str, float]
    overall_risk: str  # "low", "medium", "high"
    recommendation: str

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "AI Yield Allocation Service",
        "version": "1.0.0"
    }

@app.get("/recommendation", response_model=RecommendationResponse)
async def get_recommendation():
    """
    Get AI-recommended allocation weights for DeFi protocols
    
    Integration Flow:
    1. Frontend calls this endpoint to display recommended allocation
    2. StrategyManager (or oracle) can call this to get weights for setAllocationWeights()
    3. Returns weights in basis points (10000 = 100%)
    
    Returns:
    - allocation: Weights for each protocol (basis points)
    - predicted_yields: Expected APY for each protocol (decimal, e.g., 0.072 = 7.2%)
    - risk_scores: Risk score for each protocol (0-1, lower is better)
    - confidence: Model confidence (0-1)
    """
    try:
        # Get predictions from AI model
        optimal_allocation = inference.compute_optimal_allocation()
        predicted_yields = inference.predict_yield()
        risk_scores = inference.predict_risk()
        
        # Convert allocation (0-1) to basis points (0-10000)
        allocation = AllocationWeights(
            aave=int(optimal_allocation.get("Aave", 0.25) * 10000),
            morpho=int(optimal_allocation.get("Morpho", 0.25) * 10000),
            spark=int(optimal_allocation.get("Spark", 0.25) * 10000),
            uniswap=int(optimal_allocation.get("Uniswap", 0.25) * 10000)
        )
        
        # Normalize to ensure sum = 10000
        total = allocation.aave + allocation.morpho + allocation.spark + allocation.uniswap
        if total != 10000:
            # Adjust proportionally
            factor = 10000 / total if total > 0 else 1
            allocation.aave = int(allocation.aave * factor)
            allocation.morpho = int(allocation.morpho * factor)
            allocation.spark = int(allocation.spark * factor)
            allocation.uniswap = int(allocation.uniswap * factor)
        
        # Calculate confidence based on prediction variance
        yield_values = list(predicted_yields.values())
        variance = sum((y - sum(yield_values)/len(yield_values))**2 for y in yield_values) / len(yield_values)
        confidence = max(0, min(1, 1 - variance * 100))  # Lower variance = higher confidence
        
        return RecommendationResponse(
            allocation=allocation,
            predicted_yields=predicted_yields,
            risk_scores=risk_scores,
            confidence=confidence
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating recommendation: {str(e)}")

@app.get("/risk", response_model=RiskResponse)
async def get_risk_analysis():
    """
    Get risk analysis for all protocols
    
    Returns:
    - risk_scores: Risk score for each protocol (0-1)
    - overall_risk: Overall portfolio risk level
    - recommendation: Text recommendation
    """
    try:
        risk_scores = inference.predict_risk()
        
        # Calculate overall risk (average, weighted by allocation if available)
        avg_risk = sum(risk_scores.values()) / len(risk_scores)
        
        if avg_risk < 0.3:
            overall_risk = "low"
            recommendation = "Portfolio risk is low. Consider increasing allocation to higher-yield protocols."
        elif avg_risk < 0.5:
            overall_risk = "medium"
            recommendation = "Portfolio risk is moderate. Current allocation is balanced."
        else:
            overall_risk = "high"
            recommendation = "Portfolio risk is high. Consider diversifying to lower-risk protocols."
        
        return RiskResponse(
            risk_scores=risk_scores,
            overall_risk=overall_risk,
            recommendation=recommendation
        )
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing risk: {str(e)}")

@app.get("/yields")
async def get_yield_predictions():
    """
    Get yield predictions for all protocols
    
    Returns dict mapping protocol name to predicted APY (decimal)
    """
    try:
        yields = inference.predict_yield()
        return {
            "predicted_yields": yields,
            "timestamp": inference.pd.Timestamp.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error predicting yields: {str(e)}")

@app.get("/historical/{protocol}")
async def get_historical_yields(protocol: str, days: int = 30):
    """
    Get historical yield data for a specific protocol
    
    Args:
        protocol: Protocol name (Aave, Morpho, Spark, Uniswap)
        days: Number of days of historical data (default 30)
    
    Returns:
        Historical yield data with timestamps
    """
    try:
        from fetch_data import fetch_historical_yield
        import pandas as pd
        
        # Validate protocol name (case-insensitive)
        valid_protocols = ["Aave", "Morpho", "Spark", "Uniswap"]
        protocol_capitalized = protocol.capitalize()
        
        if protocol_capitalized not in valid_protocols:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid protocol '{protocol}'. Must be one of: {', '.join(valid_protocols)}"
            )
        
        # Fetch historical data
        historical_yields = fetch_historical_yield(protocol_capitalized, days)
        
        # Create timestamps for the data
        end_date = pd.Timestamp.now()
        dates = [end_date - pd.Timedelta(days=i) for i in range(days-1, -1, -1)]
        
        return {
            "protocol": protocol_capitalized,
            "data": [
                {
                    "date": date.isoformat(),
                    "yield": float(yield_value)
                }
                for date, yield_value in zip(dates, historical_yields)
            ],
            "days": days
        }
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error fetching historical yields: {str(e)}"
        )

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)