import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor, fireEvent } from '@testing-library/react';
import React, { useState } from 'react';
import { SuperAdminContextProvider, useSuperAdmin } from '../../contexts/SuperAdminContext';
import { AuthContext } from '../../services/AuthContext';
import api from '../../services/api';

// Mock the API service
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    post: vi.fn(),
    delete: vi.fn()
  }
}));

// Create a test component to consume the context
const TestConsumer = ({ userType = 'superadmin', token = 'fake-token' }) => {
  const superAdminContext = useSuperAdmin();
  const [errorCaught, setErrorCaught] = useState(false);

  const handleAddAdmin = async () => {
    try {
      await superAdminContext.addAdminUser({ username: 'newadmin', email: 'new@example.com' });
    } catch (error) {
      setErrorCaught(true);
      // Error is caught here and not propagated further
    }
  };

  const handleUpdateTerms = async () => {
    try {
      await superAdminContext.updateTermsAndConditions('New Terms');
    } catch (error) {
      setErrorCaught(true);
      // Error is caught here and not propagated further
    }
  };

  const handleRemoveAdmin = async () => {
    try {
      await superAdminContext.removeAdminUser(1);
    } catch (error) {
      setErrorCaught(true);
      // Error is caught here and not propagated further
    }
  };

  const handleResendVerification = async () => {
    try {
      await superAdminContext.resendAdminVerification(1);
    } catch (error) {
      setErrorCaught(true);
      // Error is caught here and not propagated further
    }
  };

  return (
    <div>
      <div data-testid="is-superadmin">{superAdminContext.isSuperAdmin ? 'true' : 'false'}</div>
      <div data-testid="terms">{superAdminContext.termsAndConditions}</div>
      <div data-testid="loading">{superAdminContext.isLoading ? 'true' : 'false'}</div>
      <div data-testid="error">{superAdminContext.error || 'no-error'}</div>
      <div data-testid="admin-count">{superAdminContext.adminUsers.length}</div>
      <div data-testid="error-caught">{errorCaught ? 'true' : 'false'}</div>
      <button
        data-testid="update-terms"
        onClick={handleUpdateTerms}
      >
        Update Terms
      </button>
      <button
        data-testid="add-admin"
        onClick={handleAddAdmin}
      >
        Add Admin
      </button>
      <button
        data-testid="remove-admin"
        onClick={handleRemoveAdmin}
      >
        Remove Admin
      </button>
      <button
        data-testid="resend-verification"
        onClick={handleResendVerification}
      >
        Resend Verification
      </button>
    </div>
  );
};

// Wrapper component that provides both contexts
const ContextWrapper = ({ children, user = null, token = null }) => (
  <AuthContext.Provider value={{ user, token }}>
    <SuperAdminContextProvider>
      {children}
    </SuperAdminContextProvider>
  </AuthContext.Provider>
);

describe('SuperAdminContext', () => {
  let originalConsoleError;
  let originalConsoleLog;

  beforeEach(() => {
    // Mock console methods
    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    console.error = vi.fn();
    console.log = vi.fn();

    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      },
      writable: true
    });

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore console methods
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  // Test isSuperAdmin flag
  describe('isSuperAdmin detection', () => {
    it('should correctly identify a superadmin user', async () => {
      const superAdminUser = { id: 1, username: 'superadmin', user_type: 'superadmin' };

      api.get.mockResolvedValueOnce({ data: { content: 'Test Terms' } });
      api.get.mockResolvedValueOnce({ data: [] });

      render(
        <ContextWrapper user={superAdminUser} token="fake-token">
          <TestConsumer />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-superadmin').textContent).toBe('true');
      });
    });

    it('should correctly identify a non-superadmin user', async () => {
      const adminUser = { id: 2, username: 'admin', user_type: 'admin' };

      render(
        <ContextWrapper user={adminUser} token="fake-token">
          <TestConsumer userType="admin" />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('is-superadmin').textContent).toBe('false');
      });
    });
  });

  // Test fetching terms and conditions
  describe('Terms and Conditions', () => {
    it('should fetch terms and conditions on mount for superadmin', async () => {
      const superAdminUser = { id: 1, username: 'superadmin', user_type: 'superadmin' };
      const mockTerms = 'Test Terms and Conditions';

      api.get.mockResolvedValueOnce({ data: { content: mockTerms } });
      api.get.mockResolvedValueOnce({ data: [] });

      render(
        <ContextWrapper user={superAdminUser} token="fake-token">
          <TestConsumer />
        </ContextWrapper>
      );

      // Initially loading
      expect(screen.getByTestId('loading').textContent).toBe('true');

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/terms-and-conditions/');
        expect(screen.getByTestId('terms').textContent).toBe(mockTerms);
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });

    it('should not fetch terms for non-superadmin users', async () => {
      const adminUser = { id: 2, username: 'admin', user_type: 'admin' };

      render(
        <ContextWrapper user={adminUser} token="fake-token">
          <TestConsumer userType="admin" />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
        expect(api.get).not.toHaveBeenCalledWith('/api/terms-and-conditions/');
      });
    });

    it('should handle error when fetching terms fails', async () => {
      const superAdminUser = { id: 1, username: 'superadmin', user_type: 'superadmin' };

      api.get.mockRejectedValueOnce(new Error('API error'));
      api.get.mockResolvedValueOnce({ data: [] });

      render(
        <ContextWrapper user={superAdminUser} token="fake-token">
          <TestConsumer />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('error').textContent).toBe('Failed to load terms and conditions');
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });

    it('should update terms and conditions', async () => {
      const superAdminUser = { id: 1, username: 'superadmin', user_type: 'superadmin' };
      const updatedTerms = 'Updated Terms';

      api.get.mockResolvedValueOnce({ data: { content: 'Original Terms' } });
      api.get.mockResolvedValueOnce({ data: [] });
      api.put.mockResolvedValueOnce({ data: { content: updatedTerms } });

      render(
        <ContextWrapper user={superAdminUser} token="fake-token">
          <TestConsumer />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Click update terms button
      act(() => {
        fireEvent.click(screen.getByTestId('update-terms'));
      });

      await waitFor(() => {
        expect(api.put).toHaveBeenCalledWith('/api/terms-and-conditions/', { content: 'New Terms' });
        expect(screen.getByTestId('terms').textContent).toBe(updatedTerms);
      });
    });
  });

  // Test admin users management
  describe('Admin Users Management', () => {
    it('should fetch admin users on mount for superadmin', async () => {
      const superAdminUser = { id: 1, username: 'superadmin', user_type: 'superadmin' };
      const mockAdmins = [
        { id: 2, username: 'admin1', is_verified: true },
        { id: 3, username: 'admin2', is_verified: false }
      ];

      api.get.mockResolvedValueOnce({ data: { content: 'Test Terms' } });
      api.get.mockResolvedValueOnce({ data: mockAdmins });

      render(
        <ContextWrapper user={superAdminUser} token="fake-token">
          <TestConsumer />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/admin-users/');
        expect(screen.getByTestId('admin-count').textContent).toBe('2');
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });
    });

    it('should handle adding a new admin user', async () => {
      const superAdminUser = { id: 1, username: 'superadmin', user_type: 'superadmin' };
      const mockAdmins = [{ id: 2, username: 'admin1', is_verified: true }];
      const newAdmin = { id: 3, username: 'newadmin', email: 'new@example.com', is_verified: false };

      api.get.mockResolvedValueOnce({ data: { content: 'Test Terms' } });
      api.get.mockResolvedValueOnce({ data: mockAdmins });
      api.post.mockResolvedValueOnce({ data: newAdmin });

      render(
        <ContextWrapper user={superAdminUser} token="fake-token">
          <TestConsumer />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-count').textContent).toBe('1');
      });

      // Click add admin button
      act(() => {
        fireEvent.click(screen.getByTestId('add-admin'));
      });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/admin-users/', {
          username: 'newadmin',
          email: 'new@example.com',
          user_type: 'admin'
        });
        expect(screen.getByTestId('admin-count').textContent).toBe('2');
      });
    });

    it('should handle removing an admin user', async () => {
      const superAdminUser = { id: 3, username: 'superadmin', user_type: 'superadmin' };
      const mockAdmins = [
        { id: 1, username: 'admin1', is_verified: true }
      ];

      api.get.mockResolvedValueOnce({ data: { content: 'Test Terms' } });
      api.get.mockResolvedValueOnce({ data: mockAdmins });
      api.delete.mockResolvedValueOnce({ data: { message: 'Admin removed' } });

      render(
        <ContextWrapper user={superAdminUser} token="fake-token">
          <TestConsumer />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-count').textContent).toBe('1');
      });

      // Click remove admin button
      act(() => {
        fireEvent.click(screen.getByTestId('remove-admin'));
      });

      await waitFor(() => {
        expect(api.delete).toHaveBeenCalledWith('/api/admin-users/1/');
        expect(screen.getByTestId('admin-count').textContent).toBe('0');
      });
    });

    it('should handle resending verification email', async () => {
      const superAdminUser = { id: 1, username: 'superadmin', user_type: 'superadmin' };
      const mockAdmins = [
        { id: 2, username: 'admin1', is_verified: false }
      ];

      api.get.mockResolvedValueOnce({ data: { content: 'Test Terms' } });
      api.get.mockResolvedValueOnce({ data: mockAdmins });
      api.post.mockResolvedValueOnce({ data: { email: 'admin@example.com' } });

      render(
        <ContextWrapper user={superAdminUser} token="fake-token">
          <TestConsumer />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('admin-count').textContent).toBe('1');
      });

      // Click resend verification button
      act(() => {
        fireEvent.click(screen.getByTestId('resend-verification'));
      });

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/api/admin-users/1/resend-verification/');
      });
    });
  });

  // Test error handling
  describe('Error Handling', () => {
    it('should handle error when removing admin fails', async () => {
      const superAdminUser = { id: 1, username: 'superadmin', user_type: 'superadmin' };
      const mockAdmins = [{ id: 1, username: 'admin1' }];

      api.get.mockResolvedValueOnce({ data: { content: 'Test Terms' } });
      api.get.mockResolvedValueOnce({ data: mockAdmins });
      api.delete.mockRejectedValueOnce({
        response: { data: { error: 'Cannot remove admin' } }
      });

      render(
        <ContextWrapper user={superAdminUser} token="fake-token">
          <TestConsumer />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Click remove admin button and verify error is caught
      act(() => {
        fireEvent.click(screen.getByTestId('remove-admin'));
      });

      // Wait for the error to be caught
      await waitFor(() => {
        expect(screen.getByTestId('error-caught').textContent).toBe('true');
      });
    });

    // Fix for the failing test - error needs to be caught and not propagated
    it('should catch errors when removing admin fails', async () => {
      const superAdminUser = { id: 1, username: 'superadmin', user_type: 'superadmin' };
      const mockAdmins = [{ id: 1, username: 'admin1' }];

      api.get.mockResolvedValueOnce({ data: { content: 'Test Terms' } });
      api.get.mockResolvedValueOnce({ data: mockAdmins });
      api.delete.mockRejectedValueOnce({
        response: { data: { error: 'Cannot remove admin' } }
      });

      render(
        <ContextWrapper user={superAdminUser} token="fake-token">
          <TestConsumer />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Click remove admin button
      await act(async () => {
        fireEvent.click(screen.getByTestId('remove-admin'));
      });

      // Check that error was caught
      await waitFor(() => {
        expect(screen.getByTestId('error-caught').textContent).toBe('true');
      });
    });
  });

  // Test unauthorized access
  describe('Authorization Checks', () => {
    it('should throw error when non-superadmin tries to update terms', async () => {
      const adminUser = { id: 2, username: 'admin', user_type: 'admin' };

      render(
        <ContextWrapper user={adminUser} token="fake-token">
          <TestConsumer userType="admin" />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Click the button which should trigger an error that gets caught
      act(() => {
        fireEvent.click(screen.getByTestId('update-terms'));
      });

      // Wait for the error to be caught
      await waitFor(() => {
        expect(screen.getByTestId('error-caught').textContent).toBe('true');
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('should throw error when token is missing', async () => {
      const superAdminUser = { id: 1, username: 'superadmin', user_type: 'superadmin' };

      render(
        <ContextWrapper user={superAdminUser} token={null}>
          <TestConsumer token={null} />
        </ContextWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('loading').textContent).toBe('false');
      });

      // Click the button which should trigger an error that gets caught
      act(() => {
        fireEvent.click(screen.getByTestId('add-admin'));
      });

      // Wait for the error to be caught
      await waitFor(() => {
        expect(screen.getByTestId('error-caught').textContent).toBe('true');
        expect(console.error).toHaveBeenCalledWith("Unauthorized access attempt");
      });
    });
  });
});