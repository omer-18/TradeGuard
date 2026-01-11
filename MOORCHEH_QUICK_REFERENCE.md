# Moorcheh Integration - Quick Reference

## Elevator Pitch (30 seconds)

"We're using Moorcheh AI as a semantic memory system for our insider trading detection platform. Every time we analyze a market, we store the results in Moorcheh. When users ask questions, we use semantic search to find similar past cases and enhance AI responses with historical context. This transforms our platform from a reactive analyzer into a learning system that gets smarter over time."

## Key Technologies

1. **MIB (Maximally Informative Binarization)** - Advanced compression for fast storage/retrieval
2. **ITS (Information-Theoretic Score)** - Superior relevance scoring vs. cosine similarity
3. **Semantic Search** - Meaning-based search, not keyword matching

## What We're Doing

### 1. Store Every Analysis
- After analyzing a market → Store in Moorcheh namespace "kalshi-analyses"
- Includes: scores, signals, patterns, market context

### 2. Semantic Search
- Query: "markets with high VPIN and volume spikes"
- Returns: Truly similar markets ranked by relevance (ITS scoring)

### 3. Enhance AI Responses
- Before AI responds → Search for similar markets
- AI includes: "This pattern is similar to BTC-2024 (score 72) and ETH-2024 (score 68)"

### 4. Similar Markets API
- Endpoint: `GET /api/analyses/similar?ticker=XXX`
- Returns: List of similar markets for frontend display

## Architecture

```
Node.js Backend → Python Microservice (FastAPI) → Moorcheh SDK → Moorcheh API
```

## Key Features

- ✅ Semantic search (meaning-based, not keywords)
- ✅ ITS scoring (better than cosine similarity)
- ✅ MIB technology (fast and scalable)
- ✅ Graceful degradation (works even if service down)

## Demo Flow

1. **Analyze a market** → Check Python service logs: "✅ Stored analysis in Moorcheh"
2. **Ask AI question** → AI response mentions similar past cases
3. **Query similar markets** → `GET /api/analyses/similar?ticker=BTC-2024`

## Technical Stack

- **Python**: FastAPI microservice with Moorcheh SDK
- **Node.js**: HTTP wrapper service
- **Storage**: Moorcheh namespace "kalshi-analyses"
- **Search**: Semantic search with ITS scoring

## Value Proposition

**Before Moorcheh:**
- AI: "This market has a high suspicion score"
- No historical context
- No pattern learning

**After Moorcheh:**
- AI: "This market shows similar patterns to 3 past suspicious markets. BTC-2023 scored 75 and was confirmed suspicious. The combination of high VPIN and volume spikes is a strong indicator."
- Historical context
- Pattern learning
- Educational responses

## One-Liner

"Moorcheh gives our AI a memory - it remembers every analysis and uses semantic search to find similar patterns, making our AI responses more contextual and educational."
