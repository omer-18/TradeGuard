"""
Test script for Moorcheh integration
Tests all endpoints and functionality
"""
import requests
import json
import time
import sys

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("[TEST] Testing health endpoint...")
    try:
        response = requests.get(f"{BASE_URL}/health", timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"[PASS] Health check passed: {data}")
            return True
        else:
            print(f"[FAIL] Health check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"[ERROR] Health check error: {e}")
        return False

def test_store_analysis():
    """Test storing an analysis"""
    print("\n[TEST] Testing store-analysis endpoint...")
    
    test_data = {
        "ticker": "TEST-2024",
        "analysis": {
            "suspicionScore": 72,
            "riskLevel": "HIGH",
            "confidence": 85,
            "signals": [
                {"type": "high_vpin", "severity": 4},
                {"type": "price_leadership", "severity": 5},
                {"type": "volume_spike", "severity": 3}
            ],
            "summary": "Test analysis with high VPIN and price leadership patterns"
        },
        "market": {
            "title": "Test Market for Moorcheh Integration",
            "category": "test",
            "volume": 10000,
            "status": "open",
            "last_price": 0.65
        }
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/store-analysis",
            json=test_data,
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            print(f"[PASS] Analysis stored successfully: {data}")
            return True, test_data
        else:
            print(f"[FAIL] Store analysis failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False, None
    except Exception as e:
        print(f"[ERROR] Store analysis error: {e}")
        return False, None

def test_find_similar(stored_data):
    """Test finding similar analyses"""
    print("\n[TEST] Testing find-similar endpoint...")
    
    # Wait a moment for document to be processed
    print("   Waiting 3 seconds for document processing...")
    time.sleep(3)
    
    test_query = {
        "ticker": "TEST-2024",
        "analysis": stored_data["analysis"] if stored_data else None,
        "limit": 5
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/find-similar",
            json=test_query,
            timeout=10
        )
        if response.status_code == 200:
            data = response.json()
            print(f"[PASS] Similar markets search successful")
            print(f"   Found {len(data.get('similar_markets', []))} similar markets")
            if data.get('similar_markets'):
                for market in data['similar_markets']:
                    print(f"   - {market.get('ticker', 'N/A')}: Score {market.get('score', 0)}")
            return True
        else:
            print(f"[FAIL] Find similar failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False
    except Exception as e:
        print(f"[ERROR] Find similar error: {e}")
        return False

def main():
    print("=" * 60)
    print("Moorcheh Integration Test Suite")
    print("=" * 60)
    
    # Test 1: Health check
    if not test_health():
        print("\n[ERROR] Service is not running. Please start the Python service first:")
        print("   cd backend/services/python-service")
        print("   python main.py")
        sys.exit(1)
    
    # Test 2: Store analysis
    success, stored_data = test_store_analysis()
    if not success:
        print("\n[ERROR] Failed to store analysis")
        sys.exit(1)
    
    # Test 3: Find similar
    test_find_similar(stored_data)
    
    print("\n" + "=" * 60)
    print("[SUCCESS] All tests completed!")
    print("=" * 60)

if __name__ == "__main__":
    main()
