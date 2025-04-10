import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import ProtectedSuperAdminRoute from '../../../components/superadmin-settings/ProtectedSuperAdminRoute';
import { AuthContext } from '../../../services/AuthContext';

// Mock React Router's Navigate component
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    Navigate: ({ to }) => <div data-testid="navigate" data-to={to}>Redirecting...</div>
  };
});

// Mock localStorage
const mockLocalStorage = (() => {
  let store = {};
  return {
    getItem: vi.fn(key => store[key] ?? null),
    setItem: vi.fn((key, value) => {
      store[key] = value.toString();
    }),
    clear: vi.fn(() => {
      store = {};
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

describe('ProtectedSuperAdminRoute', () => {
  const TestComponent = () => <div data-testid="protected-content">Protected Content</div>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLocalStorage.clear();
  });

  // Test user checking - Happy path
  it('should render children when user is a superadmin from context', () => {
    const user = { id: 1, user_type: 'superadmin' };

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user }}>
          <ProtectedSuperAdminRoute>
            <TestComponent />
          </ProtectedSuperAdminRoute>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  // Test localStorage fallback - Branch condition
  it('should render children when user is a superadmin from localStorage', () => {
    // No user in context, but superadmin in localStorage
    const storedUser = { id: 1, user_type: 'superadmin' };
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(storedUser));

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: null }}>
          <ProtectedSuperAdminRoute>
            <TestComponent />
          </ProtectedSuperAdminRoute>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    // Verify localStorage was checked
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('user');
    expect(screen.queryByTestId('navigate')).not.toBeInTheDocument();
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
  });

  // Test redirect for non-admin users - Branch condition
  it('should redirect when user is not a superadmin', () => {
    const user = { id: 2, user_type: 'admin' };
    mockLocalStorage.getItem.mockReturnValue(null);

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user }}>
          <ProtectedSuperAdminRoute>
            <TestComponent />
          </ProtectedSuperAdminRoute>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toBeInTheDocument();
    expect(navigate.getAttribute('data-to')).toBe('/unauthorized');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

  // Test redirect for unauthenticated users - Branch condition
  it('should redirect when no user is present in context or localStorage', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    render(
      <BrowserRouter>
        <AuthContext.Provider value={{ user: null }}>
          <ProtectedSuperAdminRoute>
            <TestComponent />
          </ProtectedSuperAdminRoute>
        </AuthContext.Provider>
      </BrowserRouter>
    );

    const navigate = screen.getByTestId('navigate');
    expect(navigate).toBeInTheDocument();
    expect(navigate.getAttribute('data-to')).toBe('/unauthorized');
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });

});