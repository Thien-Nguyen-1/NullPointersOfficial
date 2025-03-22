import { useEffect, useRef, useCallback } from 'react';
import { SESSION_CONFIG } from '../config/sessionConfig';

export function useSessionTimeout(options = {}) {
  const {
    timeoutMinutes = SESSION_CONFIG.timeoutMinutes,
    warningSeconds = SESSION_CONFIG.warningSeconds,
    checkIntervalSeconds = SESSION_CONFIG.checkIntervalSeconds,
    onTimeout = () => window.location.href = '/',
    onWarning = () => {}
  } = options;

  // Use refs to maintain state across re-renders
  const stateRef = useRef({
    lastActivity: Date.now(),
    warningDisplayed: false,
    timeoutTimer: null, // ID of the timer that will trigger logout
    warningTimer: null, // ID of the timer that will trigger warning
    checkActivityInterval: null,
    lastInactiveMinuteLogged: 0,
    isTabActive: true,
    isInitialized: false
  });

  // Keep references to the session parameters
  const timeoutRef = useRef(timeoutMinutes * 60 * 1000);
  const warningTimeRef = useRef(warningSeconds * 1000);
  const checkIntervalRef = useRef(checkIntervalSeconds * 1000);
  const onTimeoutRef = useRef(onTimeout);
  const onWarningRef = useRef(onWarning);

  // Update refs if props change
  useEffect(() => {
    timeoutRef.current = timeoutMinutes * 60 * 1000;
    warningTimeRef.current = warningSeconds * 1000;
    checkIntervalRef.current = checkIntervalSeconds * 1000;
    onTimeoutRef.current = onTimeout;
    onWarningRef.current = onWarning;
  }, [timeoutMinutes, warningSeconds, checkIntervalSeconds, onTimeout, onWarning]);

  // Events to track user activity
  const activityEvents = [
    'mousedown', 'mousemove', 'keypress',
    'scroll', 'touchstart', 'click', 'keydown'
  ];

  // Function to reset all timers
  const resetTimers = useCallback(() => {
    const state = stateRef.current;
    //console.log('[SessionTimeout] Resetting all timers');
    clearTimeout(state.timeoutTimer);
    clearTimeout(state.warningTimer);

    // Set new timers
    state.warningTimer = setTimeout(() => {
      showWarning();
    }, timeoutRef.current - warningTimeRef.current);

    state.timeoutTimer = setTimeout(() => {
      handleTimeout();
    }, timeoutRef.current);

  }, []);

  // Function to show warning message
  const showWarning = useCallback(() => {
    const state = stateRef.current;
    state.warningDisplayed = true;
    onWarningRef.current();
    clearTimeout(state.timeoutTimer); // Clear existing timeout timer
    state.timeoutTimer = setTimeout(() => {  // Start the final countdown to logout
      handleTimeout();
    }, warningTimeRef.current);

  }, []);

  // Function to handle timeout
  const handleTimeout = useCallback(() => {
    const state = stateRef.current;
    cleanupEventListeners();
    onTimeoutRef.current(); // Call the onTimeout callback
  }, []);

  // Function to update last activity time
  const updateLastActivity = useCallback(() => {
    const state = stateRef.current;
    // Only count as activity if this tab is active
    if (!state.isTabActive) {
      return;
    }

    // Log if user was inactive for more than 10 seconds
    const wasInactive = Date.now() - state.lastActivity;
    if (wasInactive > 10000) {
      console.log(`[SessionTimeout] User active again after ${Math.floor(wasInactive / 1000)} seconds of inactivity`);
      state.lastInactiveMinuteLogged = 0;
    }

    state.lastActivity = Date.now(); // Update the timestamp of the last activity

    // Only reset timers if not already in warning state
    if (!state.warningDisplayed) {
      resetTimers();
    }
  }, [resetTimers]);

  // Function to handle visibility change
  const handleVisibilityChange = useCallback(() => {
    const state = stateRef.current;
    if (document.hidden) {
      // Tab is not active/visible
      state.isTabActive = false;
      console.log('[SessionTimeout] Tab is now inactive (hidden)');
    } else {
      // Tab is active/visible
      state.isTabActive = true;
      console.log('[SessionTimeout] Tab is now active (visible)');

      // Update last activity when the tab becomes visible again
      state.lastActivity = Date.now();
      resetTimers();
    }
  }, [resetTimers]);

  // Remove all event listeners and clear all timers
  const cleanupEventListeners = useCallback(() => {
    const state = stateRef.current;
    activityEvents.forEach(event => {
      document.removeEventListener(event, updateLastActivity);
    });
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    clearInterval(state.checkActivityInterval);
    clearTimeout(state.timeoutTimer);
    clearTimeout(state.warningTimer);
  }, [updateLastActivity, handleVisibilityChange]);

  // Manually reset the session
  const resetSession = useCallback(() => {
    const state = stateRef.current;
    console.log('[SessionTimeout] Session manually extended by user');
    state.lastActivity = Date.now();
    state.warningDisplayed = false;
    resetTimers();
  }, [resetTimers]);

  // Initialize session timeout functionality
  useEffect(() => {
    const state = stateRef.current;
    const ONE_MINUTE = 60 * 1000;
    // Skip initialization if already initialized to prevent double setup
    if (state.isInitialized) {
      return;
    }
    state.isInitialized = true;
    state.lastActivity = Date.now();
    // Add event listeners for user activity
    activityEvents.forEach(event => {
      document.addEventListener(event, updateLastActivity);
    });
    // Add visibility change listener to track tab focus
    document.addEventListener('visibilitychange', handleVisibilityChange);
    // Set initial timers
    resetTimers();
    // Set interval to periodically check for inactivity
    state.checkActivityInterval = setInterval(() => {
      // Only check inactivity if tab is active
      if (!state.isTabActive) {
        return;
      }
      // Calculate how long user has been inactive
      const inactiveTime = Date.now() - state.lastActivity;
      const inactiveSeconds = Math.floor(inactiveTime / 1000);
      const inactiveMinutes = Math.floor(inactiveTime / ONE_MINUTE);
      state.lastInactiveMinuteLogged = inactiveMinutes;

      // If inactive for longer than timeout, log out
      if (inactiveTime >= timeoutRef.current) {
        console.log(`[SessionTimeout] Inactivity threshold reached: ${inactiveSeconds}s >= ${timeoutRef.current/1000}s`);
        handleTimeout();
      }
      // If inactive long enough to show warning but warning not shown yet
      else if (inactiveTime >= (timeoutRef.current - warningTimeRef.current) && !state.warningDisplayed) {
        console.log(`[SessionTimeout] Warning threshold reached: ${inactiveSeconds}s >= ${(timeoutRef.current-warningTimeRef.current)/1000}s`);
        showWarning();
      }
    }, checkIntervalRef.current);

    // Initial visibility check
    handleVisibilityChange();

    // Clean up function
    return () => {
      cleanupEventListeners();
      state.isInitialized = false;
    };
  }, [updateLastActivity, handleVisibilityChange, resetTimers, showWarning, handleTimeout, cleanupEventListeners]);

  // Return the reset function
  return {
    resetSession
  };
}