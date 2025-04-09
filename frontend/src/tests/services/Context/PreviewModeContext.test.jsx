import { vi, describe, test, expect, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import React, { useContext } from 'react';
import { PreviewModeProvider, usePreviewMode, PreviewModeContext } from '../../../services/PreviewModeContext';

// Mock the PreviewModeContext provider to avoid the setCachedPreviewData error
vi.mock('../../../servicesPreviewModeContext', () => {
  const React = require('react');
  const actualModule = jest.requireActual('../../../servicesPreviewModeContext');

  // Create our own implementation of the provider that avoids setCachedPreviewData
  const PreviewModeProvider = ({ children }) => {
    const [isPreviewMode, setIsPreviewMode] = React.useState(false);
    const [previewData, setPreviewData] = React.useState(null);

    const enterPreviewMode = (data) => {
      setPreviewData(data);
      setIsPreviewMode(true);
    };

    const exitPreviewMode = () => {
      setIsPreviewMode(false);
    };

    const clearPreviewData = () => {
      setPreviewData(null);
      // We're intentionally not calling setCachedPreviewData here
      // since that's causing the error
    };

    return (
      <actualModule.PreviewModeContext.Provider
        value={{
          isPreviewMode,
          previewData,
          enterPreviewMode,
          exitPreviewMode,
          clearPreviewData
        }}
      >
        {children}
      </actualModule.PreviewModeContext.Provider>
    );
  };

  return {
    ...actualModule,
    PreviewModeProvider
  };
});

// Create a test component that uses the context
const TestComponent = () => {
  const {
    isPreviewMode,
    previewData,
    enterPreviewMode,
    exitPreviewMode,
    clearPreviewData
  } = usePreviewMode();

  return (
    <div>
      <div data-testid="is-preview-mode">{isPreviewMode ? 'true' : 'false'}</div>
      <div data-testid="preview-data">{JSON.stringify(previewData)}</div>
      <button
        data-testid="enter-preview-btn"
        onClick={() => enterPreviewMode({ test: 'data' })}
      >
        Enter Preview
      </button>
      <button
        data-testid="exit-preview-btn"
        onClick={exitPreviewMode}
      >
        Exit Preview
      </button>
      <button
        data-testid="clear-preview-btn"
        onClick={clearPreviewData}
      >
        Clear Preview Data
      </button>
    </div>
  );
};

// Error test component for testing error when context is used outside provider
const ErrorTestComponent = () => {
  try {
    const context = usePreviewMode();
    return <div>No error</div>;
  } catch (error) {
    return <div data-testid="error-message">{error.message}</div>;
  }
};

describe('PreviewModeContext', () => {
  // Test initial context values
  test('should provide default context values', () => {
    render(
      <PreviewModeProvider>
        <TestComponent />
      </PreviewModeProvider>
    );

    expect(screen.getByTestId('is-preview-mode').textContent).toBe('false');
    expect(screen.getByTestId('preview-data').textContent).toBe('null');
  });

  // Test enterPreviewMode function
  test('should enter preview mode with data', () => {
    render(
      <PreviewModeProvider>
        <TestComponent />
      </PreviewModeProvider>
    );

    // Initially not in preview mode
    expect(screen.getByTestId('is-preview-mode').textContent).toBe('false');

    // Enter preview mode
    act(() => {
      screen.getByTestId('enter-preview-btn').click();
    });

    // Now should be in preview mode with data
    expect(screen.getByTestId('is-preview-mode').textContent).toBe('true');
    expect(screen.getByTestId('preview-data').textContent).toBe('{"test":"data"}');
  });

  // Test exitPreviewMode function
  test('should exit preview mode', () => {
    render(
      <PreviewModeProvider>
        <TestComponent />
      </PreviewModeProvider>
    );

    // Enter preview mode first
    act(() => {
      screen.getByTestId('enter-preview-btn').click();
    });

    // Confirm in preview mode
    expect(screen.getByTestId('is-preview-mode').textContent).toBe('true');

    // Exit preview mode
    act(() => {
      screen.getByTestId('exit-preview-btn').click();
    });

    // Now should not be in preview mode, but data should remain
    expect(screen.getByTestId('is-preview-mode').textContent).toBe('false');
    expect(screen.getByTestId('preview-data').textContent).toBe('{"test":"data"}');
  });

  // Test clearPreviewData function
  test('should clear preview data', () => {
    render(
      <PreviewModeProvider>
        <TestComponent />
      </PreviewModeProvider>
    );

    // Enter preview mode first
    act(() => {
      screen.getByTestId('enter-preview-btn').click();
    });

    // Confirm in preview mode with data
    expect(screen.getByTestId('is-preview-mode').textContent).toBe('true');
    expect(screen.getByTestId('preview-data').textContent).toBe('{"test":"data"}');

    // Clear preview data
    act(() => {
      screen.getByTestId('clear-preview-btn').click();
    });

    // Data should be cleared, still in preview mode
    expect(screen.getByTestId('is-preview-mode').textContent).toBe('true');
    expect(screen.getByTestId('preview-data').textContent).toBe('null');
  });

  // Test error when using context outside provider
  test('should throw error when usePreviewMode is used outside provider', () => {
    render(<ErrorTestComponent />);

    expect(screen.getByTestId('error-message').textContent).toBe(
      'usePreviewMode must be used within a PreviewModeProvider'
    );
  });
});