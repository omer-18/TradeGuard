"""
FastAPI server for Moorcheh integration
Provides REST endpoints for Node.js backend to store and search analyses
"""
import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict
from dotenv import load_dotenv
from pathlib import Path
from moorcheh_client import MoorchehAnalysisClient

# Load environment variables from parent .env file
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Initialize FastAPI app
app = FastAPI(title="Moorcheh Analysis Service", version="1.0.0")

# CORS middleware to allow Node.js backend to call this service
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Moorcheh client
try:
    moorcheh_client = MoorchehAnalysisClient()
    print("[OK] Moorcheh client initialized successfully")
except Exception as e:
    print(f"[WARN] Failed to initialize Moorcheh client: {e}")
    moorcheh_client = None

# Request/Response models
class StoreAnalysisRequest(BaseModel):
    ticker: str
    analysis: Dict
    market: Dict

class StoreAnalysisResponse(BaseModel):
    status: str
    memory_id: Optional[str] = None
    ticker: Optional[str] = None
    error: Optional[str] = None

class FindSimilarRequest(BaseModel):
    ticker: str
    analysis: Optional[Dict] = None
    limit: int = 5

class FindSimilarResponse(BaseModel):
    status: str
    similar_markets: List[Dict] = []
    error: Optional[str] = None

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    if moorcheh_client is None:
        return {
            "status": "unhealthy",
            "service": "moorcheh-analysis-service",
            "error": "Moorcheh client not initialized"
        }
    
    return {
        "status": "healthy",
        "service": "moorcheh-analysis-service"
    }

# Store analysis endpoint
@app.post("/store-analysis", response_model=StoreAnalysisResponse)
async def store_analysis(request: StoreAnalysisRequest):
    """
    Store an analysis result in Moorcheh
    
    Request body:
    - ticker: Market ticker
    - analysis: Analysis result with suspicionScore, riskLevel, signals, etc.
    - market: Market data with title, category, volume, etc.
    """
    if moorcheh_client is None:
        raise HTTPException(
            status_code=503,
            detail="Moorcheh client not initialized. Check MOORCHEH_API_KEY."
        )
    
    try:
        result = moorcheh_client.store_analysis(
            ticker=request.ticker,
            analysis=request.analysis,
            market=request.market
        )
        return StoreAnalysisResponse(**result)
    except Exception as e:
        return StoreAnalysisResponse(
            status="error",
            error=str(e)
        )

# Find similar analyses endpoint
@app.post("/find-similar", response_model=FindSimilarResponse)
async def find_similar(request: FindSimilarRequest):
    """
    Find similar past analyses using semantic search
    
    Request body:
    - ticker: Current market ticker
    - analysis: Current analysis result (optional)
    - limit: Maximum number of results (default: 5)
    """
    if moorcheh_client is None:
        raise HTTPException(
            status_code=503,
            detail="Moorcheh client not initialized. Check MOORCHEH_API_KEY."
        )
    
    try:
        similar_markets = moorcheh_client.find_similar_analyses(
            ticker=request.ticker,
            analysis=request.analysis,
            limit=request.limit
        )
        return FindSimilarResponse(
            status="success",
            similar_markets=similar_markets
        )
    except Exception as e:
        return FindSimilarResponse(
            status="error",
            similar_markets=[],
            error=str(e)
        )

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with service information"""
    return {
        "service": "Moorcheh Analysis Service",
        "version": "1.0.0",
        "endpoints": {
            "health": "GET /health",
            "store_analysis": "POST /store-analysis",
            "find_similar": "POST /find-similar"
        }
    }

if __name__ == "__main__":
    import uvicorn
    
    port = int(os.getenv("PORT", 8000))
    print(f"[START] Starting Moorcheh Analysis Service on port {port}")
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True
    )
