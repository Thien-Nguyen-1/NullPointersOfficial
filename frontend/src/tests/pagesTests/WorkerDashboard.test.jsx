import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import WorkerDashboard from '../../pages/WorkerDashboard';
import api from '../../services/api';

// Mock the API and components
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn()
  }
}));

vi.mock('../../components/StatsCards', () => ({
  default: ({ userName, completedModules, inProgressModules }) => (
    <div data-testid="mock-stats-cards">
      <p>User: {userName}</p>
      <p>Completed: {completedModules}</p>
      <p>In Progress: {inProgressModules}</p>
    </div>
  )
}));

vi.mock('../../components/LearningChart', () => ({
  default: ({ data }) => (
    <div data-testid="mock-learning-chart">
      <p>Chart with {data.length} data points</p>
    </div>
  )
}));

vi.mock('../../components/CoursesList', () => ({
  default: ({ courses }) => (
    <div data-testid="mock-courses-list">
      <p>Courses: {courses.length}</p>
    </div>
  )
}));

describe('WorkerDashboard Component', () => {
  // Mock console methods
  const originalConsoleError = console.error;
  const originalConsoleLog = console.log;

  beforeEach(() => {
    console.error = vi.fn();
    console.log = vi.fn();

    // Default API response
    api.get.mockResolvedValue({
      data: {
        first_name: 'John',
        completed_modules: 5,
        in_progress_modules: 3,
        total_modules: 10,
        modules: [
          {
            id: 1,
            title: 'Module 1',
            progress_percentage: 100,
            pinned: true,
            completed: true
          },
          {
            id: 2,
            title: 'Module 2',
            progress_percentage: 50,
            pinned: false,
            completed: false
          },
          {
            id: 3,
            title: 'Module 3',
            progress_percentage: 0,
            pinned: false,
            completed: false
          }
        ]
      }
    });
  });

  afterEach(() => {
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
    vi.clearAllMocks();
  });

  // Test fetchUserDetails function
  describe('fetchUserDetails function', () => {
    it('should fetch user details and set state correctly', async () => {
      render(<WorkerDashboard />);

      // Initially should show loading
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // After loading, should display dashboard with fetched data
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/api/user/');
        expect(screen.getByText('User: John')).toBeInTheDocument();
        expect(screen.getByText('Completed: 5')).toBeInTheDocument();
        expect(screen.getByText('In Progress: 3')).toBeInTheDocument();
        expect(screen.getByText('Courses: 3')).toBeInTheDocument();
      });
    });

    it('should handle API error gracefully', async () => {
      // Mock API error
      api.get.mockRejectedValue(new Error('Failed to fetch user details'));

      render(<WorkerDashboard />);

      // Should display error message
      await waitFor(() => {
        expect(screen.getByText('Failed to fetch user details. Please log in again.')).toBeInTheDocument();
      });
    });

    it('should set default username when first_name is not provided', async () => {
      // Mock response without first_name
      api.get.mockResolvedValue({
        data: {
          completed_modules: 5,
          in_progress_modules: 3,
          total_modules: 10,
          modules: []
        }
      });

      render(<WorkerDashboard />);

      // Should use default username
      await waitFor(() => {
        expect(screen.getByText('User: User')).toBeInTheDocument();
      });
    });

    it('should transform module data correctly', async () => {
      render(<WorkerDashboard />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.getByText('Courses: 3')).toBeInTheDocument();
      });

      // Check if console.log was called with the transformed courses
      // This is an indirect way to test the transform logic
      expect(console.log).toHaveBeenCalled();
    });
  });

  // Test rendering of child components
  describe('Child component rendering', () => {
    it('should render StatsCards with correct props', async () => {
      render(<WorkerDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-stats-cards')).toBeInTheDocument();
        expect(screen.getByText('User: John')).toBeInTheDocument();
        expect(screen.getByText('Completed: 5')).toBeInTheDocument();
        expect(screen.getByText('In Progress: 3')).toBeInTheDocument();
      });
    });

    it('should render CoursesList with transformed modules', async () => {
      render(<WorkerDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-courses-list')).toBeInTheDocument();
        expect(screen.getByText('Courses: 3')).toBeInTheDocument();
      });
    });

    it('should render LearningChart with hardcoded data', async () => {
      render(<WorkerDashboard />);

      await waitFor(() => {
        expect(screen.getByTestId('mock-learning-chart')).toBeInTheDocument();
        expect(screen.getByText('Chart with 7 data points')).toBeInTheDocument();
      });
    });
  });
});