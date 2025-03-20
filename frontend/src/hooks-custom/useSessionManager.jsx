import React, { useState, useContext } from 'react';
import { AuthContext } from '../services/AuthContext';
import { useSessionTimeout } from './useSessionTimeout';

// Create a component for session management
export function SessionManager() {
  const [showWarning, setShowWarning] = useState(false);
  const { logoutUser } = useContext(AuthContext);

  useSessionTimeout({
    timeoutMinutes: 3,
    warningSeconds: 60,
    onWarning: () => setShowWarning(true),
    onTimeout: async () => {
      try {
        await logoutUser();
      } catch (error) {
        console.error("Error during timeout logout:", error);
        // Fallback logout
        sessionStorage.clear();
        localStorage.removeItem('authToken');
        window.location.href = '/login';
      }
    }
  });

  return (
    <>
      {/* Add the warning modal here */}
      {showWarning && (
        <div className="timeout-warning-overlay">
          <div className="timeout-warning-content">
            <h3>Session Timeout Warning</h3>
            <p>Your session will expire due to inactivity soon.</p>
            <button onClick={() => setShowWarning(false)}>Keep Session Active</button>
          </div>
        </div>
      )}
    </>
  );
}