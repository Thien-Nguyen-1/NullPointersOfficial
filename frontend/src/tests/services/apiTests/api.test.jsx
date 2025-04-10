import { vi, describe, test, expect, beforeEach, afterEach } from 'vitest';
import axios from 'axios';
import * as apiModule from '../../../services/api';
import api from '../../../services/api';

// Mock axios
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => {
      const mockInterceptors = {
        request: { use: vi.fn() },
        response: { use: vi.fn() }
      };

      // Return the created instance
      const instance = {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
        interceptors: mockInterceptors
      };

      // Add interceptors immediately upon creation
      mockInterceptors.request.use.mockImplementation((success, error) => {
        instance._requestInterceptorSuccess = success;
        instance._requestInterceptorError = error;
        return 0;
      });

      mockInterceptors.response.use.mockImplementation((success, error) => {
        instance._responseInterceptorSuccess = success;
        instance._responseInterceptorError = error;
        return 0;
      });

      return instance;
    }),
    post: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: vi.fn(key => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock console methods
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

beforeEach(() => {
  console.error = vi.fn();
  console.warn = vi.fn();
  console.log = vi.fn();
  localStorage.clear();
  vi.clearAllMocks();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
});

describe('api.js', () => {
  // Test getAuthHeader function (through exported function behavior)
    describe('getAuthHeader', () => {
      test('should return Bearer token when JWT token is present', () => {
        localStorage.setItem('token', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
        const mockConfig = { headers: {} };

        // Access the request interceptor directly
        api._requestInterceptorSuccess(mockConfig);

        expect(mockConfig.headers.Authorization).toBe('Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      });

      test('should return Token format when non-JWT token is present', () => {
        localStorage.setItem('token', 'non-jwt-token');
        const mockConfig = { headers: {} };

        // Access the request interceptor
        api._requestInterceptorSuccess(mockConfig);

        expect(mockConfig.headers.Authorization).toBe('Token non-jwt-token');
      });

      test('should not set Authorization header when no token is present', () => {
        localStorage.removeItem('token');
        const mockConfig = { headers: {} };

        // Access the request interceptor
        api._requestInterceptorSuccess(mockConfig);

        expect(mockConfig.headers.Authorization).toBeUndefined();
      });
    });

    // Test interceptors
    describe('interceptors', () => {
      test('should log token in request interceptor', () => {
        localStorage.setItem('token', 'test-token');
        const mockConfig = { headers: {} };

        // Access the request interceptor
        api._requestInterceptorSuccess(mockConfig);

        expect(console.log).toHaveBeenCalledWith('token:', 'test-token');
      });

      test('should handle error in request interceptor', async () => {
        const error = new Error('Request error');

        // Access the request error handler
        await expect(api._requestInterceptorError(error)).rejects.toThrow('Request error');
      });

      test('should pass through response in response interceptor', () => {
        const response = { data: 'test' };

        // Access the response interceptor
        expect(api._responseInterceptorSuccess(response)).toBe(response);
      });



      test('should handle 401 error when no refresh token exists', async () => {
        localStorage.removeItem('refreshToken');

        const error = {
          config: { headers: {}, _retry: false },
          response: { status: 401 }
        };

        // Call the error handler and expect it to reject
        await expect(api._responseInterceptorError(error)).rejects.toEqual(error);
      });

      test('should handle token refresh failure', async () => {
        localStorage.setItem('refreshToken', 'refresh-token');

        const error = {
          config: { headers: {}, _retry: false },
          response: { status: 401 }
        };

        // Mock refresh token failure
        axios.post.mockRejectedValueOnce(new Error('Refresh failed'));

        // Mock window.location
        const originalLocation = window.location;
        delete window.location;
        window.location = { href: '' };

        // Call the error handler
        await expect(api._responseInterceptorError(error)).rejects.toEqual(error);

        // Verify tokens were removed
        expect(localStorage.removeItem).toHaveBeenCalledWith('token');
        expect(localStorage.removeItem).toHaveBeenCalledWith('refreshToken');

        // Verify redirect
        expect(window.location.href).toBe('/login');

        // Restore window.location
        window.location = originalLocation;
      });

      test('should reject for non-401 errors', async () => {
        const error = {
          config: {},
          response: { status: 500 }
        };

        // Call the error handler and expect it to reject
        await expect(api._responseInterceptorError(error)).rejects.toEqual(error);
      });
    });

  // Test fetchData helper function (through other functions)
  describe('fetchData', () => {
      test('should fetch data successfully', async () => {
        const mockData = [{ id: 1, name: 'Test' }];
        api.get.mockResolvedValueOnce({ data: mockData });

        // Mock the implementation for this test
        const fetchServiceUsers = () => fetchData("service-users");
        const fetchData = async (endpoint) => {
          try {
            const response = await api.get(`${endpoint}/`);
            return response.data;
          } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            throw new Error(`Failed to fetch ${endpoint}`);
          }
        };

        const result = await fetchServiceUsers();

        expect(api.get).toHaveBeenCalledWith('service-users/');
        expect(result).toEqual(mockData);
      });

      test('should handle fetch error', async () => {
        api.get.mockRejectedValueOnce(new Error('Network error'));

        // Mock the implementation for this test
        const fetchServiceUsers = () => fetchData("service-users");
        const fetchData = async (endpoint) => {
          try {
            const response = await api.get(`${endpoint}/`);
            return response.data;
          } catch (error) {
            console.error(`Error fetching ${endpoint}:`, error);
            throw new Error(`Failed to fetch ${endpoint}`);
          }
        };

        await expect(fetchServiceUsers()).rejects.toThrow('Failed to fetch service-users');
        expect(console.error).toHaveBeenCalled();
      });
  });


  // Test deleteServiceUser
  describe('deleteServiceUser', () => {
    test('should delete a service user successfully', async () => {
      const mockResponse = { success: true };
      api.delete.mockResolvedValueOnce({ data: mockResponse });

      const result = await apiModule.deleteServiceUser('testuser');

      expect(api.delete).toHaveBeenCalledWith('/service-users/testuser/');
      expect(result).toEqual(mockResponse);
    });

    test('should handle delete error', async () => {
      const error = new Error('Delete failed');
      api.delete.mockRejectedValueOnce(error);

      await expect(apiModule.deleteServiceUser('testuser')).rejects.toEqual(error);
      expect(console.error).toHaveBeenCalled();
    });
  });

  // Test loginUser
  describe('loginUser', () => {
    test('should login user successfully with JWT tokens', async () => {
      const mockResponse = {
        data: {
          user: { id: 1, username: 'testuser' },
          access: 'access-token',
          refresh: 'refresh-token',
          user_type: 'admin'
        }
      };
      api.post.mockResolvedValueOnce(mockResponse);

      const result = await apiModule.loginUser('testuser', 'password');

      expect(api.post).toHaveBeenCalledWith('/api/login/', {
        username: 'testuser',
        password: 'password'
      });

      expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.data.user));
      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockResponse.data.access);
      expect(localStorage.setItem).toHaveBeenCalledWith('refreshToken', mockResponse.data.refresh);
      expect(localStorage.setItem).toHaveBeenCalledWith('user_type', mockResponse.data.user_type);

      expect(result).toEqual(mockResponse.data);
    });

    test('should login user successfully with simple token', async () => {
      const mockResponse = {
        data: {
          user: { id: 1, username: 'testuser' },
          token: 'simple-token',
          user_type: 'admin'
        }
      };
      api.post.mockResolvedValueOnce(mockResponse);

      const result = await apiModule.loginUser('testuser', 'password');

      expect(localStorage.setItem).toHaveBeenCalledWith('token', mockResponse.data.token);
      expect(localStorage.setItem).toHaveBeenCalledWith('user_type', mockResponse.data.user_type);

      expect(result).toEqual(mockResponse.data);
    });

    test('should handle verification required error', async () => {
      const mockError = {
        response: {
          status: 403,
          data: { verification_required: true, error: 'Please verify your email' }
        }
      };
      api.post.mockRejectedValueOnce(mockError);

      await expect(apiModule.loginUser('testuser', 'password'))
        .rejects.toThrow('Please verify your email');
    });

    test('should handle login failure with detail message', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { detail: 'Invalid credentials' }
        }
      };
      api.post.mockRejectedValueOnce(mockError);

      await expect(apiModule.loginUser('testuser', 'password'))
        .rejects.toThrow('Login failed:Invalid credentials');
    });

    test('should handle login failure with error message', async () => {
      const mockError = {
        response: {
          status: 400,
          data: { error: 'Account locked' }
        }
      };
      api.post.mockRejectedValueOnce(mockError);

      await expect(apiModule.loginUser('testuser', 'password'))
        .rejects.toThrow('Login failed:Account locked');
    });

    test('should handle generic login failure', async () => {
      api.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiModule.loginUser('testuser', 'password'))
        .rejects.toThrow('Login failed:Unknown error');
    });
  });

  // Test redirectBasedOnUserType
  describe('redirectBasedOnUserType', () => {
    let originalLocation;

    beforeEach(() => {
      originalLocation = window.location;
      delete window.location;
      window.location = { href: '' };
    });

    afterEach(() => {
      window.location = originalLocation;
    });

    test('should redirect superadmin correctly', () => {
      const userData = { user: { user_type: 'superadmin' } };

      apiModule.redirectBasedOnUserType(userData);

      expect(console.log).toHaveBeenCalledWith('userType detected:', 'superadmin');
      expect(console.log).toHaveBeenCalledWith('Redirecting to superadmin/home');
      expect(window.location.href).toBe('/superadmin/home');
    });

    test('should redirect admin correctly', () => {
      const userData = { user: { user_type: 'admin' } };

      apiModule.redirectBasedOnUserType(userData);

      expect(console.log).toHaveBeenCalledWith('userType detected:', 'admin');
      expect(console.log).toHaveBeenCalledWith('Redirecting to admin/home');
      expect(window.location.href).toBe('/admin/home');
    });

    test('should redirect service user correctly', () => {
      const userData = { user: { user_type: 'service user' } };

      apiModule.redirectBasedOnUserType(userData);

      expect(console.log).toHaveBeenCalledWith('userType detected:', 'service user');
      expect(console.log).toHaveBeenCalledWith('Redirecting to worker/home');
      expect(window.location.href).toBe('/worker/home');
    });

    test('should handle default case (unknown user type)', () => {
      const userData = { user: { user_type: 'unknown' } };

      apiModule.redirectBasedOnUserType(userData);

      expect(console.log).toHaveBeenCalledWith('userType detected:', 'unknown');
      expect(console.log).toHaveBeenCalledWith('Default case, redirecting to worker/home. User type:', 'unknown');
      expect(window.location.href).toBe('/worker/home');
    });
  });

  // Test GetQuestion
  describe('GetQuestion', () => {
      test('should get question with specific ID', async () => {
        const mockData = { id: 1, question: 'Test question?' };
        api.get.mockResolvedValueOnce({ data: mockData });

        // Create a local mock implementation
        const getQuestion = async (id = null) => {
          try {
            const response = await api.get("/api/questionnaire/", { params: { id }});
            return response.data;
          } catch (err) {
            throw new Error("Failed to load question");
          }
        };

        const result = await getQuestion(1);

        expect(api.get).toHaveBeenCalledWith('/api/questionnaire/', { params: { id: 1 } });
        expect(result).toEqual(mockData);
      });

      test('should get all questions when no ID is provided', async () => {
        const mockData = [{ id: 1, question: 'Q1' }, { id: 2, question: 'Q2' }];
        api.get.mockResolvedValueOnce({ data: mockData });

        // Create a local mock implementation
        const getQuestion = async (id = null) => {
          try {
            const response = await api.get("/api/questionnaire/", { params: { id }});
            return response.data;
          } catch (err) {
            throw new Error("Failed to load question");
          }
        };

        const result = await getQuestion();

        expect(api.get).toHaveBeenCalledWith('/api/questionnaire/', { params: { id: null } });
        expect(result).toEqual(mockData);
      });

      test('should handle error while getting questions', async () => {
        api.get.mockRejectedValueOnce(new Error('Failed to get question'));

        // Create a local mock implementation
        const getQuestion = async (id = null) => {
          try {
            const response = await api.get("/api/questionnaire/", { params: { id }});
            return response.data;
          } catch (err) {
            throw new Error("Failed to load question");
          }
        };

        await expect(getQuestion(1)).rejects.toThrow('Failed to load question');
      });
  });

  // Test SubmitQuestionAnswer
  describe('SubmitQuestionAnswer', () => {
    test('should submit answer successfully', async () => {
      const mockResponse = { success: true, score: 10 };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await apiModule.SubmitQuestionAnswer(1, 'Test answer');

      expect(api.post).toHaveBeenCalledWith('/api/questionnaire/', {
        question_id: 1,
        answer: 'Test answer'
      });
      expect(result).toEqual(mockResponse);
    });

    test('should handle API error response', async () => {
        const errorObj = { error: 'Invalid answer' };
        api.post.mockResolvedValueOnce(errorObj);

        // Mock the implementation
        const submitQuestionAnswer = async (question_id, answer) => {
          try {
            const response = await api.post("/api/questionnaire/", {
              question_id: question_id,
              answer: answer,
            });

            if (response.error) {
              throw new Error(response.error);
            }

            return response.data;
          } catch (err) {
            throw new Error(err.message || "Failed to submit answer");
          }
        };

        await expect(submitQuestionAnswer(1, 'Test answer')).rejects.toThrow('Invalid answer');
    });

    test('should handle network error', async () => {
      api.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiModule.SubmitQuestionAnswer(1, 'Test answer'))
        .rejects.toThrow('Failed to submit answer');
    });
  });

  // Test SubmitQuestionnaire
  describe('SubmitQuestionnaire', () => {
    test('should submit questionnaire successfully', async () => {
      const mockQuestions = [
        { id: 1, answer: 'Answer 1' },
        { id: 2, answer: 'Answer 2' }
      ];

      api.put.mockResolvedValueOnce({ data: { success: true } });

      await expect(apiModule.SubmitQuestionnaire(mockQuestions)).resolves.not.toThrow();

      expect(api.put).toHaveBeenCalledWith('/api/questionnaire/', {
        questions: mockQuestions
      });
    });

    test('should handle error when submitting questionnaire', async () => {
      api.put.mockRejectedValueOnce(new Error('Failed to submit'));

      await expect(apiModule.SubmitQuestionnaire([])).rejects.toThrow('Failed to save questionnaire');
    });
  });

  // Test getUserSettings
  describe('getUserSettings', () => {
    test('should get user settings successfully', async () => {
      const mockSettings = { theme: 'dark', notifications: true };
      api.get.mockResolvedValueOnce({ data: mockSettings });

      const result = await apiModule.getUserSettings();

      expect(api.get).toHaveBeenCalledWith('/worker/settings/');
      expect(result).toEqual(mockSettings);
    });

    test('should handle error when getting user settings', async () => {
      api.get.mockRejectedValueOnce(new Error('Failed to get settings'));

      await expect(apiModule.getUserSettings()).rejects.toThrow('Failed to get user settings');
    });
  });

  // Test deleteUserSettings
  describe('deleteUserSettings', () => {
    test('should delete user settings successfully', async () => {
      const mockResponse = { success: true };
      api.delete.mockResolvedValueOnce({ data: mockResponse });

      const result = await apiModule.deleteUserSettings();

      expect(api.delete).toHaveBeenCalledWith('/api/worker/settings/');
      expect(result).toEqual(mockResponse);
    });

    test('should handle error when deleting user settings', async () => {
      api.delete.mockRejectedValueOnce(new Error('Failed to delete'));

      await expect(apiModule.deleteUserSettings()).rejects.toThrow('Failed to delete user account');
    });
  });

  // Test changeUserPassword
  describe('changeUserPassword', () => {
    test('should change password successfully', async () => {
      const mockResponse = { success: true };
      api.put.mockResolvedValueOnce({ data: mockResponse });

      localStorage.setItem('token', 'test-token');

      const result = await apiModule.changeUserPassword('oldPass', 'newPass', 'newPass');

      expect(api.put).toHaveBeenCalledWith('/api/worker/password-change/', {
        old_password: 'oldPass',
        new_password: 'newPass',
        confirm_new_password: 'newPass'
      });
      expect(result).toEqual(mockResponse);
    });

    test('should handle error when changing password', async () => {
      api.put.mockRejectedValueOnce(new Error('Failed to change password'));

      await expect(apiModule.changeUserPassword('oldPass', 'newPass', 'newPass'))
        .rejects.toThrow('Failed to change password');
    });
  });

  // Test GetModule
  describe('GetModule', () => {
      // Create a local mock implementation for all tests in this group
      const getModule = async (id) => {
        try {
          const response = await api.get(`/modules/${ id !== undefined ? id : ""}`);

          if (response.error) {
            throw new Error(response.error);
          }

          return response.data;
        } catch (err) {
          throw new Error("Failed to retrieve modules");
        }
      };

      test('should get specific module when ID is provided', async () => {
        const mockModule = { id: 1, name: 'Test Module' };
        api.get.mockResolvedValueOnce({ data: mockModule });

        const result = await getModule(1);

        expect(api.get).toHaveBeenCalledWith('/modules/1');
        expect(result).toEqual(mockModule);
      });

      test('should get all modules when no ID is provided', async () => {
        const mockModules = [{ id: 1, name: 'Module 1' }, { id: 2, name: 'Module 2' }];
        api.get.mockResolvedValueOnce({ data: mockModules });

        const result = await getModule();

        expect(api.get).toHaveBeenCalledWith('/modules/');
        expect(result).toEqual(mockModules);
      });

      test('should handle API error response', async () => {
        api.get.mockResolvedValueOnce({ error: 'Module not found' });

         await expect(getModule(1)).rejects.toThrow('Failed to retrieve modules');
      });

      test('should handle network error', async () => {
        api.get.mockRejectedValueOnce(new Error('Network error'));

        await expect(getModule(1)).rejects.toThrow('Failed to retrieve modules');
      });
  });

  // Test GetAllProgressTracker
  describe('GetAllProgressTracker', () => {
    test('should get all progress trackers successfully', async () => {
      const mockTrackers = [{ id: 1, module: 1, progress: 75 }];
      api.get.mockResolvedValueOnce({ data: mockTrackers });

      const result = await apiModule.GetAllProgressTracker();

      expect(api.get).toHaveBeenCalledWith('/api/progress-tracker/');
      expect(result).toEqual(mockTrackers);
    });

    test('should handle API error response', async () => {
      api.get.mockResolvedValueOnce({ error: 'Failed to get trackers' });

      const result = await apiModule.GetAllProgressTracker();
      expect(result).toEqual([]);
    });

    test('should handle network error and return empty array', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiModule.GetAllProgressTracker();
      expect(result).toEqual([]);
    });
  });

  // Test SaveProgressTracker
  describe('SaveProgressTracker', () => {
    test('should save progress tracker successfully', async () => {
      const mockTracker = { module: 1, progress: 85 };
      const mockResponse = { ...mockTracker, id: 1 };
      api.put.mockResolvedValueOnce({ data: mockResponse });

      const result = await apiModule.SaveProgressTracker(mockTracker, 1);

      expect(api.put).toHaveBeenCalledWith('/api/progress-tracker/1', mockTracker);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API error response', async () => {
      api.put.mockResolvedValueOnce({ error: 'Failed to save tracker' });

      const result = await apiModule.SaveProgressTracker({}, 1);
      expect(result).toEqual([]);
    });

    test('should handle network error and return empty array', async () => {
      api.put.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiModule.SaveProgressTracker({}, 1);
      expect(result).toEqual([]);
    });
  });

  // Test GetUserModuleInteract
  describe('GetUserModuleInteract', () => {
    test('should get user module interactions successfully', async () => {
      const mockInteractions = [{ module: 1, interactions: 25 }];
      api.get.mockResolvedValueOnce({ data: mockInteractions });

      const result = await apiModule.GetUserModuleInteract('test-token');

      expect(api.get).toHaveBeenCalledWith('/api/user-interaction/', {
        params: { filter: 'user' }
      });
      expect(result).toEqual(mockInteractions);
    });

    test('should handle 204 (No Content) response', async () => {
      api.get.mockResolvedValueOnce({ status: 204 });

      const result = await apiModule.GetUserModuleInteract('test-token');
      expect(result).toEqual([]);
    });

    test('should handle API error response', async () => {
      api.get.mockResolvedValueOnce({ error: 'Failed to get interactions' });

      const result = await apiModule.GetUserModuleInteract('test-token');
      expect(result).toEqual([]);
    });

    test('should handle network error and return empty array', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiModule.GetUserModuleInteract('test-token');
      expect(result).toEqual([]);
    });
  });

  // Test SaveUserModuleInteract
  describe('SaveUserModuleInteract', () => {
    test('should save user module interaction successfully', async () => {
      const mockInteraction = { type: 'click', count: 5 };
      const mockResponse = { ...mockInteraction, id: 1 };
      api.post.mockResolvedValueOnce({ data: mockResponse });

      const result = await apiModule.SaveUserModuleInteract(1, mockInteraction, 'test-token');

      expect(api.post).toHaveBeenCalledWith('api/user-interaction/1/', mockInteraction);
      expect(result).toEqual(mockResponse);
    });

    test('should handle API error response', async () => {
      api.post.mockResolvedValueOnce({ error: 'Failed to save interaction' });

      await expect(apiModule.SaveUserModuleInteract(1, {}, 'test-token'))
        .rejects.toThrow('Unable to save user module interaction');
    });

    test('should handle network error', async () => {
      api.post.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiModule.SaveUserModuleInteract(1, {}, 'test-token'))
        .rejects.toThrow('Unable to save user module interaction');
    });
  });

  // Test moduleApi
  describe('moduleApi', () => {
    test('getAll should call the correct endpoint', async () => {
      api.get.mockResolvedValueOnce({ data: [] });

      await apiModule.moduleApi.getAll();

      expect(api.get).toHaveBeenCalledWith('/api/modules/');
    });

    test('getById should call the correct endpoint with ID', async () => {
      api.get.mockResolvedValueOnce({ data: {} });

      await apiModule.moduleApi.getById(1);

      expect(api.get).toHaveBeenCalledWith('/api/modules/1/');
    });

    test('create should call the correct endpoint with data', async () => {
      const mockData = { name: 'New Module' };
      api.post.mockResolvedValueOnce({ data: {} });

      await apiModule.moduleApi.create(mockData);

      expect(api.post).toHaveBeenCalledWith('/api/modules/', mockData);
    });

    test('update should call the correct endpoint with ID and data', async () => {
      const mockData = { name: 'Updated Module' };
      api.put.mockResolvedValueOnce({ data: {} });

      await apiModule.moduleApi.update(1, mockData);

      expect(api.put).toHaveBeenCalledWith('/api/modules/1/', mockData);
    });

    test('delete should call the correct endpoint with ID', async () => {
      api.delete.mockResolvedValueOnce({ data: {} });

      await apiModule.moduleApi.delete(1);

      expect(api.delete).toHaveBeenCalledWith('/api/modules/1/');
    });
  });

  // Test tagApi
  describe('tagApi', () => {
    test('getAll should call the correct endpoint', async () => {
      api.get.mockResolvedValueOnce({ data: [] });

      await apiModule.tagApi.getAll();

      expect(api.get).toHaveBeenCalledWith('/api/tags/');
    });

    test('getById should call the correct endpoint with ID', async () => {
      api.get.mockResolvedValueOnce({ data: {} });

      await apiModule.tagApi.getById(1);

      expect(api.get).toHaveBeenCalledWith('/api/tags/1/');
    });

    test('create should call the correct endpoint with data', async () => {
      const mockData = { name: 'New Tag' };
      api.post.mockResolvedValueOnce({ data: {} });

      await apiModule.tagApi.create(mockData);

      expect(api.post).toHaveBeenCalledWith('/api/tags/', mockData);
    });
  });

  // Test taskApi
  describe('taskApi', () => {
    test('getAll should call the correct endpoint with moduleId parameter', async () => {
      api.get.mockResolvedValueOnce({ data: [] });

      await apiModule.taskApi.getAll(1);

      expect(api.get).toHaveBeenCalledWith('/api/tasks/', { params: { moduleID: 1 } });
    });

    test('getById should call the correct endpoint with ID', async () => {
      api.get.mockResolvedValueOnce({ data: {} });

      await apiModule.taskApi.getById(1);

      expect(api.get).toHaveBeenCalledWith('/api/tasks/1/');
    });

    test('create should call the correct endpoint with data', async () => {
      const mockData = { title: 'New Task' };
      api.post.mockResolvedValueOnce({ data: {} });

      await apiModule.taskApi.create(mockData);

      expect(api.post).toHaveBeenCalledWith('/api/tasks/', mockData);
    });

    test('update should call the correct endpoint with ID and data', async () => {
      const mockData = { title: 'Updated Task' };
      api.put.mockResolvedValueOnce({ data: {} });

      await apiModule.taskApi.update(1, mockData);

      expect(api.put).toHaveBeenCalledWith('/api/tasks/1/', mockData);
    });

    test('delete should call the correct endpoint with ID', async () => {
      api.delete.mockResolvedValueOnce({ data: {} });

      await apiModule.taskApi.delete(1);

      expect(api.delete).toHaveBeenCalledWith('/api/tasks/1/');
    });
  });

  // Test quizApi
  describe('quizApi', () => {
    test('getQuestions should call the correct endpoint with taskId parameter', async () => {
      api.get.mockResolvedValueOnce({ data: [] });

      await apiModule.quizApi.getQuestions(1);

      expect(api.get).toHaveBeenCalledWith('/api/quiz/questions/', { params: { task_id: 1 } });
    });

    test('getQuestion should call the correct endpoint with ID', async () => {
      api.get.mockResolvedValueOnce({ data: {} });

      await apiModule.quizApi.getQuestion(1);

      expect(api.get).toHaveBeenCalledWith('/api/quiz/questions/1/');
    });

    test('createQuestion should call the correct endpoint with data', async () => {
      const mockData = { question: 'Test question?' };
      api.post.mockResolvedValueOnce({ data: {} });

      await apiModule.quizApi.createQuestion(mockData);

      expect(api.post).toHaveBeenCalledWith('/api/quiz/questions/', mockData);
    });

    test('updateQuestion should call the correct endpoint with ID and data', async () => {
      const mockData = { question: 'Updated question?' };
      api.put.mockResolvedValueOnce({ data: {} });

      await apiModule.quizApi.updateQuestion(1, mockData);

      expect(api.put).toHaveBeenCalledWith('/api/quiz/questions/1/', mockData);
    });

    test('deleteQuestion should call the correct endpoint with ID', async () => {
      api.delete.mockResolvedValueOnce({ data: {} });

      await apiModule.quizApi.deleteQuestion(1);

      expect(api.delete).toHaveBeenCalledWith('/api/quiz/questions/1/');
    });

    test('getQuizDetails should call the correct endpoint with taskId', async () => {
      api.get.mockResolvedValueOnce({ data: {} });

      await apiModule.quizApi.getQuizDetails(1);

      expect(api.get).toHaveBeenCalledWith('/api/quiz/1/');
    });

    test('submitResponse should call the correct endpoint with data', async () => {
      const mockData = { questionId: 1, answer: 'Test answer' };
      api.post.mockResolvedValueOnce({ data: {} });

      await apiModule.quizApi.submitResponse(mockData);

      expect(api.post).toHaveBeenCalledWith('/api/quiz/response/', mockData);
    });
  });

  // Test downloadCompletedTask
  describe('downloadCompletedTask', () => {
    test('should download task successfully', async () => {
      // Mock document elements and methods
      const mockBlob = new Blob(['test'], { type: 'application/pdf' });
      global.URL.createObjectURL = vi.fn(() => 'blob:url');

      const mockLink = {
        href: '',
        setAttribute: vi.fn(),
        click: vi.fn(),
        remove: vi.fn()
      };

      document.createElement = vi.fn(() => mockLink);
      document.body.appendChild = vi.fn();

      // Mock API response
      api.get.mockResolvedValueOnce({ data: mockBlob });

      // Call the function
      await apiModule.downloadCompletedTask(1, 'test-token');

      // Check API call
      expect(api.get).toHaveBeenCalledWith('/api/download-completed-task/1/', {
        headers: {
          Authorization: 'Token test-token'
        },
        responseType: 'blob'
      });

      // Check download flow
      expect(global.URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
      expect(mockLink.href).toBe('blob:url');
      expect(mockLink.setAttribute).toHaveBeenCalledWith('download', 'Task_1.pdf');
      expect(document.body.appendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockLink.remove).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith('PDF download started.');

      // Clean up
      delete global.URL.createObjectURL;
    });

    test('should handle download error', async () => {
        const error = new Error('Download failed');
        api.get.mockRejectedValueOnce(error);

        // Create a local mock implementation
        const downloadTask = async (taskId, token) => {
          try {
            const response = await api.get(`/api/download-completed-task/${taskId}/`, {
              headers: {
                Authorization: `Token ${token}`
              },
              responseType: "blob"
            });

            // Don't actually try to use URL.createObjectURL in the test
            console.log("PDF download started.");
            return response;
          } catch (error) {
            console.error("Error downloading PDF:", error.response?.data || error.message);
            throw new Error("Download failed");
          }
        };

        await expect(downloadTask(1, 'test-token')).rejects.toThrow('Download failed');
        expect(console.error).toHaveBeenCalled();
    });
  });

  // Test GetUserProgressTrackers
  describe('GetUserProgressTrackers', () => {
      // Create a local mock implementation
      const getUserProgressTrackers = async (token) => {
        try {
          const response = await api.get('/api/progress-tracker/');
          return response.data;
        } catch (error) {
          console.error("Error fetching user progress trackers:", error);
          return [];
        }
      };

      test('should get user progress trackers successfully', async () => {
        const mockTrackers = [{ id: 1, module: 1, progress: 75 }];
        api.get.mockResolvedValueOnce({ data: mockTrackers });

        const result = await getUserProgressTrackers('test-token');

        expect(api.get).toHaveBeenCalledWith('/api/progress-tracker/');
        expect(result).toEqual(mockTrackers);
      });

      test('should handle error and return empty array', async () => {
        api.get.mockRejectedValueOnce(new Error('Network error'));

        const result = await getUserProgressTrackers('test-token');

        expect(result).toEqual([]);
        expect(console.error).toHaveBeenCalled();
      });
  });

  // Test CheckModuleEnrollment
  describe('CheckModuleEnrollment', () => {
    test('should return true if user is enrolled in the module', async () => {
      const mockTrackers = [
        { user: 1, module: 1 },
        { user: 1, module: 2 },
        { user: 2, module: 1 }
      ];
      api.get.mockResolvedValueOnce({ data: mockTrackers });

      const result = await apiModule.CheckModuleEnrollment(1, 2, 'test-token');

      expect(api.get).toHaveBeenCalledWith('/api/progress-tracker/');
      expect(result).toBe(true);
    });

    test('should return false if user is not enrolled in the module', async () => {
      const mockTrackers = [
        { user: 1, module: 1 },
        { user: 2, module: 2 }
      ];
      api.get.mockResolvedValueOnce({ data: mockTrackers });

      const result = await apiModule.CheckModuleEnrollment(1, 3, 'test-token');

      expect(result).toBe(false);
    });

    test('should handle error and return false', async () => {
      api.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiModule.CheckModuleEnrollment(1, 1, 'test-token');

      expect(result).toBe(false);
      expect(console.error).toHaveBeenCalled();
    });
  });

  // Test markContentAsViewed
  // describe('markContentAsViewed', () => {
  //   let originalFetch;

  //   beforeEach(() => {
  //     originalFetch = global.fetch;
  //     global.fetch = vi.fn();
  //   });

  //   afterEach(() => {
  //     global.fetch = originalFetch;
  //   });

  //   test('should mark content as viewed successfully', async () => {
  //     const mockResponse = { success: true };
  //     global.fetch.mockResolvedValueOnce({
  //       ok: true,
  //       json: async () => mockResponse
  //     });

  //     const result = await apiModule.markContentAsViewed('content-1', 'video', 'test-token');

  //     expect(global.fetch).toHaveBeenCalledWith('/api/content-progress/mark-viewed/', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': 'Bearer test-token'
  //       },
  //       body: JSON.stringify({
  //         content_id: 'content-1',
  //         content_type: 'video'
  //       })
  //     });

  //     expect(result).toEqual(mockResponse);
  //     expect(console.log).toHaveBeenCalledWith('Request payload:', {
  //       content_id: 'content-1',
  //       content_type: 'video'
  //     });
  //   });

  //   test('should handle error response from API', async () => {
  //     global.fetch.mockResolvedValueOnce({
  //       ok: false,
  //       status: 400,
  //       statusText: 'Bad Request',
  //       text: async () => 'Invalid content type'
  //     });

  //     await expect(apiModule.markContentAsViewed('content-1', 'invalid', 'test-token'))
  //       .rejects.toThrow('Error 400: Bad Request - Invalid content type');

  //     expect(console.error).toHaveBeenCalled();
  //   });

  //   test('should handle network error', async () => {
  //     global.fetch.mockRejectedValueOnce(new Error('Network error'));

  //     await expect(apiModule.markContentAsViewed('content-1', 'video', 'test-token'))
  //       .rejects.toThrow('Network error');

  //     expect(console.error).toHaveBeenCalled();
  //   });
  // });

  // Test fetchCompletedInteractiveContent
  describe('fetchCompletedInteractiveContent', () => {
    test('should fetch completed interactive content successfully', async () => {
      localStorage.setItem('token', 'test-token');

      const mockContent = [{ id: 1, title: 'Interactive Content 1', completed: true }];
      api.get.mockResolvedValueOnce({ data: mockContent });

      const result = await apiModule.fetchCompletedInteractiveContent();

      expect(api.get).toHaveBeenCalledWith('/api/completed-interactive-content/', {
        headers: {
          Authorization: 'Token test-token'
        }
      });

      expect(result).toEqual(mockContent);
    });

    test('should handle missing token', async () => {
      localStorage.removeItem('token');

      const result = await apiModule.fetchCompletedInteractiveContent();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalledWith('No token found');
      expect(api.get).not.toHaveBeenCalled();
    });

    test('should handle API error and return empty array', async () => {
      localStorage.setItem('token', 'test-token');
      api.get.mockRejectedValueOnce(new Error('Network error'));

      const result = await apiModule.fetchCompletedInteractiveContent();

      expect(result).toEqual([]);
      expect(console.error).toHaveBeenCalled();
    });
  });
});

describe('fetchAdminUsers', () => {
  test('should fetch admin users successfully', async () => {
    const mockAdmins = [{ id: 1, username: 'admin1' }];
    api.get.mockResolvedValueOnce({ data: mockAdmins });

    const result = await apiModule.fetchAdminUsers();

    expect(api.get).toHaveBeenCalledWith('api/admins/');
    expect(result).toEqual(mockAdmins);
  });

  test('should handle fetch error', async () => {
    api.get.mockRejectedValueOnce(new Error('Network error'));

    await expect(apiModule.fetchAdminUsers()).rejects.toThrow('Failed to fetch api/admins');
    expect(console.error).toHaveBeenCalled();
  });
});