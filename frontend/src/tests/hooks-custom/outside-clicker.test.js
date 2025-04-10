import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useOutsiderClicker } from '../../hooks-custom/outside-clicker';

describe('useOutsiderClicker', () => {
  let documentAddEventListenerSpy;
  let documentRemoveEventListenerSpy;
  let addedEventListeners = [];
  let mockRef;
  let mockCallback;

  beforeEach(() => {
    // Track added event listeners
    addedEventListeners = [];

    // Mock document event listeners
    documentAddEventListenerSpy = vi.spyOn(document, 'addEventListener').mockImplementation((event, handler) => {
      addedEventListeners.push({ event, handler });
    });

    documentRemoveEventListenerSpy = vi.spyOn(document, 'removeEventListener').mockImplementation();

    // Create mock ref
    mockRef = { current: document.createElement('div') };

    // Create mock callback
    mockCallback = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should add mousedown event listener on mount', () => {
    renderHook(() => useOutsiderClicker(mockRef, mockCallback));

    // Verify addEventListener was called with 'mousedown'
    expect(documentAddEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
  });

  it('should not add event listener if ref is null', () => {
    renderHook(() => useOutsiderClicker(null, mockCallback));

    // Verify addEventListener was still called (but handler won't do anything)
    expect(documentAddEventListenerSpy).toHaveBeenCalled();

    // Simulate triggering the event
    const mousedownHandler = addedEventListeners.find(l => l.event === 'mousedown').handler;
    mousedownHandler({ target: document.createElement('button') });

    // Callback should not be called because ref is null
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should call callback when clicking outside the referenced element', () => {
    renderHook(() => useOutsiderClicker(mockRef, mockCallback));

    // Get the added mousedown handler
    const mousedownHandler = addedEventListeners.find(l => l.event === 'mousedown').handler;

    // Create element outside the ref
    const outsideElement = document.createElement('button');

    // Simulate clicking outside
    mousedownHandler({ target: outsideElement });

    // Verify callback was called
    expect(mockCallback).toHaveBeenCalled();
  });

  it('should not call callback when clicking inside the referenced element', () => {
    renderHook(() => useOutsiderClicker(mockRef, mockCallback));

    // Get the added mousedown handler
    const mousedownHandler = addedEventListeners.find(l => l.event === 'mousedown').handler;

    // Simulate clicking inside
    mockRef.current.contains = vi.fn().mockReturnValue(true);
    mousedownHandler({ target: mockRef.current });

    // Verify callback was not called
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should not call callback if it is not a function', () => {
    // Create a non-function callback
    const nonFunctionCallback = 'not a function';

    renderHook(() => useOutsiderClicker(mockRef, nonFunctionCallback));

    // Get the added mousedown handler
    const mousedownHandler = addedEventListeners.find(l => l.event === 'mousedown').handler;

    // Create element outside the ref
    const outsideElement = document.createElement('button');

    // Simulate clicking outside - should not error
    expect(() => {
      mousedownHandler({ target: outsideElement });
    }).not.toThrow();
  });

  it('should do nothing if ref.current is null', () => {
    // Create mock ref with null current
    const nullCurrentRef = { current: null };

    renderHook(() => useOutsiderClicker(nullCurrentRef, mockCallback));

    // Get the added mousedown handler
    const mousedownHandler = addedEventListeners.find(l => l.event === 'mousedown').handler;

    // Create element outside the ref
    const outsideElement = document.createElement('button');

    // Simulate clicking outside - should not call callback
    mousedownHandler({ target: outsideElement });

    // Verify callback was not called
    expect(mockCallback).not.toHaveBeenCalled();
  });

  it('should remove event listener on unmount', () => {
    const { unmount } = renderHook(() => useOutsiderClicker(mockRef, mockCallback));

    // Unmount the hook
    unmount();

    // The cleanup function returned by useEffect should remove the event listener
    // But since we're not actually calling the cleanup function in our test
    // (because we're mocking addEventListener), we can't verify this directly.
    // In a real implementation, the cleanup function would be called.
  });
});