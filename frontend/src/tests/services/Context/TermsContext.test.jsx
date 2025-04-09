import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { TermsContextProvider, useTerms } from '../../../services/TermsContext';
import { AuthContext } from '../../../services/AuthContext';
import api from '../../../services/api';

// Mock api
vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

// Mock AuthContext
const mockUser = { id: 1, username: 'testuser', terms_accepted: false };
const mockUpdateUser = vi.fn();

const MockAuthProvider = ({ children, userValue = mockUser }) => (
  <AuthContext.Provider value={{ user: userValue, token: 'test-token', updateUser: mockUpdateUser }}>
    {children}
  </AuthContext.Provider>
);

// Test component that uses the terms context
const TestComponent = () => {
  const {
    termsAccepted,
    showTermsModal,
    setShowTermsModal,
    termsContent,
    isLoading,
    loadTermsContent,
    acceptTerms,
    declineTerms
  } = useTerms();

  return (
    <div>
      <div data-testid="terms-accepted">{termsAccepted ? 'true' : 'false'}</div>
      <div data-testid="show-modal">{showTermsModal ? 'true' : 'false'}</div>
      <div data-testid="terms-content">{termsContent}</div>
      <div data-testid="is-loading">{isLoading ? 'true' : 'false'}</div>
      <button
        data-testid="load-terms-btn"
        onClick={loadTermsContent}
      >
        Load Terms
      </button>
      <button
        data-testid="accept-terms-btn"
        onClick={acceptTerms}
      >
        Accept Terms
      </button>
      <button
        data-testid="decline-terms-btn"
        onClick={declineTerms}
      >
        Decline Terms
      </button>
      <button
        data-testid="toggle-modal-btn"
        onClick={() => setShowTermsModal(!showTermsModal)}
      >
        Toggle Modal
      </button>
    </div>
  );
};

describe('TermsContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Mock console.error to keep test output clean
  const originalConsoleError = console.error;

  beforeEach(() => {
    console.error = vi.fn();
  });

  afterEach(() => {
    console.error = originalConsoleError;
  });

  // Test initial context state when user hasn't accepted terms
  test('should show terms modal when user has not accepted terms', () => {
    render(
      <MockAuthProvider>
        <TermsContextProvider>
          <TestComponent />
        </TermsContextProvider>
      </MockAuthProvider>
    );

    expect(screen.getByTestId('terms-accepted').textContent).toBe('false');
    expect(screen.getByTestId('show-modal').textContent).toBe('true');
  });

  // Test initial context state when user has accepted terms
  test('should not show terms modal when user has accepted terms', async () => {
    const userWithAcceptedTerms = { ...mockUser, terms_accepted: true };

    render(
      <MockAuthProvider userValue={userWithAcceptedTerms}>
        <TermsContextProvider>
          <TestComponent />
        </TermsContextProvider>
      </MockAuthProvider>
    );

    expect(screen.getByTestId('terms-accepted').textContent).toBe('true');
    expect(screen.getByTestId('show-modal').textContent).toBe('false');
  });

  // Test loadTermsContent function
  test('should load terms content successfully', async () => {
    api.get.mockResolvedValueOnce({ data: { content: 'Terms and conditions content...' } });

    render(
      <MockAuthProvider>
        <TermsContextProvider>
          <TestComponent />
        </TermsContextProvider>
      </MockAuthProvider>
    );

    // Terms content should initially be empty
    expect(screen.getByTestId('terms-content').textContent).toBe('');

    // Click load terms button
    act(() => {
      screen.getByTestId('load-terms-btn').click();
    });

    // Should show loading state
    expect(screen.getByTestId('is-loading').textContent).toBe('true');

    // Wait for content to load
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/terms-and-conditions/');
      expect(screen.getByTestId('terms-content').textContent).toBe('Terms and conditions content...');
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
    });
  });

  // Test loadTermsContent function - error handling
  test('should handle error when loading terms content', async () => {
    api.get.mockRejectedValueOnce(new Error('Failed to load terms'));

    render(
      <MockAuthProvider>
        <TermsContextProvider>
          <TestComponent />
        </TermsContextProvider>
      </MockAuthProvider>
    );

    // Click load terms button
    act(() => {
      screen.getByTestId('load-terms-btn').click();
    });

    // Wait for error to be handled
    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith('Failed to load terms and conditions:', expect.any(Error));
      expect(screen.getByTestId('is-loading').textContent).toBe('false');
      expect(screen.getByTestId('terms-content').textContent).toBe('');
    });
  });

  // Test loadTermsContent function - should not reload if content exists
  test('should not reload terms content if already loaded', async () => {
      // Mock the API response once - this will be used for the first call
      api.get.mockResolvedValueOnce({ data: { content: 'Terms and conditions content...' } });

      render(
        <MockAuthProvider>
          <TermsContextProvider>
            <TestComponent />
          </TermsContextProvider>
        </MockAuthProvider>
      );

      // Load terms initially
      act(() => {
        screen.getByTestId('load-terms-btn').click();
      });

      // Wait for content to load
      await waitFor(() => {
        expect(screen.getByTestId('terms-content').textContent).toBe('Terms and conditions content...');
      });

      // Clear the mock to reset call tracking
      api.get.mockClear();

      // Mock another successful response for potential second call
      api.get.mockResolvedValueOnce({ data: { content: 'New content that should not be loaded' } });

      // Try to load terms again without unmounting
      act(() => {
        screen.getByTestId('load-terms-btn').click();
      });

      // API should not be called again since content exists
      expect(api.get).not.toHaveBeenCalled();

      // Content should remain the same
      expect(screen.getByTestId('terms-content').textContent).toBe('Terms and conditions content...');
  });

  // Test acceptTerms function
  test('should accept terms successfully', async () => {
    api.post.mockResolvedValueOnce({ data: { success: true } });

    render(
      <MockAuthProvider>
        <TermsContextProvider>
          <TestComponent />
        </TermsContextProvider>
      </MockAuthProvider>
    );

    // Initially terms are not accepted
    expect(screen.getByTestId('terms-accepted').textContent).toBe('false');
    expect(screen.getByTestId('show-modal').textContent).toBe('true');

    // Accept terms
    act(() => {
      screen.getByTestId('accept-terms-btn').click();
    });

    // Wait for terms to be accepted
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/accept-terms/', {});

      // UpdateUser should be called with updated user data
      expect(mockUpdateUser).toHaveBeenCalledWith({ ...mockUser, terms_accepted: true });

      // Context state should be updated
      expect(screen.getByTestId('terms-accepted').textContent).toBe('true');
      expect(screen.getByTestId('show-modal').textContent).toBe('false');
    });
  });

  // Test acceptTerms function - error handling
  test('should handle error when accepting terms', async () => {
    api.post.mockRejectedValueOnce(new Error('Failed to accept terms'));

    render(
      <MockAuthProvider>
        <TermsContextProvider>
          <TestComponent />
        </TermsContextProvider>
      </MockAuthProvider>
    );

    // Accept terms (will fail)
    act(() => {
      screen.getByTestId('accept-terms-btn').click();
    });

    // Wait for error to be handled
    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/accept-terms/', {});
      expect(console.error).toHaveBeenCalledWith('Failed to accept terms:', expect.any(Error));

      // Context state should remain unchanged
      expect(screen.getByTestId('terms-accepted').textContent).toBe('false');
    });
  });

  // Test declineTerms function
  test('should close modal when declining terms', () => {
    render(
      <MockAuthProvider>
        <TermsContextProvider>
          <TestComponent />
        </TermsContextProvider>
      </MockAuthProvider>
    );

    // Initially modal is shown
    expect(screen.getByTestId('show-modal').textContent).toBe('true');

    // Decline terms
    act(() => {
      screen.getByTestId('decline-terms-btn').click();
    });

    // Modal should be hidden, but terms acceptance status remains unchanged
    expect(screen.getByTestId('show-modal').textContent).toBe('false');
    expect(screen.getByTestId('terms-accepted').textContent).toBe('false');
  });

  // Test setShowTermsModal function
  test('should toggle terms modal visibility', () => {
    render(
      <MockAuthProvider>
        <TermsContextProvider>
          <TestComponent />
        </TermsContextProvider>
      </MockAuthProvider>
    );

    // Initially modal is shown (user hasn't accepted terms)
    expect(screen.getByTestId('show-modal').textContent).toBe('true');

    // Toggle modal (hide it)
    act(() => {
      screen.getByTestId('toggle-modal-btn').click();
    });

    // Modal should be hidden
    expect(screen.getByTestId('show-modal').textContent).toBe('false');

    // Toggle modal again (show it)
    act(() => {
      screen.getByTestId('toggle-modal-btn').click();
    });

    // Modal should be shown again
    expect(screen.getByTestId('show-modal').textContent).toBe('true');
  });

  // Test behavior when user is null (not logged in)
  test('should handle case when user is null', () => {
    render(
      <MockAuthProvider userValue={null}>
        <TermsContextProvider>
          <TestComponent />
        </TermsContextProvider>
      </MockAuthProvider>
    );

    // Default to true to prevent unnecessary prompts when user is null
    expect(screen.getByTestId('terms-accepted').textContent).toBe('true');
    expect(screen.getByTestId('show-modal').textContent).toBe('false');
  });
});