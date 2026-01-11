import React, { useState, useEffect } from 'react';
import './ExchangeStatus.css';

const API_BASE = '/api';

/**
 * Exchange Status Indicator Component
 * Shows current exchange operational status
 */
function ExchangeStatus({ className = '' }) {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState(null);

  useEffect(() => {
    loadExchangeInfo();
    // Refresh every 30 seconds
    const interval = setInterval(loadExchangeInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadExchangeInfo = async () => {
    try {
      const [statusRes, scheduleRes] = await Promise.all([
        fetch(`${API_BASE}/exchange/status`),
        fetch(`${API_BASE}/exchange/schedule`)
      ]);

      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setStatus(statusData);
      } else {
        // If API call fails, set status to indicate unavailable
        console.warn('Exchange status API returned error:', statusRes.status);
        setStatus({ status: 'unavailable' });
      }

      if (scheduleRes.ok) {
        const scheduleData = await scheduleRes.json();
        setSchedule(scheduleData);
      }
    } catch (err) {
      console.error('Error loading exchange info:', err);
      // Set status to unavailable on network errors
      setStatus({ status: 'unavailable' });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`exchange-status ${className}`}>
        <span className="status-dot loading"></span>
        <span>Checking...</span>
      </div>
    );
  }

  const exchangeStatus = status?.status || 'unknown';
  const isOpen = exchangeStatus === 'open' || exchangeStatus === 'active';
  const isUnavailable = exchangeStatus === 'unavailable' || exchangeStatus === 'unknown';

  // Don't show anything if status is unavailable/unknown to avoid confusion
  if (isUnavailable) {
    return null;
  }

  return (
    <div className={`exchange-status ${className}`} title={schedule ? `Schedule: ${schedule.schedule}` : ''}>
      <span className={`status-dot ${isOpen ? 'open' : 'closed'}`}></span>
      <span className="status-text">
        {isOpen ? 'Exchange Open' : `Exchange ${exchangeStatus}`}
      </span>
    </div>
  );
}

export default ExchangeStatus;
