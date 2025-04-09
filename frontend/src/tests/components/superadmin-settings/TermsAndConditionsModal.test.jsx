import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import TermsAndConditionsModal from '../../../components/superadmin-settings/TermsAndConditionsModal';
import api from '../../../services/api';

// Mock the API service
vi.mock('../../../services/api', () => ({
  default: {
    get: vi.fn()
  }
}));

describe('TermsAndConditionsModal', () => {
  let originalConsoleError;

  beforeEach(() => {
    // Mock console.error
    originalConsoleError = console.error;
    console.error = vi.fn();

    // Reset API mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  // Test component initialization and fetch - Happy path
  it('should fetch terms and conditions on mount', async () => {
    const termsContent = '<p>These are the terms and conditions</p>';
    api.get.mockResolvedValueOnce({ data: { content: termsContent } });

    const onAccept = vi.fn();
    const onDecline = vi.fn();

    render(
      <TermsAndConditionsModal
        onAccept={onAccept}
        onDecline={onDecline}
      />
    );

    // Should show loading initially
    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Wait for content to load
    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith('/api/terms-and-conditions/');
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Check that content was rendered
    const termsElement = document.querySelector('.terms-content > div');
    expect(termsElement.innerHTML).toBe(termsContent);

    // Both buttons should be enabled
    expect(screen.getByText('I Accept')).not.toBeDisabled();
    expect(screen.getByText('Decline')).not.toBeDisabled();
  });

  // Test accept button - Happy path
  it('should call onAccept when accept button is clicked', async () => {
    api.get.mockResolvedValueOnce({ data: { content: '<p>Terms</p>' } });

    const onAccept = vi.fn();
    const onDecline = vi.fn();

    render(
      <TermsAndConditionsModal
        onAccept={onAccept}
        onDecline={onDecline}
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Click accept button
    fireEvent.click(screen.getByText('I Accept'));
    expect(onAccept).toHaveBeenCalledTimes(1);
    expect(onDecline).not.toHaveBeenCalled();
  });

  // Test decline button - Happy path
  it('should call onDecline when decline button is clicked', async () => {
    api.get.mockResolvedValueOnce({ data: { content: '<p>Terms</p>' } });

    const onAccept = vi.fn();
    const onDecline = vi.fn();

    render(
      <TermsAndConditionsModal
        onAccept={onAccept}
        onDecline={onDecline}
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Click decline button
    fireEvent.click(screen.getByText('Decline'));
    expect(onDecline).toHaveBeenCalledTimes(1);
    expect(onAccept).not.toHaveBeenCalled();
  });

  // Test error handling - Branch condition
  it('should display error message when API call fails', async () => {
    // Mock API to reject with error
    api.get.mockRejectedValueOnce(new Error('API Error'));

    const onAccept = vi.fn();
    const onDecline = vi.fn();

    render(
      <TermsAndConditionsModal
        onAccept={onAccept}
        onDecline={onDecline}
      />
    );

    // Wait for error to be displayed
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      expect(screen.getByText('Could not load terms and conditions. Please try again later.')).toBeInTheDocument();
      expect(console.error).toHaveBeenCalled();
    });

    // Accept button should be disabled, decline should still work
    expect(screen.getByText('I Accept')).toBeDisabled();
    expect(screen.getByText('Decline')).not.toBeDisabled();
  });

  // Test loading state - Branch condition
  it('should show loading state while fetching content', () => {
    // Don't resolve the API call yet
    api.get.mockImplementationOnce(() => new Promise(() => {}));

    const onAccept = vi.fn();
    const onDecline = vi.fn();

    render(
      <TermsAndConditionsModal
        onAccept={onAccept}
        onDecline={onDecline}
      />
    );

    // Should show loading
    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(api.get).toHaveBeenCalledWith('/api/terms-and-conditions/');

    // Accept button should be disabled while loading
    expect(screen.getByText('I Accept')).toBeDisabled();
    expect(screen.getByText('Decline')).not.toBeDisabled();
  });

  // Test empty content - Edge case
  it('should handle empty terms content gracefully', async () => {
    // Mock API to return empty content
    api.get.mockResolvedValueOnce({ data: { content: '' } });

    const onAccept = vi.fn();
    const onDecline = vi.fn();

    render(
      <TermsAndConditionsModal
        onAccept={onAccept}
        onDecline={onDecline}
      />
    );

    // Wait for content to load
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Content div should be empty but present
    const termsElement = document.querySelector('.terms-content > div');
    expect(termsElement).toBeInTheDocument();
    expect(termsElement.innerHTML).toBe('');

    // Buttons should work as expected
    expect(screen.getByText('I Accept')).not.toBeDisabled();
  });

  // Test missing content property - Edge case
  it('should handle missing content property in API response', async () => {
    // Mock API to return invalid data structure
    api.get.mockResolvedValueOnce({ data: {} });

    const onAccept = vi.fn();
    const onDecline = vi.fn();

    render(
      <TermsAndConditionsModal
        onAccept={onAccept}
        onDecline={onDecline}
      />
    );

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });

    // Content div should be empty (undefined treated as empty string)
    const termsElement = document.querySelector('.terms-content > div');
    expect(termsElement).toBeInTheDocument();
    expect(termsElement.innerHTML).toBe('');
  });
});