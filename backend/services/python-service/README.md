# Moorcheh Python Service

This Python microservice provides Moorcheh AI integration for storing and searching market analyses.

## Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
   - `MOORCHEH_API_KEY` - Your Moorcheh API key (should be in parent `.env` file)
   - `PORT` - Service port (default: 8000)

The service will automatically load environment variables from `../.env` file.

## Running

### Development (with auto-reload):
```bash
python main.py
```

### Production:
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Endpoints

- `GET /health` - Health check
- `POST /store-analysis` - Store an analysis result
- `POST /find-similar` - Find similar past analyses

## API Examples

### Store Analysis
```bash
curl -X POST http://localhost:8000/store-analysis \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "BTC-2024",
    "analysis": {
      "suspicionScore": 72,
      "riskLevel": "HIGH",
      "signals": [...]
    },
    "market": {
      "title": "Bitcoin Price",
      "category": "crypto",
      "volume": 10000
    }
  }'
```

### Find Similar
```bash
curl -X POST http://localhost:8000/find-similar \
  -H "Content-Type: application/json" \
  -d '{
    "ticker": "BTC-2024",
    "analysis": {...},
    "limit": 5
  }'
```

## Notes

- The service creates a namespace called "kalshi-analyses" in Moorcheh
- All analyses are stored as text documents with metadata
- Semantic search uses Moorcheh's vector similarity search
