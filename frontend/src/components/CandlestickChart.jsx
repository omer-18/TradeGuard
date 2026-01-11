import React, { useState, useEffect } from 'react';
import './CandlestickChart.css';

const API_BASE = '/api';

/**
 * Simple Candlestick Chart Component
 * Displays OHLC (Open, High, Low, Close) price data
 */
function CandlestickChart({ ticker, seriesTicker, days = 7 }) {
  const [candlesticks, setCandlesticks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState(60); // 1 hour default

  useEffect(() => {
    if (ticker && seriesTicker) {
      loadCandlesticks();
    }
  }, [ticker, seriesTicker, days, period]);

  const loadCandlesticks = async () => {
    if (!ticker || !seriesTicker) return;

    setLoading(true);
    setError(null);

    try {
      const endTs = Math.floor(Date.now() / 1000);
      const startTs = endTs - (days * 24 * 60 * 60);

      const url = `${API_BASE}/markets/${ticker}/candlesticks?` +
        `seriesTicker=${encodeURIComponent(seriesTicker)}&` +
        `startTs=${startTs}&endTs=${endTs}&periodInterval=${period}`;

      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to load candlesticks');
      }

      setCandlesticks(data.candlesticks || []);
    } catch (err) {
      console.error('Error loading candlesticks:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!ticker || !seriesTicker) {
    return (
      <div className="candlestick-chart-placeholder">
        <p>Select a market to view price history</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="candlestick-chart-loading">
        <div className="spinner-small"></div>
        <p>Loading price history...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="candlestick-chart-error">
        <p>⚠️ {error}</p>
        <button onClick={loadCandlesticks} className="retry-btn">Retry</button>
      </div>
    );
  }

  if (candlesticks.length === 0) {
    return (
      <div className="candlestick-chart-empty">
        <p>No price history available</p>
      </div>
    );
  }

  // Calculate chart dimensions and scaling
  const maxPrice = Math.max(...candlesticks.map(c => c.high || 0));
  const minPrice = Math.min(...candlesticks.map(c => c.low || 0));
  const priceRange = maxPrice - minPrice || 0.1;
  const chartHeight = 200;
  const chartWidth = Math.max(400, candlesticks.length * 8);

  const getY = (price) => {
    return chartHeight - ((price - minPrice) / priceRange) * chartHeight;
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    if (period >= 1440) return date.toLocaleDateString();
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="candlestick-chart-container">
      <div className="chart-controls">
        <label>
          Period:
          <select value={period} onChange={(e) => setPeriod(parseInt(e.target.value))}>
            <option value={1}>1 Minute</option>
            <option value={60}>1 Hour</option>
            <option value={1440}>1 Day</option>
          </select>
        </label>
        <label>
          Days:
          <select value={days} onChange={(e) => {
            const newDays = parseInt(e.target.value);
            if (newDays !== days) {
              // This will trigger useEffect
              setCandlesticks([]);
              setTimeout(() => {
                const endTs = Math.floor(Date.now() / 1000);
                const startTs = endTs - (newDays * 24 * 60 * 60);
                loadCandlesticks();
              }, 0);
            }
          }}>
            <option value={1}>1 Day</option>
            <option value={7}>7 Days</option>
            <option value={30}>30 Days</option>
          </select>
        </label>
      </div>

      <div className="chart-info">
        <span>High: {(maxPrice * 100).toFixed(1)}%</span>
        <span>Low: {(minPrice * 100).toFixed(1)}%</span>
        <span>Points: {candlesticks.length}</span>
      </div>

      <div className="candlestick-chart" style={{ width: '100%', overflowX: 'auto' }}>
        <svg width={chartWidth} height={chartHeight + 40} viewBox={`0 0 ${chartWidth} ${chartHeight + 40}`}>
          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map(ratio => {
            const y = chartHeight - (ratio * chartHeight);
            const price = minPrice + (ratio * priceRange);
            return (
              <g key={ratio}>
                <line
                  x1="0"
                  y1={y}
                  x2={chartWidth}
                  y2={y}
                  stroke="#333"
                  strokeWidth="0.5"
                  strokeDasharray="2,2"
                  opacity="0.3"
                />
                <text
                  x="0"
                  y={y - 2}
                  fill="#888"
                  fontSize="10"
                >
                  {(price * 100).toFixed(1)}%
                </text>
              </g>
            );
          })}

          {/* Candlesticks */}
          {candlesticks.map((candle, idx) => {
            const x = (idx / candlesticks.length) * chartWidth;
            const width = (chartWidth / candlesticks.length) * 0.8;
            const isUp = candle.close >= candle.open;
            const openY = getY(candle.open);
            const closeY = getY(candle.close);
            const highY = getY(candle.high);
            const lowY = getY(candle.low);

            return (
              <g key={idx} className="candlestick">
                {/* Wick (high-low line) */}
                <line
                  x1={x + width / 2}
                  y1={highY}
                  x2={x + width / 2}
                  y2={lowY}
                  stroke={isUp ? '#4caf50' : '#f44336'}
                  strokeWidth="1"
                />
                {/* Body (open-close rectangle) */}
                <rect
                  x={x}
                  y={Math.min(openY, closeY)}
                  width={width}
                  height={Math.abs(closeY - openY) || 1}
                  fill={isUp ? '#4caf50' : '#f44336'}
                  stroke={isUp ? '#2e7d32' : '#c62828'}
                  strokeWidth="1"
                />
              </g>
            );
          })}

          {/* X-axis labels */}
          {candlesticks.filter((_, idx) => idx % Math.ceil(candlesticks.length / 5) === 0).map((candle, idx) => {
            const x = (idx * Math.ceil(candlesticks.length / 5) / candlesticks.length) * chartWidth;
            return (
              <text
                key={idx}
                x={x}
                y={chartHeight + 15}
                fill="#888"
                fontSize="9"
                textAnchor="middle"
              >
                {formatTime(candle.start_ts)}
              </text>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default CandlestickChart;
