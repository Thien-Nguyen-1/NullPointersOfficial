import React, { useEffect, useState } from 'react';
import '../styles/AlertComponent.css';

const AlertComponent = ({ message, type = 'success', duration = 3000, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    if (!message) return;

    // Reset visibility when message changes
    setIsVisible(true);

    // Auto-dismiss after duration
    const timer = setTimeout(() => {
      setIsVisible(false);
      // Give time for fade-out animation before actually removing
      setTimeout(() => {
        if (onClose) onClose();
      }, 300);
    }, duration);

    return () => clearTimeout(timer);
  }, [message, duration, onClose]);

  if (!message || !isVisible) return null;

  return (
    <div className={`alert-container ${isVisible ? 'show' : 'hide'}`}>
      <div className={`alert-content ${type}`}>
        <div className="alert-icon">
          {type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ'}
        </div>
        <div className="alert-message">{message}</div>
        <button
          className="alert-close"
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => { if (onClose) onClose(); }, 300);
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default AlertComponent;