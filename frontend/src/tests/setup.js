import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import "@testing-library/jest-dom";

afterEach(() => {
  cleanup();

});

console.log = vi.fn();


// mock styling implementations for JSX as it shows up in component
global.CSS = {
  supports: () => false,
  escape: () => ''
};



// mock for ResizeObserver which isn't available in jsdom
global.ResizeObserver = class ResizeObserver {
  constructor(callback) {
    this.callback = callback;
  }
  observe() { }
  unobserve() { }
  disconnect() { }
};


// mock SharedWorker Web API 
global.SharedWorker = class {
  constructor() {
    console.log("SharedWorker created");
    this.port = {
      start: vi.fn(),
      addEventListener: vi.fn(),
      postMessage: vi.fn(),
    };
  }
};


global.MockUserAuthContext = {
  token: "test-token",
  user: { id: 1, name: "Test User", user_type: "service user" }
};

global.MockAdminAuthContext = {
  token: "test-token",
  user: { id: 1, name: "Test Admin", user_type: "admin" }
};

global.SharedWorker = vi.fn().mockImplementation(() => {
  return {
    port: {
      start: vi.fn(),
      postMessage: vi.fn(),
      onmessage: vi.fn(),
    },
  };
});

vi.mock('pusher-js', () => {
  return {
    // Mock the 'subscribe' method so it doesn't do anything during tests
    subscribe: vi.fn().mockReturnValue({
      bind: vi.fn(), // Mock the 'bind' method
    }),
    // Mock the 'disconnect' method to prevent any actual WebSocket connection
    disconnect: vi.fn(),
  };
});

