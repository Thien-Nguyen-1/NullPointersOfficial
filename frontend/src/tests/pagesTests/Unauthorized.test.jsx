// Import test utilities
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Unauthorized from '../../pages/Unauthorized';
import { AuthContext } from '../../services/AuthContext';

// Properly mock the useContext hook
vi.mock('react', async () => {
  const actual = await vi.importActual('react');
  return {
    ...actual,
    useContext: vi.fn()
  };
});

import { useContext } from 'react';

describe('Unauthorized Component', () => {
  beforeEach(() => {
    // Reset the mock before each test
    vi.clearAllMocks();
  });

  // Test rendering
  it('should render the unauthorized message', () => {
    // Mock the useContext return value for this test
    useContext.mockReturnValue({ user: null });

    render(
      <BrowserRouter>
        <Unauthorized />
      </BrowserRouter>
    );

    expect(screen.getByText('Access Denied')).toBeInTheDocument();
    expect(screen.getByText("You don't have permission to access this page.")).toBeInTheDocument();
    expect(screen.getByText('This area is restricted to Super Administrators only.')).toBeInTheDocument();
    expect(screen.getByText('Return to Dashboard')).toBeInTheDocument();
  });

  // Test getRedirectPath function for logged out user
  it('should redirect to login page when user is not logged in', () => {
    // Mock the useContext return value for this test
    useContext.mockReturnValue({ user: null });

    render(
      <BrowserRouter>
        <Unauthorized />
      </BrowserRouter>
    );

    const link = screen.getByText('Return to Dashboard');
    expect(link.getAttribute('href')).toBe('/login');
  });

  // Test getRedirectPath function for admin user
  it('should redirect to admin home for admin users', () => {
    // Mock the useContext return value for this test
    useContext.mockReturnValue({ user: { user_type: 'admin' } });

    render(
      <BrowserRouter>
        <Unauthorized />
      </BrowserRouter>
    );

    const link = screen.getByText('Return to Dashboard');
    expect(link.getAttribute('href')).toBe('/admin/home');
  });

  // Test getRedirectPath function for service user
  it('should redirect to worker home for service users', () => {
    // Mock the useContext return value for this test
    useContext.mockReturnValue({ user: { user_type: 'service user' } });

    render(
      <BrowserRouter>
        <Unauthorized />
      </BrowserRouter>
    );

    const link = screen.getByText('Return to Dashboard');
    expect(link.getAttribute('href')).toBe('/worker/home');
  });

  // Test getRedirectPath function for unknown user type
  it('should redirect to root for unknown user types', () => {
    // Mock the useContext return value for this test
    useContext.mockReturnValue({ user: { user_type: 'unknown' } });

    render(
      <BrowserRouter>
        <Unauthorized />
      </BrowserRouter>
    );

    const link = screen.getByText('Return to Dashboard');
    expect(link.getAttribute('href')).toBe('/');
  });
});