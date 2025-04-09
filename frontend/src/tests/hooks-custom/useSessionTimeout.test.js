import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionTimeout } from '../../hooks-custom/useSessionTimeout';

// Mock SESSION_CONFIG
vi.mock('../../config/sessionConfig', () => ({
  SESSION_CONFIG: {
    timeoutMinutes: 30,
    warningSeconds: 60,
    checkIntervalSeconds: 10
  }
}));

describe('useSessionTimeout', () => {
  // Setup spies
  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock visibility API
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get() { return false; }
    });

    // Mock document event listeners
    document.addEventListener = vi.fn();
    document.removeEventListener = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should initialize with default parameters', () => {
    const { result } = renderHook(() => useSessionTimeout());

    expect(result.current).toHaveProperty('resetSession');
    expect(typeof result.current.resetSession).toBe('function');

    // Verify event listeners are attached
    expect(document.addEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(document.addEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(document.addEventListener).toHaveBeenCalledWith('keypress', expect.any(Function));
    expect(document.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(document.addEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(document.addEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(document.addEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(document.addEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });

  it('should initialize with custom parameters', () => {
    const onTimeout = vi.fn();
    const onWarning = vi.fn();

    renderHook(() => useSessionTimeout({
      timeoutMinutes: 10,
      warningSeconds: 30,
      checkIntervalSeconds: 5,
      onTimeout,
      onWarning
    }));

    // Fast-forward to warning time (10 min - 30 sec)
    vi.advanceTimersByTime((10 * 60 - 30) * 1000);

    // Simulate check interval trigger
    vi.advanceTimersByTime(5 * 1000);

    expect(onWarning).toHaveBeenCalled();

    // Fast-forward to timeout
    vi.advanceTimersByTime(30 * 1000);

    expect(onTimeout).toHaveBeenCalled();
  });

  it('should reset the session when resetSession is called', () => {
    const onTimeout = vi.fn();

    const { result } = renderHook(() => useSessionTimeout({
      timeoutMinutes: 5,
      onTimeout
    }));

    // Fast-forward 4 minutes
    vi.advanceTimersByTime(4 * 60 * 1000);

    // Reset the session
    act(() => {
      result.current.resetSession();
    });

    // Fast-forward another 4 minutes (should not trigger timeout)
    vi.advanceTimersByTime(4 * 60 * 1000);

    // Verify the session is still active (onTimeout not called)
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('should call onWarning when inactivity threshold for warning is reached', () => {
    const onWarning = vi.fn();

    renderHook(() => useSessionTimeout({
      timeoutMinutes: 5,
      warningSeconds: 60,
      onWarning
    }));

    // Fast-forward to just before warning time
    vi.advanceTimersByTime((5 * 60 - 60 - 1) * 1000);
    expect(onWarning).not.toHaveBeenCalled();

    // Fast-forward to warning time
    vi.advanceTimersByTime(1 * 1000);

    // Simulate check interval trigger
    vi.advanceTimersByTime(10 * 1000);

    expect(onWarning).toHaveBeenCalled();
  });

  it('should call onTimeout when inactivity threshold for timeout is reached', () => {
    const onTimeout = vi.fn();

    renderHook(() => useSessionTimeout({
      timeoutMinutes: 5,
      warningSeconds: 60,
      onTimeout
    }));

    // Fast-forward to timeout
    vi.advanceTimersByTime(5 * 60 * 1000);

    // Simulate check interval trigger
    vi.advanceTimersByTime(10 * 1000);

    expect(onTimeout).toHaveBeenCalled();
  });

  it('should handle visibility change events', () => {
    const resetTimersSpy = vi.fn();
    let visibilityChangeHandler;

    // Track the visibilitychange handler
    document.addEventListener = vi.fn((event, handler) => {
      if (event === 'visibilitychange') {
        visibilityChangeHandler = handler;
      }
    });

    renderHook(() => useSessionTimeout());

    // Ensure visibilitychange handler was registered
    expect(visibilityChangeHandler).toBeDefined();

    // Test tab becomes inactive
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get() { return true; }
    });

    visibilityChangeHandler();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('inactive'));

    // Test tab becomes active again
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get() { return false; }
    });

    visibilityChangeHandler();
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('active'));
  });

  it('should update lastActivity on user interaction', () => {
    const onTimeout = vi.fn();
    let activityHandler;

    // Track the activity event handler
    document.addEventListener = vi.fn((event, handler) => {
      if (event === 'mousemove') {
        activityHandler = handler;
      }
    });

    renderHook(() => useSessionTimeout({
      timeoutMinutes: 5,
      onTimeout
    }));

    // Fast-forward 3 minutes
    vi.advanceTimersByTime(3 * 60 * 1000);

    // Simulate user activity
    activityHandler();

    // Fast-forward another 3 minutes (should not trigger timeout yet)
    vi.advanceTimersByTime(3 * 60 * 1000);

    // Verify the session is still active
    expect(onTimeout).not.toHaveBeenCalled();

    // Fast-forward 2 more minutes (now it should timeout)
    vi.advanceTimersByTime(2 * 60 * 1000);

    // Simulate check interval trigger
    vi.advanceTimersByTime(10 * 1000);

    // Now it should have timed out
    expect(onTimeout).toHaveBeenCalled();
  });

  it('should clean up timers and event listeners on unmount', () => {
    const { unmount } = renderHook(() => useSessionTimeout());

    unmount();

    // Verify all event listeners are removed
    expect(document.removeEventListener).toHaveBeenCalledWith('mousedown', expect.any(Function));
    expect(document.removeEventListener).toHaveBeenCalledWith('mousemove', expect.any(Function));
    expect(document.removeEventListener).toHaveBeenCalledWith('keypress', expect.any(Function));
    expect(document.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(document.removeEventListener).toHaveBeenCalledWith('touchstart', expect.any(Function));
    expect(document.removeEventListener).toHaveBeenCalledWith('click', expect.any(Function));
    expect(document.removeEventListener).toHaveBeenCalledWith('keydown', expect.any(Function));
    expect(document.removeEventListener).toHaveBeenCalledWith('visibilitychange', expect.any(Function));
  });

  it('should not reset timers when in warning state', () => {
    const onTimeout = vi.fn();
    const onWarning = vi.fn();
    let activityHandler;

    // Track the activity event handler
    document.addEventListener = vi.fn((event, handler) => {
      if (event === 'mousemove') {
        activityHandler = handler;
      }
    });

    renderHook(() => useSessionTimeout({
      timeoutMinutes: 5,
      warningSeconds: 60,
      onWarning,
      onTimeout
    }));

    // Fast-forward to warning time
    vi.advanceTimersByTime((5 * 60 - 60) * 1000);

    // Simulate check interval trigger
    vi.advanceTimersByTime(10 * 1000);

    expect(onWarning).toHaveBeenCalled();

    // Simulate user activity after warning is shown
    activityHandler();

    // Fast-forward to what would be timeout time (should still timeout)
    vi.advanceTimersByTime(60 * 1000);

    // Verify it still redirects
    expect(onTimeout).toHaveBeenCalled();
  });

  it('should handle user coming back after long inactivity', () => {
    let activityHandler;

    // Track the activity event handler
    document.addEventListener = vi.fn((event, handler) => {
      if (event === 'mousemove') {
        activityHandler = handler;
      }
    });

    renderHook(() => useSessionTimeout());

    // Fast-forward 11 seconds
    vi.advanceTimersByTime(11 * 1000);

    // Simulate user activity
    activityHandler();

    // Verify console log about user being active again
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('User active again after'));
  });

  it('should not count activity if tab is not active', () => {
    const onTimeout = vi.fn();
    let activityHandler;
    let visibilityChangeHandler;

    // Track handlers
    document.addEventListener = vi.fn((event, handler) => {
      if (event === 'mousemove') {
        activityHandler = handler;
      } else if (event === 'visibilitychange') {
        visibilityChangeHandler = handler;
      }
    });

    renderHook(() => useSessionTimeout({
      timeoutMinutes: 5,
      onTimeout
    }));

    // Set tab to inactive
    Object.defineProperty(document, 'hidden', {
      configurable: true,
      get() { return true; }
    });

    visibilityChangeHandler();

    // Simulate user activity while tab is inactive
    activityHandler();

    // Fast-forward 5 minutes + check interval
    vi.advanceTimersByTime((5 * 60 + 10) * 1000);

    // Should not have counted as activity while tab is inactive
    expect(onTimeout).toHaveBeenCalled();
  });

  it('should use default redirect when no onTimeout provided', () => {
    // Mock window.location.href
    const originalLocation = window.location;
    const mockLocation = { href: 'https://example.com' };

    // Temporarily redefine window.location
    delete window.location;
    window.location = mockLocation;

    renderHook(() => useSessionTimeout({
      timeoutMinutes: 1
    }));

    // Fast-forward past timeout + check interval
    vi.advanceTimersByTime((1 * 60 + 10) * 1000);

    // Should redirect to default '/'
    expect(mockLocation.href).toBe('/');

    // Restore original window.location
    window.location = originalLocation;
  });

  it('should prevent double initialization', () => {
    const { rerender } = renderHook(() => useSessionTimeout());

    // Count initial calls
    const initialAddEventListenerCalls = document.addEventListener.mock.calls.length;

    // Rerender the hook
    rerender();

    // Verify no additional event listeners were attached
    expect(document.addEventListener.mock.calls.length).toBe(initialAddEventListenerCalls);
  });
});