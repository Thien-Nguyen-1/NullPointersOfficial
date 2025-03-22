import React, { useState, useContext, useEffect, useRef } from 'react';
import { AuthContext } from '../services/AuthContext';
import { useSessionTimeout } from './useSessionTimeout';
import { SESSION_CONFIG } from '../config/sessionConfig';

export function SessionManager(props) {
  // Default to the config values but allow override through props
  const timeoutMinutes = props.timeoutMinutes || SESSION_CONFIG.timeoutMinutes;
  const warningSeconds = props.warningSeconds || SESSION_CONFIG.warningSeconds;

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(warningSeconds);
  const { logoutUser } = useContext(AuthContext);

  const timerRef = useRef(null); // Stores the countdown interval ID
  const sessionTimeoutRef = useRef(null); // Stores the session timeout manager

  // When the session times out
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
        window.location.href = '/';
      }
    }, 100);
  };

  // Get a reference to the session timeout
  const sessionTimeout = useSessionTimeout({
    timeoutMinutes: timeoutMinutes,
    warningSeconds: warningSeconds,
    onWarning: () => {
      console.log("Warning callback triggered!");
      setShowWarning(true);
    },
    onTimeout: handleTimeout
  });

  // Store the session timeout in a ref so it persists between renders
  useEffect(() => {
    sessionTimeoutRef.current = sessionTimeout;
  }, [sessionTimeout]);

  // Handle the countdown timer when warning is shown
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
      // Reset countdown for next time
      setCountdown(warningSeconds);
    }

    // Cleanup function
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [showWarning, warningSeconds]);

  // Add a function to extend the session
  const extendSession = () => {
    console.log("Extend session button clicked!");
    if (sessionTimeoutRef.current) {
      sessionTimeoutRef.current.resetSession(); // Reset the session timers
    } else {
      console.log("sessionTimeoutRef.current is null!");
    }
    setShowWarning(false);
  };

  return (
    <>
      {showWarning && (
        <div className="timeout-warning-overlay">
          <div className="timeout-warning-content">
            <h3>Session Timeout Warning</h3>
            <p>Your session will expire due to inactivity in <strong>{countdown}</strong> seconds.</p>
            <p>You will be redirected to login page.</p>
            <button onClick={extendSession}>Keep Session Active</button>
          </div>
        </div>
      )}
    </>
  );
}