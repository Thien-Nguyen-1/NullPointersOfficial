import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { loginUser, changeUserPassword, deleteServiceUser } from '../../../services/api';

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

const mockApiInstance = axios.create();

//log in
describe('loginUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('logs in successfully and stores tokens', async () => {
    const mockResponse = {
      data: {
        user: { username: '@admin' },
        access: 'token',
        refresh: 'atoken',
        user_type: 'admin',
      },
    };

    mockApiInstance.post.mockResolvedValueOnce(mockResponse);

    const result = await loginUser('@admin', 'password123');

    expect(localStorage.getItem('token')).toBe('token');
    expect(result).toEqual(mockResponse.data);
  });

  it('stores old token format when only token is provided', async () => {
    const mockResponse = {
      data: {
        user: { username: '@user' },
        token: 'token',
        user_type: 'basic',
      },
    };

    mockApiInstance.post.mockResolvedValueOnce(mockResponse);

    const result = await loginUser('@user', 'legacy123');

    expect(localStorage.getItem('token')).toBe('token');
    expect(localStorage.getItem('refreshToken')).toBe(null);
    expect(result).toEqual(mockResponse.data);
  });

  it('throws error if login fails', async () => {
    const error = { response: { data: { detail: 'Invalid credentials' } } };
    mockApiInstance.post.mockRejectedValueOnce(error);

    await expect(loginUser('@invalid', 'wrongpass')).rejects.toThrow('Login failed:Invalid credentials');
  });

  it('throws fallback error', async () => {
    const error = new Error('Some unknown issue');
    delete error.response;

    mockApiInstance.post.mockRejectedValueOnce(error);

    await expect(loginUser('@random', 'nopass')).rejects.toThrow('Login failed:Unkown error');
  });
});

//chnage password
describe('changeUserPassword', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
  });

  it('changes the password', async () => {
    const mockResponse = { data: { success: true } };

    mockApiInstance.put.mockResolvedValueOnce(mockResponse);

    const result = await changeUserPassword('oldPassword', 'newPassword', 'newPassword');

    expect(mockApiInstance.put).toHaveBeenCalledWith('/worker/password-change/', {
      old_password: 'oldPassword',
      new_password: 'newPassword',
      confirm_new_password: 'newPassword',
    });
    expect(result).toEqual(mockResponse.data);
  });

  it('throws an error if password change failes', async () => {
    const error = new Error('Something failed');
    mockApiInstance.put.mockRejectedValueOnce(error);

    await expect(changeUserPassword('bad', 'bad', 'bad')).rejects.toThrow('Failed to change password');
  });
});

//delete service user
describe('deleteServiceUser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('deletes a service user', async () => {
    const mockResponse = { data: { message: 'User deleted' } };
    mockApiInstance.delete.mockResolvedValueOnce(mockResponse);

    const result = await deleteServiceUser('testuser');

    expect(mockApiInstance.delete).toHaveBeenCalledWith('/service-users/testuser/');
    expect(result).toEqual(mockResponse.data);
  });

  it('throws error if delete fails', async () => {
    const error = new Error('Delete failed');
    mockApiInstance.delete.mockRejectedValueOnce(error);

    await expect(deleteServiceUser('testuser')).rejects.toThrow('Delete failed');
  });
});
