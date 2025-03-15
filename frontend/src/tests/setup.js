import { afterEach } from 'vitest';
import {cleanup } from '@testing-library/react';
import "@testing-library/jest-dom";

afterEach (() => {
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
    observe() {}
    unobserve() {}
    disconnect() {}
  };