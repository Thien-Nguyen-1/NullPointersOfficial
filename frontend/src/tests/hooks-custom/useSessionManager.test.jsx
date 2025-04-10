import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act, renderHook } from '@testing-library/react';
import { SessionManager } from '../../hooks-custom/useSessionManager';
import { AuthContext } from '../../services/AuthContext';
import { useSessionTimeout } from '../../hooks-custom/useSessionTimeout';

// Mock useSessionTimeout module
vi.mock('../../hooks-custom/useSessionTimeout', () => {
  return {
    useSessionTimeout: vi.fn(() => ({
      resetSession: vi.fn()
    }))
  };
});

// Mock SESSION_CONFIG
vi.mock('../../config/sessionConfig', () => ({
  SESSION_CONFIG: {
    timeoutMinutes: 30,
    warningSeconds: 60
  }
}));

describe('SessionManager', () => {
  const mockLogoutUser = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Reset mocks
    mockLogoutUser.mockReset();
    useSessionTimeout.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  // Helper function to render component with AuthContext
  const renderWithAuth = (props = {}) => {
    return render(
      <AuthContext.Provider value={{ logoutUser: mockLogoutUser }}>
        <SessionManager {...props} />
      </AuthContext.Provider>
    );
  };

  it('should initialize with default parameters', () => {
    renderWithAuth();

    // Verify useSessionTimeout was called
    expect(useSessionTimeout).toHaveBeenCalled();

    // Get the first call arguments
    const callArg = useSessionTimeout.mock.calls[0][0];

    // Check individual properties instead of the whole object
    expect(callArg.timeoutMinutes).toBe(30);
    expect(callArg.warningSeconds).toBe(60);
    expect(typeof callArg.onWarning).toBe('function');
    expect(typeof callArg.onTimeout).toBe('function');

    // Verify warning is not shown by default
    expect(screen.queryByText(/session timeout warning/i)).not.toBeInTheDocument();
  });

  it('should initialize with custom parameters from props', () => {
    renderWithAuth({
      timeoutMinutes: 15,
      warningSeconds: 30
    });

    // Get the first call arguments
    const callArg = useSessionTimeout.mock.calls[0][0];

    // Check individual properties
    expect(callArg.timeoutMinutes).toBe(15);
    expect(callArg.warningSeconds).toBe(30);
    expect(typeof callArg.onWarning).toBe('function');
    expect(typeof callArg.onTimeout).toBe('function');
  });

  it('should show warning when onWarning callback is triggered', () => {
    renderWithAuth();

    // Get the onWarning callback from the first call
    const { onWarning } = useSessionTimeout.mock.calls[0][0];

    // Trigger warning callback
    act(() => {
      onWarning();
    });

    // Verify warning is displayed
    expect(screen.getByText(/session timeout warning/i)).toBeInTheDocument();
    expect(screen.getByText(/your session will expire/i)).toBeInTheDocument();
    expect(screen.getByText(/60/)).toBeInTheDocument(); // Default countdown value
  });

  it('should countdown correctly when warning is shown', () => {
    renderWithAuth();

    // Get the onWarning callback
    const { onWarning } = useSessionTimeout.mock.calls[0][0];

    // Trigger warning
    act(() => {
      onWarning();
    });

    // Verify initial countdown
    expect(screen.getByText(/60/)).toBeInTheDocument();

    // Advance timer by 1 second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Verify countdown decreased
    expect(screen.getByText(/59/)).toBeInTheDocument();

    // Advance timer to almost end
    act(() => {
      vi.advanceTimersByTime(58000);
    });

    // Verify countdown at 1
    expect(screen.getByText(/1/)).toBeInTheDocument();

    // Advance one more second
    act(() => {
      vi.advanceTimersByTime(1000);
    });

    // Verify countdown at 0
    expect(screen.getByText(/0/)).toBeInTheDocument();
  });

  it('should call logoutUser when countdown reaches zero', async () => {
    renderWithAuth();

    // Get the onTimeout callback
    const { onTimeout } = useSessionTimeout.mock.calls[0][0];

    // Trigger warning first to show the countdown
    const { onWarning } = useSessionTimeout.mock.calls[0][0];
    act(() => {
      onWarning();
    });

    // Trigger timeout
    act(() => {
      onTimeout();
    });

    // Verify countdown is set to 0
    expect(screen.getByText(/0/)).toBeInTheDocument();

    // Fast-forward past the small delay (100ms)
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Verify logout was called
    expect(mockLogoutUser).toHaveBeenCalled();
  });

  it('should handle logout error with fallback', async () => {
    // Mock sessionStorage and localStorage
    const sessionStorageClearMock = vi.fn();
    const localStorageRemoveItemMock = vi.fn();

    Object.defineProperty(window, 'sessionStorage', {
      value: {
        clear: sessionStorageClearMock
      },
      writable: true
    });

    Object.defineProperty(window, 'localStorage', {
      value: {
        removeItem: localStorageRemoveItemMock
      },
      writable: true
    });

    // Mock window.location
    const originalLocation = window.location;
    delete window.location;
    window.location = { href: 'https://example.com' };

    // Set up mockLogoutUser to reject
    mockLogoutUser.mockRejectedValue(new Error('Logout failed'));

    renderWithAuth();

    // Get the callbacks
    const { onWarning, onTimeout } = useSessionTimeout.mock.calls[0][0];

    // Trigger warning first to show the countdown
    act(() => {
      onWarning();
    });

    // Trigger timeout
    act(() => {
      onTimeout();
    });

    // Fast-forward past the small delay (100ms)
    await act(async () => {
      vi.advanceTimersByTime(100);
    });

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Error during timeout logout:'),
      expect.any(Error)
    );

    // Verify fallback logout was executed
    expect(sessionStorageClearMock).toHaveBeenCalled();
    expect(localStorageRemoveItemMock).toHaveBeenCalledWith('authToken');
    expect(window.location.href).toBe('/');

    // Restore original location
    window.location = originalLocation;
  });

  it('should extend session when keep session button is clicked', () => {
      // Create a mock resetSession function
      const mockResetSession = vi.fn();

      // IMPORTANT: Use mockImplementation instead of mockReturnValueOnce
      // This ensures the mock persists across renders
      useSessionTimeout.mockImplementation(() => ({
        resetSession: mockResetSession
      }));

      renderWithAuth();

      // Get the onWarning callback
      const { onWarning } = useSessionTimeout.mock.calls[0][0];

      // Trigger warning
      act(() => {
        onWarning();
      });

      // Verify warning is shown
      expect(screen.getByText(/session timeout warning/i)).toBeInTheDocument();

      // Click the keep session button
      fireEvent.click(screen.getByText(/keep session active/i));

      // Verify resetSession was called
      expect(mockResetSession).toHaveBeenCalled();

      // Verify warning is hidden
      expect(screen.queryByText(/session timeout warning/i)).not.toBeInTheDocument();
  });

  it('should handle case when sessionTimeoutRef.current is null', () => {
    // Make useSessionTimeout return null for this test
    useSessionTimeout.mockReturnValueOnce(null);

    renderWithAuth();

    // Get the onWarning callback
    const { onWarning } = useSessionTimeout.mock.calls[0][0];

    // Trigger warning
    act(() => {
      onWarning();
    });

    // Clear the mock to check for specific logs
    console.log.mockClear();

    // Click the keep session button
    fireEvent.click(screen.getByText(/keep session active/i));

    // Verify console log about null reference
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Extend session button clicked!"));

    // Verify warning is hidden
    expect(screen.queryByText(/session timeout warning/i)).not.toBeInTheDocument();
  });

  it('should clear interval when component unmounts', () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

    const { unmount } = renderWithAuth();

    // Get the onWarning callback
    const { onWarning } = useSessionTimeout.mock.calls[0][0];

    // Trigger warning to start interval
    act(() => {
      onWarning();
    });

    // Unmount component
    unmount();

    // Verify clearInterval was called
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should clear interval when warning is hidden', () => {
    const clearIntervalSpy = vi.spyOn(window, 'clearInterval');

    renderWithAuth();

    // Get the onWarning callback
    const { onWarning } = useSessionTimeout.mock.calls[0][0];

    // Trigger warning
    act(() => {
      onWarning();
    });

    // Verify warning is shown
    expect(screen.getByText(/session timeout warning/i)).toBeInTheDocument();

    // Click the keep session button to hide warning
    fireEvent.click(screen.getByText(/keep session active/i));

    // Verify clearInterval was called
    expect(clearIntervalSpy).toHaveBeenCalled();
  });

  it('should reset countdown when warning appears again', () => {
    renderWithAuth({
      warningSeconds: 30
    });

    // Get the onWarning callback
    const { onWarning } = useSessionTimeout.mock.calls[0][0];

    // Trigger warning
    act(() => {
      onWarning();
    });

    // Verify initial countdown (30 seconds from props)
    expect(screen.getByText(/30/)).toBeInTheDocument();

    // Advance timer by 10 seconds
    act(() => {
      vi.advanceTimersByTime(10000);
    });

    // Verify countdown decreased
    expect(screen.getByText(/20/)).toBeInTheDocument();

    // Hide warning
    act(() => {
      fireEvent.click(screen.getByText(/keep session active/i));
    });

    // Trigger warning again
    act(() => {
      onWarning();
    });

    // Verify countdown is reset to initial value
    expect(screen.getByText(/30/)).toBeInTheDocument();
  });

  it('should log warning callback trigger', () => {
    // Clear any previous logs
    console.log.mockClear();

    renderWithAuth();

    // Get the onWarning callback
    const { onWarning } = useSessionTimeout.mock.calls[0][0];

    // Trigger warning
    act(() => {
      onWarning();
    });

    // Verify console log
    expect(console.log).toHaveBeenCalledWith('Warning callback triggered!');
  });

  it('should log when extend session button is clicked', () => {
    renderWithAuth();

    // Get the onWarning callback
    const { onWarning } = useSessionTimeout.mock.calls[0][0];

    // Trigger warning
    act(() => {
      onWarning();
    });

    // Clear any previous logs
    console.log.mockClear();

    // Click the keep session button
    fireEvent.click(screen.getByText(/keep session active/i));

    // Verify console log
    expect(console.log).toHaveBeenCalledWith('Extend session button clicked!');
  });
});