// Import test utilities
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import CoursesList from '../../pages/CoursesList';
import api from '../../services/api';
import { AuthContext } from '../../services/AuthContext';

// Mock React Router's useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock API
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

// Mock EnrollmentModal component
vi.mock('../../components/EnrollmentModal', () => ({
  default: ({ isOpen, onClose, module, onEnroll }) => isOpen ? (
    <div data-testid="enrollment-modal">
      <h3>{module?.title}</h3>
      <button data-testid="close-modal" onClick={onClose}>Close</button>
      <button data-testid="enroll-button" onClick={() => onEnroll(module?.id)}>Enroll</button>
    </div>
  ) : null
}));

describe('CoursesList Component', () => {
  // Setup mock data
  const mockCourses = [
    {
      id: 1,
      title: 'Course 1',
      description: 'Description 1',
      created_at: '2023-01-01T00:00:00Z',
      tags: [1, 2]
    },
    {
      id: 2,
      title: 'Course 2',
      description: 'Description 2',
      created_at: '2023-02-01T00:00:00Z',
      tags: [2]
    }
  ];

  const mockTags = [
    { id: 1, tag: 'Tag 1' },
    { id: 2, tag: 'Tag 2' }
  ];

  const mockUser = { id: 1, name: 'Test User' };
  const mockToken = 'test-token';

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks();

    // Setup API responses
    api.get.mockImplementation((url) => {
      if (url === '/api/modules/') {
        return Promise.resolve({ data: mockCourses });
      } else if (url === '/api/tags/') {
        return Promise.resolve({ data: mockTags });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    api.post.mockResolvedValue({});

    // Mock console methods
    console.error = vi.fn();
    console.log = vi.fn();
    window.alert = vi.fn();
  });

  const renderWithContext = (ui, { user = mockUser, token = mockToken, role = 'worker' } = {}) => {
    return render(
      <AuthContext.Provider value={{ user, token }}>
        <BrowserRouter>
          {ui}
        </BrowserRouter>
      </AuthContext.Provider>
    );
  };

  // Test fetchCourses function
  describe('fetchCourses function', () => {
    it('should fetch and display courses when component mounts', async () => {
      renderWithContext(<CoursesList role="worker" />);

      // Initially shows loading
      expect(screen.getByText('Loading courses...')).toBeInTheDocument();

      // After loading completes
      await waitFor(() => {
        expect(screen.getByText('Course 1')).toBeInTheDocument();
        expect(screen.getByText('Course 2')).toBeInTheDocument();
      });

      // API calls were made
      expect(api.get).toHaveBeenCalledWith('/api/modules/');
      expect(api.get).toHaveBeenCalledWith('/api/tags/');
    });

    it('should handle error when fetching courses fails', async () => {
      // Mock API error
      api.get.mockImplementation((url) => {
        if (url === '/api/modules/') {
          return Promise.reject(new Error('Failed to fetch courses'));
        }
        return Promise.resolve({ data: [] });
      });

      renderWithContext(<CoursesList role="worker" />);

      // Error state should be displayed
      await waitFor(() => {
        expect(screen.getByText('Failed to load courses. Please try again later.')).toBeInTheDocument();
        expect(screen.getByText('Retry')).toBeInTheDocument();
      });

      // Error was logged
      expect(console.error).toHaveBeenCalledWith('Error fetching courses:', expect.any(Error));
    });

    it('should handle empty courses array', async () => {
      // Mock empty courses response
      api.get.mockImplementation((url) => {
        if (url === '/api/modules/') {
          return Promise.resolve({ data: [] });
        } else if (url === '/api/tags/') {
          return Promise.resolve({ data: [] });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderWithContext(<CoursesList role="worker" />);

      // Should show empty state
      await waitFor(() => {
        expect(screen.getByText('No courses available yet.')).toBeInTheDocument();
      });
    });
  });

  // Test handleEnroll function
  describe('handleEnroll function', () => {
    it('should enroll user in course and navigate to module view', async () => {
      renderWithContext(<CoursesList role="worker" />);

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Course 2')).toBeInTheDocument();
      });

      // Click View Course button for first course (which is Course 2 due to sorting)
      const viewButton = screen.getAllByText('View Course')[0];
      fireEvent.click(viewButton);

      // Enrollment modal should open
      expect(screen.getByTestId('enrollment-modal')).toBeInTheDocument();

      // Click Enroll button
      const enrollButton = screen.getByTestId('enroll-button');
      fireEvent.click(enrollButton);

      // API should be called with correct data
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith(
          '/api/progress-tracker/',
          {
            user: 1,
            module: 2, // The first course shown is Course 2
            completed: false,
            pinned: false,
            hasLiked: false
          },
          { headers: { Authorization: 'Token test-token' } }
        );
      });

      // Should navigate to module page
      expect(mockNavigate).toHaveBeenCalledWith('/modules/2');
    });

    it('should handle error when enrollment fails', async () => {
      // Mock API error
      api.post.mockRejectedValue(new Error('Enrollment failed'));

      renderWithContext(<CoursesList role="worker" />);

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Course 1')).toBeInTheDocument();
      });

      // Click View Course button
      const viewButton = screen.getAllByText('View Course')[0];
      fireEvent.click(viewButton);

      // Click Enroll button
      const enrollButton = screen.getByTestId('enroll-button');
      fireEvent.click(enrollButton);

      // Should show error
      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith('Error enrolling in course:', expect.any(Error));
        expect(window.alert).toHaveBeenCalledWith('Failed to enroll in course. Please try again later.');
      });
    });
  });

  // Test handleViewCourse function
  describe('handleViewCourse function', () => {
    it('should navigate directly to module view for admin role', async () => {
      renderWithContext(<CoursesList role="admin" />);

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Course 1')).toBeInTheDocument();
      });

      // Click View Course button
      const viewButton = screen.getAllByText('View Course')[0];
      fireEvent.click(viewButton);

      // Should navigate directly without showing modal
      expect(mockNavigate).toHaveBeenCalledWith('/modules/2');
      expect(screen.queryByTestId('enrollment-modal')).not.toBeInTheDocument();
    });

    it('should open enrollment modal for worker role', async () => {
      renderWithContext(<CoursesList role="worker" />);

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Course 1')).toBeInTheDocument();
      });

      // Click View Course button
      const viewButton = screen.getAllByText('View Course')[0];
      fireEvent.click(viewButton);

      // Should open enrollment modal
      expect(screen.getByTestId('enrollment-modal')).toBeInTheDocument();
      expect(screen.getByText('Course 1')).toBeInTheDocument();
    });

    it('should close enrollment modal when close button is clicked', async () => {
      renderWithContext(<CoursesList role="worker" />);

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Course 1')).toBeInTheDocument();
      });

      // Open modal
      const viewButton = screen.getAllByText('View Course')[0];
      fireEvent.click(viewButton);

      // Modal should be open
      expect(screen.getByTestId('enrollment-modal')).toBeInTheDocument();

      // Close modal
      const closeButton = screen.getByTestId('close-modal');
      fireEvent.click(closeButton);

      // Modal should be closed
      expect(screen.queryByTestId('enrollment-modal')).not.toBeInTheDocument();
    });
  });

  // Test handleSortChange function
  describe('handleSortChange function', () => {
    it('should sort courses by newest first (default)', async () => {
      renderWithContext(<CoursesList role="worker" />);

      // Wait for courses to load and check default order
      await waitFor(() => {
        const courseTitles = screen.getAllByText(/Course \d/);
        // By default "newest first", so Course 2 should be first
        expect(courseTitles[0].textContent).toBe('Course 2');
        expect(courseTitles[1].textContent).toBe('Course 1');
      });
    });

    it('should sort courses by oldest first', async () => {
      renderWithContext(<CoursesList role="worker" />);

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Course 1')).toBeInTheDocument();
      });

      // Click "Oldest" sort button
      const oldestButton = screen.getByText('Oldest');
      fireEvent.click(oldestButton);

      // Check order (Course 1 should now be first)
      const courseTitles = screen.getAllByText(/Course \d/);
      expect(courseTitles[0].textContent).toBe('Course 1');
      expect(courseTitles[1].textContent).toBe('Course 2');
    });

    it('should sort courses by title', async () => {
      // Mock courses with non-alphabetical order
      api.get.mockImplementation((url) => {
        if (url === '/api/modules/') {
          return Promise.resolve({
            data: [
              { id: 1, title: 'Z Course', description: 'Z Description', created_at: '2023-01-01T00:00:00Z', tags: [] },
              { id: 2, title: 'A Course', description: 'A Description', created_at: '2023-02-01T00:00:00Z', tags: [] }
            ]
          });
        } else if (url === '/api/tags/') {
          return Promise.resolve({ data: [] });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderWithContext(<CoursesList role="worker" />);

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('A Course')).toBeInTheDocument();
        expect(screen.getByText('Z Course')).toBeInTheDocument();
      });

      // By default "newest first", so "A Course" (newer) is first
      let courseTitles = screen.getAllByText(/[AZ] Course/);
      expect(courseTitles[0].textContent).toBe('A Course');

      // Click "Title" sort button
      const titleButton = screen.getByText('Title');
      fireEvent.click(titleButton);

      // Check order (alphabetical, so A then Z)
      courseTitles = screen.getAllByText(/[AZ] Course/);
      expect(courseTitles[0].textContent).toBe('A Course');
      expect(courseTitles[1].textContent).toBe('Z Course');
    });
  });

  // Test tag filtering
  describe('Tag filtering', () => {
    it('should filter courses by selected tag', async () => {
      renderWithContext(<CoursesList role="worker" />);

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Course 1')).toBeInTheDocument();
        expect(screen.getByText('Course 2')).toBeInTheDocument();
      });

      // Click on "Tag 1" filter - use within to target only the button, not the tag span
      const tag1Button = screen.getByText('Tag 1', { selector: 'button' });
      fireEvent.click(tag1Button);

      // Only Course 1 should be visible (has Tag 1)
      expect(screen.getByText('Course 1')).toBeInTheDocument();
      expect(screen.queryByText('Course 2')).not.toBeInTheDocument();
    });

    it('should display message when no courses match selected tag', async () => {
      // Mock data with a tag that has no courses
      api.get.mockImplementation((url) => {
        if (url === '/api/modules/') {
          return Promise.resolve({
            data: [{ id: 1, title: 'Course 1', description: 'Description 1', created_at: '2023-01-01T00:00:00Z', tags: [1] }]
          });
        } else if (url === '/api/tags/') {
          return Promise.resolve({
            data: [
              { id: 1, tag: 'Tag 1' },
              { id: 2, tag: 'Tag 2' }, // No courses have this tag
            ]
          });
        }
        return Promise.reject(new Error('Unknown URL'));
      });

      renderWithContext(<CoursesList role="worker" />);

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Course 1')).toBeInTheDocument();
      });

      // Click on "Tag 2" filter
      const tag2Button = screen.getByText('Tag 2');
      fireEvent.click(tag2Button);

      // No courses message should be displayed
      expect(screen.getByText('No courses found for the selected tag.')).toBeInTheDocument();
    });

    it('should reset filter when All button is clicked', async () => {
      renderWithContext(<CoursesList role="worker" />);

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Course 1')).toBeInTheDocument();
        expect(screen.getByText('Course 2')).toBeInTheDocument();
      });

      // Click on "Tag 1" filter - use within to target only the button, not the tag span
      const tag1Button = screen.getByText('Tag 1', { selector: 'button' });
      fireEvent.click(tag1Button);

      // Only Course 1 should be visible
      expect(screen.getByText('Course 1')).toBeInTheDocument();
      expect(screen.queryByText('Course 2')).not.toBeInTheDocument();

      // Click "All" button
      const allButton = screen.getByText('All');
      fireEvent.click(allButton);

      // Both courses should be visible again
      expect(screen.getByText('Course 1')).toBeInTheDocument();
      expect(screen.getByText('Course 2')).toBeInTheDocument();
    });
  });

  // Test admin features
  describe('Admin-specific features', () => {
    it('should display Create Module button for admin role', async () => {
      renderWithContext(<CoursesList role="admin" />);

      // Admin should see Create Module button
      expect(screen.getByText('Create Module')).toBeInTheDocument();
    });

    it('should display Edit buttons for admin role', async () => {
      renderWithContext(<CoursesList role="admin" />);

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Course 1')).toBeInTheDocument();
      });

      // Admin should see Edit buttons
      const editButtons = screen.getAllByText('Edit');
      expect(editButtons.length).toBe(2);

      // Edit links should have correct URLs
      expect(editButtons[0].closest('a').getAttribute('href')).toBe('/admin/all-courses/create-and-manage-module?edit=2');
    });

    it('should not display admin features for worker role', async () => {
      renderWithContext(<CoursesList role="worker" />);

      // Worker should not see Create Module button
      expect(screen.queryByText('Create Module')).not.toBeInTheDocument();

      // Wait for courses to load
      await waitFor(() => {
        expect(screen.getByText('Course 1')).toBeInTheDocument();
      });

      // Worker should not see Edit buttons
      expect(screen.queryByText('Edit')).not.toBeInTheDocument();
    });
  });
});