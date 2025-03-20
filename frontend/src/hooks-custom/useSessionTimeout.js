// hooks-custom/useSessionTimeout.js
import { useEffect } from 'react';

export function useSessionTimeout(options = {}) {
  const {
    timeoutMinutes = 3,
    warningSeconds = 60,
    checkIntervalSeconds = 5,
    onTimeout = () => window.location.href = '/login',
    onWarning = () => {}
  } = options;

  useEffect(() => {
    // Session timeout configuration
    const SESSION_TIMEOUT = timeoutMinutes * 60 * 1000;
    const WARNING_TIME = warningSeconds * 1000;
    const CHECK_INTERVAL = checkIntervalSeconds * 1000;

    let lastActivity = Date.now();
    let warningDisplayed = false;
    let timeoutTimer;
    let warningTimer;
    let checkActivityInterval;

    // Events to track user activity
    const activityEvents = [
      'mousedown', 'mousemove', 'keypress',
      'scroll', 'touchstart', 'click', 'keydown'
    ];

    // Function to update last activity time
    function updateLastActivity() {
      lastActivity = Date.now();

      // If warning was displayed but user became active again
      if (warningDisplayed) {
        warningDisplayed = false;

        // Reset timers
        resetTimers();
      }
    }

    // Function to reset all timers
    function resetTimers() {
      clearTimeout(timeoutTimer);
      clearTimeout(warningTimer);

      // Set new timers
      warningTimer = setTimeout(showWarning, SESSION_TIMEOUT - WARNING_TIME);
      timeoutTimer = setTimeout(handleTimeout, SESSION_TIMEOUT);
    }

    // Function to show warning message
    function showWarning() {
      warningDisplayed = true;
      onWarning();

       timeoutTimer = setTimeout(handleTimeout, WARNING_TIME);
    }

    // Function to handle timeout
    function handleTimeout() {
      // Clean up event listeners
      cleanupEventListeners();

      // Call the onTimeout callback
      onTimeout();
    }

    // Function to clean up event listeners
    function cleanupEventListeners() {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateLastActivity);
      });
      clearInterval(checkActivityInterval);
    }

    // Add event listeners for user activity
    activityEvents.forEach(event => {
      document.addEventListener(event, updateLastActivity);
    });

    // Set initial timers
    resetTimers();

    // Set interval to periodically check for inactivity
    checkActivityInterval = setInterval(() => {
      const inactiveTime = Date.now() - lastActivity;

      // If inactive for longer than timeout, log out
      if (inactiveTime >= SESSION_TIMEOUT) {
        handleTimeout();
      }
      // If inactive long enough to show warning but warning not shown yet
      else if (inactiveTime >= (SESSION_TIMEOUT - WARNING_TIME) && !warningDisplayed) {
        showWarning();
      }
    }, CHECK_INTERVAL);

    // Clean up function
    return () => {
      cleanupEventListeners();
      clearTimeout(timeoutTimer);
      clearTimeout(warningTimer);
    };
  }, [timeoutMinutes, warningSeconds, checkIntervalSeconds, onTimeout, onWarning]);

  // Return functions to manually extend the session or force timeout if needed
  return {};
}