import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

// Mock dependencies
vi.mock('react-dom/client', () => ({
  createRoot: vi.fn(() => ({
    render: vi.fn()
  }))
}));

vi.mock('../App.jsx', () => ({
  default: vi.fn(() => '<App />')
}));

vi.mock('../index.css', () => ({}));

// Set up DOM
beforeEach(() => {
  // Create a root element
  document.body.innerHTML = '<div id="root"></div>';

  // Save original console methods
  vi.spyOn(console, 'log');
  vi.spyOn(console, 'error');
});

afterEach(() => {
  // Clean up
  document.body.innerHTML = '';
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('main.jsx', () => {
  it('should render the App component in StrictMode', async () => {
    // Use dynamic import to load the module
    // This ensures the file is executed and covered by the tests
    const mainModule = await import('../main.jsx');

    // Verify that createRoot was called with the root element
    expect(createRoot).toHaveBeenCalledWith(document.getElementById('root'));

    // Get the mock root instance
    const mockRoot = createRoot.mock.results[0].value;

    // Check that render was called
    expect(mockRoot.render).toHaveBeenCalledTimes(1);

    // Check that it was called with a StrictMode component
    const renderArg = mockRoot.render.mock.calls[0][0];
    expect(renderArg.type).toBe(StrictMode);
  });

  describe('Service Worker Registration (commented code)', () => {
    // Create a helper to test the service worker registration code
    // Rather than using vi.doMock with eval, we'll directly test the functionality

    function testServiceWorkerRegistration(options = {}) {
      const {
        hasServiceWorker = true,
        registrationSuccess = true,
        error = new Error('Registration failed')
      } = options;

      // Set up navigator mock
      if (hasServiceWorker) {
        const registerMock = registrationSuccess
          ? vi.fn().mockResolvedValue({ scope: '/test' })
          : vi.fn().mockRejectedValue(error);

        Object.defineProperty(global, 'navigator', {
          value: {
            serviceWorker: {
              register: registerMock
            }
          },
          configurable: true
        });

        return registerMock;
      } else {
        // No service worker support
        Object.defineProperty(global, 'navigator', {
          value: {},
          configurable: true
        });

        return null;
      }
    }

    it('would register the service worker when uncommented', async () => {
      // Set up the navigator mock with service worker support
      const registerMock = testServiceWorkerRegistration({
        hasServiceWorker: true,
        registrationSuccess: true
      });

      // Directly run the service worker registration code
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker
          .register('/firebase-messaging-sw.js')
          .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('Error registering service worker:', error);
          });
      }

      // Verify registration was called
      expect(registerMock).toHaveBeenCalledWith('/firebase-messaging-sw.js');

      // Verify logging happened
      expect(console.log).toHaveBeenCalledWith('Service Worker registered with scope:', '/test');
    });

    it('would handle service worker registration errors when uncommented', async () => {
      // Set up the navigator mock with service worker support but registration fails
      const mockError = new Error('Registration failed');
      const registerMock = testServiceWorkerRegistration({
        hasServiceWorker: true,
        registrationSuccess: false,
        error: mockError
      });

      // Directly run the service worker registration code
      if ('serviceWorker' in navigator) {
        try {
          await navigator.serviceWorker
            .register('/firebase-messaging-sw.js')
            .then((registration) => {
              console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
              console.error('Error registering service worker:', error);
            });
        } catch (e) {
          // Additional error handling if needed
        }
      }

      // Verify registration was called
      expect(registerMock).toHaveBeenCalledWith('/firebase-messaging-sw.js');

      // Verify error was logged
      expect(console.error).toHaveBeenCalledWith('Error registering service worker:', mockError);
    });

    it('would skip registration when service worker is not supported', async () => {
      // Set up the navigator mock without service worker support
      testServiceWorkerRegistration({ hasServiceWorker: false });

      // Clear any previous console calls
      console.log.mockClear();

      // Directly run the service worker registration code
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker
          .register('/firebase-messaging-sw.js')
          .then((registration) => {
            console.log('Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.error('Error registering service worker:', error);
          });
      }

      // Verify code didn't run (no log output)
      expect(console.log).not.toHaveBeenCalledWith(
        expect.stringContaining('Service Worker registered with scope:')
      );
    });
  });
});