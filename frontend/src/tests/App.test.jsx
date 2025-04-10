import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import App from '../App';

// Mock the Router component in App
vi.mock('react-router-dom', () => {
  const actual = vi.importActual('react-router-dom');
  return {
    ...actual,
    BrowserRouter: ({ children }) => <div data-testid="browser-router">{children}</div>,
    Routes: ({ children }) => {
      // Create a unique ID for each Routes component
      const id = Math.random().toString(36).substring(7);
      return <div data-testid={`routes-${id}`} className="routes">{children}</div>;
    },
    Route: ({ path, element }) => (
      <div data-testid={`route-${path?.replace(/\//g, '-')?.replace(/:/g, '')?.replace('*', 'wildcard')}`}>
        {element}
      </div>
    ),
    Navigate: () => <div data-testid="navigate">Navigate</div>,
    useLocation: () => ({ pathname: '/' }),
    useParams: () => ({})
  };
});

// Mock all the components used in the App
vi.mock('../components/DashboardLayout', () => ({
  default: ({ children }) => <div data-testid="dashboard-layout">{children}</div>
}));

vi.mock('../hooks-custom/useSessionTimeout', () => ({
  useSessionTimeout: vi.fn(() => ({ isInactive: false, resetTimeout: vi.fn() }))
}));

vi.mock('../hooks-custom/useSessionManager', () => ({
  SessionManager: () => <div data-testid="session-manager">Session Manager</div>
}));

vi.mock('react-dnd', () => ({
  DndProvider: ({ children }) => <div data-testid="dnd-provider">{children}</div>
}));

vi.mock('../components/auth/Login', () => ({
  default: () => <div data-testid="login-page">Login Page</div>
}));

vi.mock('../components/auth/SignUp', () => ({
  default: () => <div data-testid="signup-page">Signup Page</div>
}));

vi.mock('../components/auth/Welcome', () => ({
  default: () => <div data-testid="welcome-page">Welcome Page</div>
}));

vi.mock('../components/auth/PasswordReset', () => ({
  default: () => <div data-testid="password-reset-page">Password Reset Page</div>
}));

vi.mock('../components/auth/RequestPasswordReset', () => ({
  default: () => <div data-testid="request-password-reset-page">Request Password Reset Page</div>
}));

vi.mock('../components/auth/VerifyEmail', () => ({
  default: () => <div data-testid="verify-email-page">Verify Email Page</div>
}));

vi.mock('../components/admin/VerifyAdminEmail', () => ({
  default: () => <div data-testid="verify-admin-email-page">Verify Admin Email Page</div>
}));

vi.mock('../pages/AdminDashboard', () => ({
  default: () => <div data-testid="admin-dashboard-page">Admin Dashboard Page</div>
}));

vi.mock('../pages/WorkerDashboard', () => ({
  default: () => <div data-testid="worker-dashboard-page">Worker Dashboard Page</div>
}));

vi.mock('../pages/Settings', () => ({
  default: () => <div data-testid="settings-page">Settings Page</div>
}));

vi.mock('../pages/Courses', () => ({
  default: () => <div data-testid="courses-page">Courses Page</div>
}));

vi.mock('../pages/CoursesList', () => ({
  default: (props) => <div data-testid="courses-list-page">Courses List Page (Role: {props.role})</div>
}));

vi.mock('../components/Questionnaire', () => ({
  default: () => <div data-testid="questionnaire-page">Questionnaire Page</div>
}));

vi.mock('../pages/SuperAdminSettings', () => ({
  default: () => <div data-testid="superadmin-settings-page">Super Admin Settings Page</div>
}));

vi.mock('../pages/Unauthorized', () => ({
  default: () => <div data-testid="unauthorized-page">Unauthorized Page</div>
}));

vi.mock('../components/ModuleViewAlternative', () => ({
  default: () => <div data-testid="module-view-page">Module View Page</div>
}));

vi.mock('../pages/Messaging', () => ({
  default: () => <div data-testid="messaging-page">Messaging Page</div>
}));

vi.mock('../pages/ServiceUsersPage', () => ({
  default: () => <div data-testid="service-users-page">Service Users Page</div>
}));

vi.mock('../components/quizzes/QuizContainer', () => ({
  default: () => <div data-testid="quiz-container-page">Quiz Container Page</div>
}));

vi.mock('../pages/AddModule', () => ({
  default: () => <div data-testid="add-module-page">Add Module Page</div>
}));

vi.mock('../pages/questionnaire-admin', () => ({
  default: () => <div data-testid="questionnaire-admin-page">Questionnaire Admin Page</div>
}));

vi.mock('../overlays/notifications', () => ({
  default: () => <div data-testid="notification-overlay">Notification Overlay</div>
}));

vi.mock('../components/superadmin-settings/ProtectedSuperAdminRoute', () => ({
  default: ({ children }) => <div data-testid="protected-superadmin-route">{children}</div>
}));

// Mock context providers
vi.mock('../services/AuthContext.jsx', () => ({
  AuthContext: {
    Provider: ({ children }) => <div data-testid="auth-context-provider">{children}</div>,
    Consumer: ({ children }) => children({ isAuthenticated: true, userRole: 'admin' })
  },
  AuthContextProvider: ({ children }) => <div data-testid="auth-context-provider">{children}</div>
}));

vi.mock('../services/EnrollmentContext', () => ({
  EnrollmentContextProvider: ({ children }) => <div data-testid="enrollment-context-provider">{children}</div>
}));

vi.mock('../contexts/SuperAdminContext.jsx', () => ({
  SuperAdminContextProvider: ({ children }) => <div data-testid="superadmin-context-provider">{children}</div>
}));

vi.mock('../services/PreviewModeContext.jsx', () => ({
  PreviewModeProvider: ({ children }) => <div data-testid="preview-mode-provider">{children}</div>
}));

describe('App Component', () => {
  it('should render the app with all context providers', () => {
    const { container } = render(<App />);

    // Check context providers are rendered
    expect(screen.getByTestId('auth-context-provider')).toBeInTheDocument();
    expect(screen.getByTestId('superadmin-context-provider')).toBeInTheDocument();
    expect(screen.getByTestId('preview-mode-provider')).toBeInTheDocument();
    expect(screen.getByTestId('enrollment-context-provider')).toBeInTheDocument();

    // Check router structure
    expect(screen.getByTestId('browser-router')).toBeInTheDocument();
    const routesElements = container.querySelectorAll('.routes');
    expect(routesElements.length).toBeGreaterThan(0);

    // Check that notification overlay is rendered
    expect(screen.getByTestId('notification-overlay')).toBeInTheDocument();
  });

  it('should render key components within the application', () => {
    const { container } = render(<App />);

    // Check for the presence of important components
    expect(screen.getByTestId('welcome-page')).toBeInTheDocument();
    expect(screen.getByTestId('notification-overlay')).toBeInTheDocument();

    // Verify that the application has login, dashboard and other key routes
    // by checking for their mocked components in the DOM
    const dashboardLayout = container.querySelector('[data-testid="dashboard-layout"]');
    expect(dashboardLayout).not.toBeNull();

    // Verify DndProvider is present in the DOM
    const dndProvider = container.querySelector('[data-testid="dnd-provider"]');
    expect(dndProvider).not.toBeNull();

    // Verify protected routes
    const protectedRoute = container.querySelector('[data-testid="protected-superadmin-route"]');
    expect(protectedRoute).not.toBeNull();
  });
});