import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import axios from 'axios';
import {
  getUserSettings,
  deleteUserSettings,
  fetchCompletedInteractiveContent,
  downloadCompletedTask,
} from '../../../services/api';

// ================================
// ✅ Global Axios Mock
// ================================
vi.mock('axios', () => {
  const mockGet = vi.fn();
  const mockDelete = vi.fn();
  const mockCreate = () => ({
    get: mockGet,
    delete: mockDelete,
    put: vi.fn(),
    post: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  });

  return {
    default: {
      create: mockCreate,
    },
  };
});

const mockApiInstance = axios.create();

// ================================
// ✅ Setup global createObjectURL before all tests
// ================================
beforeAll(() => {
  global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
});

// ================================
// ✅ getUserSettings Tests
// ================================
describe('getUserSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns user settings data on success', async () => {
    const mockResponse = { data: { theme: 'dark', language: 'en' } };
    mockApiInstance.get.mockResolvedValueOnce(mockResponse);

    const result = await getUserSettings();
    expect(mockApiInstance.get).toHaveBeenCalledWith('/worker/settings/');
    expect(result).toEqual(mockResponse.data);
  });

  it('throws an error on failure', async () => {
    const error = new Error('Server error');
    mockApiInstance.get.mockRejectedValueOnce(error);
    await expect(getUserSettings()).rejects.toThrow('Failed to get user settings');
  });
});

// ================================
// ✅ deleteUserSettings Tests
// ================================
describe('deleteUserSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('successfully deletes user settings', async () => {
    const mockResponse = { data: { success: true } };
    mockApiInstance.delete.mockResolvedValueOnce(mockResponse);

    const result = await deleteUserSettings();
    expect(mockApiInstance.delete).toHaveBeenCalledWith('/worker/settings/');
    expect(result).toEqual(mockResponse.data);
  });

  it('throws an error if the delete fails', async () => {
    const error = new Error('Request failed');
    mockApiInstance.delete.mockRejectedValueOnce(error);
    await expect(deleteUserSettings()).rejects.toThrow('Failed to delete user account');
  });
});

// ================================
// ✅ fetchCompletedInteractiveContent Tests
// ================================
// describe('fetchCompletedInteractiveContent', () => {
//   beforeEach(() => vi.clearAllMocks());

//   it('returns data on success', async () => {
//     const mockResponse = { data: [{ id: 1 }, { id: 2 }] };
//     mockApiInstance.get.mockResolvedValueOnce(mockResponse);

//     const result = await fetchCompletedInteractiveContent();
//     expect(mockApiInstance.get).toHaveBeenCalledWith('/api/completed-interactive-content/');
//     expect(result).toEqual(mockResponse.data);
//   });

//   it('logs an error on failure', async () => {
//     const error = new Error('Network error');
//     mockApiInstance.get.mockRejectedValueOnce(error);

//     const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
//     await fetchCompletedInteractiveContent();
//     expect(consoleSpy).toHaveBeenCalledWith(
//       'Error fetching completed interactive content:',
//       error
//     );
//     consoleSpy.mockRestore();
//   });
// });

// ================================
// ✅ downloadCompletedTask Tests
// ================================
describe('downloadCompletedTask', () => {
  let createObjectURLSpy, appendChildSpy, removeSpy, clickSpy;

  beforeEach(() => {
    vi.clearAllMocks();
    createObjectURLSpy = vi.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:url');
    appendChildSpy = vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    removeSpy = vi.fn();
    clickSpy = vi.fn();

    vi.spyOn(document, 'createElement').mockImplementation(() => ({
      setAttribute: vi.fn(),
      click: clickSpy,
      remove: removeSpy,
    }));
  });

  it('successfully downloads a PDF task', async () => {
    const mockBlob = new Blob(['mock pdf']);
    mockApiInstance.get.mockResolvedValueOnce({ data: mockBlob });

    await downloadCompletedTask(123, 'mock-token');

    expect(mockApiInstance.get).toHaveBeenCalledWith('/api/download-completed-task/123/', {
      headers: { Authorization: 'Token mock-token' },
      responseType: 'blob',
    });

    expect(createObjectURLSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();
    expect(removeSpy).toHaveBeenCalled();
  });

  it('throws and logs error with response data', async () => {
    const error = { response: { data: 'Download failed' } };
    mockApiInstance.get.mockRejectedValueOnce(error);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(downloadCompletedTask(123, 'mock-token')).rejects.toEqual(error);
    expect(consoleSpy).toHaveBeenCalledWith('Error downloading PDF:', 'Download failed');
    consoleSpy.mockRestore();
  });

  it('throws and logs error with fallback message', async () => {
    const error = new Error('Fallback error');
    mockApiInstance.get.mockRejectedValueOnce(error);

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(downloadCompletedTask(999, 'mock-token')).rejects.toThrow('Fallback error');
    expect(consoleSpy).toHaveBeenCalledWith('Error downloading PDF:', 'Fallback error');
    consoleSpy.mockRestore();
  });
});
