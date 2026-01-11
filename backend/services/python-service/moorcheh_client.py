"""
Moorcheh Client Module
Handles all interactions with Moorcheh API for storing and searching analyses
"""
import os
from datetime import datetime
from typing import List, Dict, Optional
from pathlib import Path
from moorcheh_sdk import MoorchehClient, MoorchehError, ConflictError
from dotenv import load_dotenv

# Load environment variables from parent .env file
env_path = Path(__file__).parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)

# Moorcheh namespace for storing analyses
NAMESPACE_NAME = "kalshi-analyses"

class MoorchehAnalysisClient:
    """Client for storing and searching market analyses in Moorcheh"""
    
    def __init__(self):
        """Initialize Moorcheh client with API key"""
        api_key = os.getenv("MOORCHEH_API_KEY")
        if not api_key:
            raise ValueError("MOORCHEH_API_KEY environment variable is required")
        
        try:
            self.client = MoorchehClient(api_key=api_key)
            self.namespace_initialized = False
        except Exception as e:
            raise ValueError(f"Failed to initialize Moorcheh client: {e}")
    
    def _ensure_namespace(self):
        """Create namespace if it doesn't exist"""
        if self.namespace_initialized:
            return
        
        try:
            # Try to create namespace
            self.client.namespaces.create(namespace_name=NAMESPACE_NAME, type="text")
            print(f"[OK] Created Moorcheh namespace: {NAMESPACE_NAME}")
            self.namespace_initialized = True
        except ConflictError:
            # Namespace already exists, that's fine
            print(f"[INFO] Moorcheh namespace '{NAMESPACE_NAME}' already exists")
            self.namespace_initialized = True
        except MoorchehError as e:
            print(f"[WARN] Error creating Moorcheh namespace: {e}")
            raise
    
    def store_analysis(self, ticker: str, analysis: Dict, market: Dict) -> Dict:
        """
        Store an analysis result in Moorcheh
        
        Args:
            ticker: Market ticker (e.g., "BTC-2024")
            analysis: Analysis result dictionary with suspicionScore, riskLevel, signals, etc.
            market: Market data dictionary with title, category, volume, etc.
        
        Returns:
            Dictionary with status and memory_id
        """
        try:
            self._ensure_namespace()
            
            # Format analysis data as text document
            timestamp = datetime.utcnow().isoformat()
            doc_id = f"{ticker}_{int(datetime.utcnow().timestamp())}"
            
            # Extract signals
            signals_list = []
            if analysis.get("signals"):
                signals_list = [s.get("type", "") for s in analysis["signals"]]
            
            # Build text content
            text_content = f"""
Market Analysis: {ticker}
Title: {market.get('title', 'N/A')}
Suspicion Score: {analysis.get('suspicionScore', 0)}/100
Risk Level: {analysis.get('riskLevel', 'UNKNOWN')}
Confidence: {analysis.get('confidence', 0)}%

Signals Triggered: {', '.join(signals_list) if signals_list else 'None'}

Market Context:
- Category: {market.get('category', 'N/A')}
- Volume: {market.get('volume', 0):,}
- Status: {market.get('status', 'N/A')}
- Current Price: {market.get('last_price', 0) * 100 if market.get('last_price') else 0:.1f}%

Summary: {analysis.get('summary', 'No summary available')}
"""
            
            # Prepare document
            document = {
                "id": doc_id,
                "text": text_content.strip()
            }
            
            # Upload to Moorcheh
            result = self.client.documents.upload(
                namespace_name=NAMESPACE_NAME,
                documents=[document]
            )
            
            print(f"[OK] Stored analysis in Moorcheh: {ticker} (ID: {doc_id})")
            
            return {
                "status": "success",
                "memory_id": doc_id,
                "ticker": ticker
            }
            
        except MoorchehError as e:
            print(f"[ERROR] Moorcheh error storing analysis: {e}")
            raise
        except Exception as e:
            print(f"[ERROR] Unexpected error storing analysis: {e}")
            raise
    
    def find_similar_analyses(self, ticker: str, analysis: Optional[Dict], limit: int = 5) -> List[Dict]:
        """
        Find similar past analyses using semantic search
        
        Args:
            ticker: Current market ticker (to exclude from results)
            analysis: Current analysis result (optional, for better search)
            limit: Maximum number of results to return
        
        Returns:
            List of similar analyses with ticker, score, risk level, etc.
        """
        try:
            self._ensure_namespace()
            
            # Build search query
            if analysis:
                # Use analysis details for better search
                signals = []
                if analysis.get("signals"):
                    signals = [s.get("type", "") for s in analysis["signals"]]
                
                score = analysis.get("suspicionScore", 0)
                risk_level = analysis.get("riskLevel", "")
                
                query = f"Market with suspicion score {score}, risk level {risk_level}, signals: {', '.join(signals[:3]) if signals else 'none'}"
            else:
                # Generic search for the ticker
                query = f"Market analysis {ticker} prediction trading"
            
            # Perform semantic search
            search_results = self.client.similarity_search.query(
                namespaces=[NAMESPACE_NAME],
                query=query,
                top_k=limit + 1  # Get one extra to filter out current ticker
            )
            
            # Parse results
            similar_markets = []
            if search_results and "results" in search_results:
                for result in search_results["results"]:
                    # Extract ticker from document ID or text
                    doc_id = result.get("id", "")
                    doc_text = result.get("text", "")
                    
                    # Skip if it's the same ticker
                    if ticker and ticker in doc_id:
                        continue
                    
                    # Parse metadata from text
                    # Extract ticker, score, risk level from the text
                    ticker_match = None
                    score_match = None
                    risk_match = None
                    
                    # Try to extract from text
                    lines = doc_text.split("\n")
                    for line in lines:
                        if "Market Analysis:" in line:
                            ticker_match = line.split("Market Analysis:")[-1].strip()
                        elif "Suspicion Score:" in line:
                            try:
                                score_part = line.split("Suspicion Score:")[-1].split("/")[0].strip()
                                score_match = int(score_part)
                            except:
                                pass
                        elif "Risk Level:" in line:
                            risk_match = line.split("Risk Level:")[-1].strip()
                    
                    if ticker_match:
                        similar_markets.append({
                            "ticker": ticker_match,
                            "score": score_match or 0,
                            "riskLevel": risk_match or "UNKNOWN",
                            "similarity": result.get("similarity", 0),
                            "text": doc_text[:200] + "..." if len(doc_text) > 200 else doc_text
                        })
            
            # Limit results
            similar_markets = similar_markets[:limit]
            
            print(f"[OK] Found {len(similar_markets)} similar analyses for {ticker}")
            
            return similar_markets
            
        except MoorchehError as e:
            print(f"[ERROR] Moorcheh error searching: {e}")
            return []
        except Exception as e:
            print(f"[ERROR] Unexpected error searching: {e}")
            return []
