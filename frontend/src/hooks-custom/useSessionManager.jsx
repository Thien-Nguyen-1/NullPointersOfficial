import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../services/AuthContext';
import { useSessionTimeout } from './useSessionTimeout';

export function SessionManager({ timeoutMinutes = 3, warningSeconds = 60 }) {
  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(warningSeconds);
  const { logoutUser } = useContext(AuthContext);
  const timerRef = useRef(null);

  // Effect to handle the countdown
  useEffect(() => {
    if (showWarning) {
      // Reset countdown when warning appears
      setCountdown(warningSeconds);

      // Clear any existing timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      // Start a new countdown timer
      timerRef.current = setInterval(() => {
        setCountdown(prevCount => {
          // If we've reached 1, clear the interval to prevent going below 0
          if (prevCount <= 1) {
            clearInterval(timerRef.current);
            return 0;
          }
          return prevCount - 1;
        });
      }, 1000);
    } else {
      // Clear timer when warning is dismissed
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Reset countdown
      setCountdown(warningSeconds);
    }

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [showWarning, warningSeconds]);

  // Custom timeout handler to sync with our countdown
  const handleTimeout = async () => {
    // Clear any running timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    // Set countdown to 0 for visual consistency
    setCountdown(0);

    // Small delay to ensure the 0 is displayed
    setTimeout(async () => {
      try {
        await logoutUser();
      } catch (error) {
        console.error("Error during timeout logout:", error);
        // Fallback logout
        sessionStorage.clear();
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    }, 100);
  };

  useSessionTimeout({
    timeoutMinutes: timeoutMinutes,
    warningSeconds: warningSeconds,
    onWarning: () => setShowWarning(true),
    onTimeout: handleTimeout
  });

  return (
    <>
      {showWarning && (
        <div className="timeout-warning-overlay">
          <div className="timeout-warning-content">
            <h3>Session Timeout Warning</h3>
            <p>Your session will expire due to inactivity in <strong>{countdown}</strong> seconds.</p>
            <button onClick={() => setShowWarning(false)}>Keep Session Active</button>
          </div>
        </div>
      )}
    </>
  );
}