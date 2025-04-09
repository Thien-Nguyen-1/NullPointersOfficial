import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import api from '../../../services/api';
import { superAdminApi } from '../../../services/superAdminApi';

// Mock api
vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn()
  }
}));

// Mock console methods to avoid test output clutter
const originalConsoleError = console.error;

beforeEach(() => {
  console.error = vi.fn();
  vi.clearAllMocks();
});

afterEach(() => {
  console.error = originalConsoleError;
});

describe('superAdminApi', () => {
  // Test getTermsAndConditions
  describe('getTermsAndConditions', () => {
    test('should fetch terms and conditions successfully', async () => {
      const mockTerms = { id: 1, content: 'Terms content...' };
      api.get.mockResolvedValueOnce({ data: mockTerms });

      const result = await superAdminApi.getTermsAndConditions();

      expect(api.get).toHaveBeenCalledWith('/api/terms-and-conditions/');
      expect(result).toEqual(mockTerms);
    });

    test('should handle error when fetching terms and conditions', async () => {
      const error = new Error('Failed to fetch terms');
      api.get.mockRejectedValueOnce(error);

      await expect(superAdminApi.getTermsAndConditions()).rejects.toThrow('Failed to fetch terms');
      expect(console.error).toHaveBeenCalledWith('Error fetching terms and conditions:', error);
    });
  });

  // Test updateTermsAndConditions
  describe('updateTermsAndConditions', () => {
    test('should update terms and conditions successfully', async () => {
      const newContent = 'Updated terms content...';
      const mockResponse = { id: 1, content: newContent };
      api.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await superAdminApi.updateTermsAndConditions(newContent);

      expect(api.put).toHaveBeenCalledWith('/api/terms-and-conditions/', { content: newContent });
      expect(result).toEqual(mockResponse);
    });

    test('should handle error when updating terms and conditions', async () => {
      const error = new Error('Failed to update terms');
      api.put.mockRejectedValueOnce(error);

      await expect(superAdminApi.updateTermsAndConditions('content')).rejects.toThrow('Failed to update terms');
      expect(console.error).toHaveBeenCalledWith('Error updating terms and conditions:', error);
    });
  });

  // Test getAdminUsers
  describe('getAdminUsers', () => {
    test('should fetch admin users successfully', async () => {
      const mockAdmins = [
        { id: 1, username: 'admin1', user_type: 'admin' },
        { id: 2, username: 'admin2', user_type: 'admin' }
      ];
      api.get.mockResolvedValueOnce({ data: mockAdmins });

      const result = await superAdminApi.getAdminUsers();

      expect(api.get).toHaveBeenCalledWith('/api/admin-users/');
      expect(result).toEqual(mockAdmins);
    });

    test('should handle error when fetching admin users', async () => {
      const error = new Error('Failed to fetch admins');
      api.get.mockRejectedValueOnce(error);

      await expect(superAdminApi.getAdminUsers()).rejects.toThrow('Failed to fetch admins');
      expect(console.error).toHaveBeenCalledWith('Error fetching admin users:', error);
    });
  });

  // Test createAdminUser
  describe('createAdminUser', () => {
    test('should create admin user successfully', async () => {
      const userData = { username: 'newadmin', email: 'newadmin@example.com' };
      const mockResponse = { id: 3, ...userData, user_type: 'admin' };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      // Mock console.log to check debug messages
      const originalConsoleLog = console.log;
      console.log = vi.fn();

      const result = await superAdminApi.createAdminUser(userData);

      expect(console.log).toHaveBeenCalledWith('[DEBUG] Adding admin user with data:', userData);
      expect(console.log).toHaveBeenCalledWith('[DEBUG] Adding admin data:', {
        ...userData,
        user_type: 'admin'
      });

      expect(api.post).toHaveBeenCalledWith('/api/admin-users/', {
        ...userData,
        user_type: 'admin'
      });

      expect(console.log).toHaveBeenCalledWith('[DEBUG] Admin user creation response:', { data: mockResponse });
      expect(result).toEqual(mockResponse);

      // Restore console.log
      console.log = originalConsoleLog;
    });

    test('should ensure user_type is set to admin even if provided differently', async () => {
      const userData = { username: 'newadmin', email: 'newadmin@example.com', user_type: 'superadmin' };
      const mockResponse = { id: 3, username: 'newadmin', email: 'newadmin@example.com', user_type: 'admin' };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      // Suppress console.log
      const originalConsoleLog = console.log;
      console.log = vi.fn();

      await superAdminApi.createAdminUser(userData);

      expect(api.post).toHaveBeenCalledWith('/api/admin-users/', {
        ...userData,
        user_type: 'admin' // Should override the provided user_type
      });

      // Restore console.log
      console.log = originalConsoleLog;
    });

    test('should handle error when creating admin user', async () => {
      const userData = { username: 'newadmin', email: 'newadmin@example.com' };
      const error = new Error('Failed to create admin');
      api.post.mockRejectedValueOnce(error);

      // Suppress console.log but check console.error
      const originalConsoleLog = console.log;
      console.log = vi.fn();

      await expect(superAdminApi.createAdminUser(userData)).rejects.toThrow('Failed to create admin');
      expect(console.error).toHaveBeenCalledWith('Error creating admin user:', error);

      // Restore console.log
      console.log = originalConsoleLog;
    });
  });

  // Test deleteAdminUser
  describe('deleteAdminUser', () => {
    test('should delete admin user successfully', async () => {
      api.delete.mockResolvedValueOnce({});

      const result = await superAdminApi.deleteAdminUser(1);

      expect(api.delete).toHaveBeenCalledWith('/api/admin-users/1/');
      expect(result).toBe(true);
    });

    test('should handle error when deleting admin user', async () => {
      const error = new Error('Failed to delete admin');
      api.delete.mockRejectedValueOnce(error);

      await expect(superAdminApi.deleteAdminUser(1)).rejects.toThrow('Failed to delete admin');
      expect(console.error).toHaveBeenCalledWith('Error deleting admin user:', error);
    });
  });

  // Test checkSuperAdminStatus
  describe('checkSuperAdminStatus', () => {
    test('should return true when user is superadmin', async () => {
      api.get.mockResolvedValueOnce({ data: { isSuperAdmin: true } });

      const result = await superAdminApi.checkSuperAdminStatus();

      expect(api.get).toHaveBeenCalledWith('/api/check-superadmin/');
      expect(result).toBe(true);
    });

    test('should return false when user is not superadmin', async () => {
      api.get.mockResolvedValueOnce({ data: { isSuperAdmin: false } });

      const result = await superAdminApi.checkSuperAdminStatus();

      expect(result).toBe(false);
    });

    test('should handle error and return false', async () => {
      const error = new Error('Failed to check status');
      api.get.mockRejectedValueOnce(error);

      const result = await superAdminApi.checkSuperAdminStatus();

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalledWith('Error checking superadmin status:', error);
    });
  });

  // Test resendAdminVerification
  describe('resendAdminVerification', () => {
    test('should resend verification email successfully', async () => {
      const mockResponse = { success: true, message: 'Verification email sent' };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await superAdminApi.resendAdminVerification(1);

      expect(api.post).toHaveBeenCalledWith('/api/admin-users/1/resend-verification/');
      expect(result).toEqual(mockResponse);
    });

    test('should handle error when resending verification', async () => {
      const error = new Error('Failed to resend verification');
      api.post.mockRejectedValueOnce(error);

      await expect(superAdminApi.resendAdminVerification(1)).rejects.toThrow('Failed to resend verification');
      expect(console.error).toHaveBeenCalledWith('Error resending verification:', error);
    });
  });
});