import { vi, describe, test, expect, beforeEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import React from 'react';
import { EnrollmentContextProvider, useEnrollment } from '../../../services/EnrollmentContext';
import { AuthContext } from '../../../services/AuthContext';
import api from '../../../services/api';

// Mock api
vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn()
  }
}));

// Mock AuthContext
const mockAuthContext = {
  user: { id: 1, username: 'testuser' },
  token: 'test-token',
  isAuthenticated: true
};

const MockAuthProvider = ({ children, authValue = mockAuthContext }) => (
  <AuthContext.Provider value={authValue}>
    {children}
  </AuthContext.Provider>
);

// Test component that uses the enrollment context
const TestComponent = () => {
  const {
    enrolledModules,
    isLoading,
    error,
    isEnrolled,
    enrollInModule,
    updateModuleProgress,
    getEnrollment,
    completeModule
  } = useEnrollment();

  return (
    <div>
      <div data-testid="loading">{isLoading ? 'true' : 'false'}</div>
      <div data-testid="error">{error || 'none'}</div>
      <div data-testid="enrolled-count">{enrolledModules.length}</div>
      <div data-testid="is-enrolled-1">{isEnrolled(1) ? 'true' : 'false'}</div>
      <div data-testid="is-enrolled-2">{isEnrolled(2) ? 'true' : 'false'}</div>
      <button
        data-testid="enroll-btn"
        onClick={() => enrollInModule(2)}
      >
        Enroll in Module 2
      </button>
      <button
        data-testid="update-progress-btn"
        onClick={() => updateModuleProgress(1, { completed: true })}
      >
        Update Progress
      </button>
      <button
        data-testid="get-enrollment-btn"
        onClick={() => {
          const enrollment = getEnrollment(1);
          document.getElementById('enrollment-result').textContent =
            enrollment ? JSON.stringify(enrollment) : 'null';
        }}
      >
        Get Enrollment
      </button>
      <div id="enrollment-result"></div>
      <button
        data-testid="complete-module-btn"
        onClick={() => completeModule(1)}
      >
        Complete Module
      </button>
    </div>
  );
};

describe('EnrollmentContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test initial loading state
  test('should show loading state initially', async () => {
    // Delay the API response to ensure we see the loading state
    api.get.mockImplementationOnce(() => new Promise(resolve => setTimeout(() => resolve({ data: [] }), 100)));

    render(
      <MockAuthProvider>
        <EnrollmentContextProvider>
          <TestComponent />
        </EnrollmentContextProvider>
      </MockAuthProvider>
    );

    expect(screen.getByTestId('loading').textContent).toBe('true');

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
  });

  // Test fetching enrollments on mount
  test('should fetch enrolled modules on mount', async () => {
    const mockEnrollments = [
      { id: 1, user: 1, module: 1, completed: false },
      { id: 2, user: 1, module: 3, completed: true }
    ];

    api.get.mockResolvedValueOnce({ data: mockEnrollments });

    render(
      <MockAuthProvider>
        <EnrollmentContextProvider>
          <TestComponent />
        </EnrollmentContextProvider>
      </MockAuthProvider>
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/progress-tracker/');
      expect(screen.getByTestId('enrolled-count').textContent).toBe('2');
      expect(screen.getByTestId('is-enrolled-1').textContent).toBe('true');
      expect(screen.getByTestId('is-enrolled-2').textContent).toBe('false');
    });
  });

  // Test error handling
  test('should handle errors when fetching enrollments', async () => {
    api.get.mockRejectedValueOnce(new Error('Network error'));

    render(
      <MockAuthProvider>
        <EnrollmentContextProvider>
          <TestComponent />
        </EnrollmentContextProvider>
      </MockAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('Failed to load enrollment data');
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
  });

  // Test not fetching when user is not authenticated
  test('should not fetch enrollments when user is not authenticated', async () => {
    render(
      <MockAuthProvider authValue={{ user: null, token: null, isAuthenticated: false }}>
        <EnrollmentContextProvider>
          <TestComponent />
        </EnrollmentContextProvider>
      </MockAuthProvider>
    );

    await waitFor(() => {
      expect(api.get).not.toHaveBeenCalled();
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('enrolled-count').textContent).toBe('0');
    });
  });

  // Test enrollInModule function - successful enrollment
  test('should enroll user in a module successfully', async () => {
    const mockEnrollments = [
      { id: 1, user: 1, module: 1, completed: false }
    ];

    const newEnrollment = { id: 2, user: 1, module: 2, completed: false };

    api.get.mockResolvedValueOnce({ data: mockEnrollments });
    api.post.mockResolvedValueOnce({ data: newEnrollment });

    render(
      <MockAuthProvider>
        <EnrollmentContextProvider>
          <TestComponent />
        </EnrollmentContextProvider>
      </MockAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-enrolled-2').textContent).toBe('false');
    });

    act(() => {
      screen.getByTestId('enroll-btn').click();
    });

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/api/progress-tracker/', {
        user: 1,
        module: 2,
        completed: false,
        pinned: false,
        hasLiked: false
      });
      expect(screen.getByTestId('is-enrolled-2').textContent).toBe('true');
      expect(screen.getByTestId('enrolled-count').textContent).toBe('2');
    });
  });

  // Test enrollInModule function - already enrolled
  test('should not re-enroll if already enrolled', async () => {
    const mockEnrollments = [
      { id: 1, user: 1, module: 1, completed: false },
      { id: 2, user: 1, module: 2, completed: false }
    ];

    api.get.mockResolvedValueOnce({ data: mockEnrollments });

    render(
      <MockAuthProvider>
        <EnrollmentContextProvider>
          <TestComponent />
        </EnrollmentContextProvider>
      </MockAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-enrolled-2').textContent).toBe('true');
    });

    act(() => {
      screen.getByTestId('enroll-btn').click();
    });

    // The API should not be called because we're already enrolled
    await waitFor(() => {
      expect(api.post).not.toHaveBeenCalled();
    });
  });

  // Test enrollInModule function - error handling
  test('should handle error when enrolling in a module', async () => {
    const mockEnrollments = [
      { id: 1, user: 1, module: 1, completed: false }
    ];

    api.get.mockResolvedValueOnce({ data: mockEnrollments });
    api.post.mockRejectedValueOnce(new Error('Failed to enroll'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create a component specifically for testing error handling
    const ErrorTestComponent = () => {
      const { enrollInModule } = useEnrollment();

      return (
        <button
          data-testid="error-enroll-btn"
          onClick={async () => {
            try {
              await enrollInModule(2);
              document.getElementById('enrollment-error-result').textContent = 'no error';
            } catch (e) {
              document.getElementById('enrollment-error-result').textContent = e.message;
            }
          }}
        >
          Try Enroll with Error
        </button>
      );
    };

    render(
      <MockAuthProvider>
        <EnrollmentContextProvider>
          <>
            <TestComponent />
            <ErrorTestComponent />
            <div id="enrollment-error-result">no result yet</div>
          </>
        </EnrollmentContextProvider>
      </MockAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-enrolled-2').textContent).toBe('false');
    });

    // Click the button that will trigger the error
    act(() => {
      screen.getByTestId('error-enroll-btn').click();
    });

    // Check that the error was caught and handled
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error enrolling in module:', expect.any(Error));
      expect(document.getElementById('enrollment-error-result').textContent).toBe('Failed to enroll in module');
      expect(screen.getByTestId('is-enrolled-2').textContent).toBe('false');
    });

    consoleSpy.mockRestore();
  });

  // Test updateModuleProgress function
  test('should update module progress successfully', async () => {
    const mockEnrollments = [
      { id: 1, user: 1, module: 1, completed: false }
    ];

    const updatedEnrollment = { id: 1, user: 1, module: 1, completed: true };

    api.get.mockResolvedValueOnce({ data: mockEnrollments });
    api.put.mockResolvedValueOnce({ data: updatedEnrollment });

    render(
      <MockAuthProvider>
        <EnrollmentContextProvider>
          <TestComponent />
        </EnrollmentContextProvider>
      </MockAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-enrolled-1').textContent).toBe('true');
    });

    act(() => {
      screen.getByTestId('update-progress-btn').click();
    });

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/api/progress-tracker/1', {
        id: 1,
        user: 1,
        module: 1,
        completed: true
      });
    });
  });

  // Test updateModuleProgress function - not enrolled
  test('should throw error when updating progress for a module not enrolled in', async () => {
    const mockEnrollments = [
      { id: 1, user: 1, module: 1, completed: false }
    ];

    api.get.mockResolvedValueOnce({ data: mockEnrollments });

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create a test component specifically for testing this error case
    const ErrorTestComponent = () => {
      const { updateModuleProgress } = useEnrollment();

      return (
        <button
          data-testid="error-btn"
          onClick={async () => {
            try {
              await updateModuleProgress(3, { completed: true });
              document.getElementById('error-result').textContent = 'no-error';
            } catch (e) {
              document.getElementById('error-result').textContent = e.message;
            }
          }}
        >
          Update Non-Enrolled Module
        </button>
      );
    };

    render(
      <MockAuthProvider>
        <EnrollmentContextProvider>
          <>
            <TestComponent />
            <ErrorTestComponent />
            <div id="error-result"></div>
          </>
        </EnrollmentContextProvider>
      </MockAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-enrolled-1').textContent).toBe('true');
    });

    act(() => {
      screen.getByTestId('error-btn').click();
    });

    await waitFor(() => {
      expect(document.getElementById('error-result').textContent).toBe('User is not enrolled in this module');
    });

    consoleSpy.mockRestore();
  });

  // Test updateModuleProgress function - error handling
  test('should handle error when updating module progress', async () => {
    const mockEnrollments = [
      { id: 1, user: 1, module: 1, completed: false }
    ];

    api.get.mockResolvedValueOnce({ data: mockEnrollments });
    api.put.mockRejectedValueOnce(new Error('Failed to update progress'));

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Create a component specifically for testing error handling
    const ProgressErrorTestComponent = () => {
      const { updateModuleProgress } = useEnrollment();

      return (
        <button
          data-testid="error-update-btn"
          onClick={async () => {
            try {
              await updateModuleProgress(1, { completed: true });
              document.getElementById('update-error-result').textContent = 'no error';
            } catch (e) {
              document.getElementById('update-error-result').textContent = e.message;
            }
          }}
        >
          Try Update with Error
        </button>
      );
    };

    render(
      <MockAuthProvider>
        <EnrollmentContextProvider>
          <>
            <TestComponent />
            <ProgressErrorTestComponent />
            <div id="update-error-result">no result yet</div>
          </>
        </EnrollmentContextProvider>
      </MockAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-enrolled-1').textContent).toBe('true');
    });

    // Click the button that will trigger the error
    act(() => {
      screen.getByTestId('error-update-btn').click();
    });

    // Check that the error was caught and handled
    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error updating module progress:', expect.any(Error));
      expect(document.getElementById('update-error-result').textContent).toBe('Failed to update module progress');
    });

    consoleSpy.mockRestore();
  });

  // Test getEnrollment function
  test('should get enrollment for a specific module', async () => {
    const mockEnrollments = [
      { id: 1, user: 1, module: 1, completed: false, pinned: true }
    ];

    api.get.mockResolvedValueOnce({ data: mockEnrollments });

    render(
      <MockAuthProvider>
        <EnrollmentContextProvider>
          <TestComponent />
        </EnrollmentContextProvider>
      </MockAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-enrolled-1').textContent).toBe('true');
    });

    act(() => {
      screen.getByTestId('get-enrollment-btn').click();
    });

    await waitFor(() => {
      const result = JSON.parse(document.getElementById('enrollment-result').textContent);
      expect(result).toEqual({ id: 1, user: 1, module: 1, completed: false, pinned: true });
    });
  });

  // Test getEnrollment function - module not enrolled
  test('should return null when getting enrollment for a module not enrolled in', async () => {
    const mockEnrollments = [
      { id: 1, user: 1, module: 1, completed: false }
    ];

    api.get.mockResolvedValueOnce({ data: mockEnrollments });

    // Create a test component specifically for testing this case
    const NonEnrolledTestComponent = () => {
      const { getEnrollment } = useEnrollment();

      return (
        <button
          data-testid="get-non-enrolled-btn"
          onClick={() => {
            const enrollment = getEnrollment(2);
            document.getElementById('non-enrolled-result').textContent =
              enrollment ? JSON.stringify(enrollment) : 'null';
          }}
        >
          Get Non-Enrolled Module
        </button>
      );
    };

    render(
      <MockAuthProvider>
        <EnrollmentContextProvider>
          <>
            <TestComponent />
            <NonEnrolledTestComponent />
            <div id="non-enrolled-result"></div>
          </>
        </EnrollmentContextProvider>
      </MockAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-enrolled-1').textContent).toBe('true');
    });

    act(() => {
      screen.getByTestId('get-non-enrolled-btn').click();
    });

    await waitFor(() => {
      expect(document.getElementById('non-enrolled-result').textContent).toBe('null');
    });
  });

  // Test completeModule function
  test('should mark a module as completed', async () => {
    const mockEnrollments = [
      { id: 1, user: 1, module: 1, completed: false }
    ];

    const updatedEnrollment = { id: 1, user: 1, module: 1, completed: true };

    api.get.mockResolvedValueOnce({ data: mockEnrollments });
    api.put.mockResolvedValueOnce({ data: updatedEnrollment });

    render(
      <MockAuthProvider>
        <EnrollmentContextProvider>
          <TestComponent />
        </EnrollmentContextProvider>
      </MockAuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('is-enrolled-1').textContent).toBe('true');
    });

    act(() => {
      screen.getByTestId('complete-module-btn').click();
    });

    await waitFor(() => {
      expect(api.put).toHaveBeenCalledWith('/api/progress-tracker/1', {
        id: 1,
        user: 1,
        module: 1,
        completed: true
      });
    });
  });
});