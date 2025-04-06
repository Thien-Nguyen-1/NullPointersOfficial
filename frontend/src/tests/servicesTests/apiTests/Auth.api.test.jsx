import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { loginUser, changeUserPassword, deleteServiceUser } from '../../../services/api';

// Global mock of axios
vi.mock('axios', () => {
  const mockPost = vi.fn();
  const mockPut = vi.fn();
  const mockDelete = vi.fn();

  const mockAxiosInstance = {
    post: mockPost,
    put: mockPut,
    delete: mockDelete,
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  };

  return {
    default: {
      create: () => mockAxiosInstance,
    },
  };
});

// Use the shared instance for all
const mockApiInstance = axios.create();

//
// LOGIN USER TESTS
//
describe('loginUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('logs in successfully and stores JWT tokens', async () => {
    const mockResponse = {
      data: {
        user: { username: 'testuser' },
        access: 'jwt-access-token',
        refresh: 'jwt-refresh-token',
        user_type: 'admin',
      },
    };

    mockApiInstance.post.mockResolvedValueOnce(mockResponse);

    const result = await loginUser('testuser', 'password123');

    expect(localStorage.getItem('token')).toBe('jwt-access-token');
    expect(result).toEqual(mockResponse.data);
  });

  it('stores old token format when only token is provided', async () => {
    const mockResponse = {
      data: {
        user: { username: 'olduser' },
        token: 'legacy-token',
        user_type: 'basic',
      },
    };

    mockApiInstance.post.mockResolvedValueOnce(mockResponse);

    const result = await loginUser('olduser', 'legacy123');

    expect(localStorage.getItem('token')).toBe('legacy-token');
    expect(localStorage.getItem('refreshToken')).toBe(null);
    expect(result).toEqual(mockResponse.data);
  });

  it('throws specific error on login failure with message', async () => {
    const error = { response: { data: { detail: 'Invalid credentials' } } };
    mockApiInstance.post.mockRejectedValueOnce(error);

    await expect(loginUser('baduser', 'wrongpass')).rejects.toThrow('Login failed:Invalid credentials');
  });

  it('throws fallback message if no response exists', async () => {
    const error = new Error('Some unknown issue');
    delete error.response;

    mockApiInstance.post.mockRejectedValueOnce(error);

    await expect(loginUser('someone', 'nopass')).rejects.toThrow('Login failed:Unkown error');
  });
});

//
// CHANGE PASSWORD TESTS
//
describe('changeUserPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
  });

  it('successfully changes the password', async () => {
    const mockResponse = { data: { success: true } };

    mockApiInstance.put.mockResolvedValueOnce(mockResponse);

    const result = await changeUserPassword('old123', 'new123', 'new123');

    expect(mockApiInstance.put).toHaveBeenCalledWith('/worker/password-change/', {
      old_password: 'old123',
      new_password: 'new123',
      confirm_new_password: 'new123',
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('throws an error on password change failure', async () => {
    const error = new Error('Something failed');
    mockApiInstance.put.mockRejectedValueOnce(error);

    await expect(changeUserPassword('bad', 'bad', 'bad')).rejects.toThrow('Failed to change password');
  });
});

//
// DELETE SERVICE USER TESTS
//
describe('deleteServiceUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successfully deletes a service user', async () => {
    const mockResponse = { data: { message: 'User deleted' } };
    mockApiInstance.delete.mockResolvedValueOnce(mockResponse);

    const result = await deleteServiceUser('testuser');

    expect(mockApiInstance.delete).toHaveBeenCalledWith('/service-users/testuser/');
    expect(result).toEqual(mockResponse.data);
  });

  it('throws error if deletion fails', async () => {
    const error = new Error('Delete failed');
    mockApiInstance.delete.mockRejectedValueOnce(error);

    await expect(deleteServiceUser('testuser')).rejects.toThrow('Delete failed');
  });
});
