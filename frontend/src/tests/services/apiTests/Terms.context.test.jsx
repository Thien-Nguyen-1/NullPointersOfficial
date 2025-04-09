import React from 'react';
import { render, waitFor, screen, act } from '@testing-library/react';
import { describe, it, vi, beforeEach, expect } from 'vitest';
import { TermsContextProvider, useTerms } from '../../../services/TermsContext';
import { AuthContext } from '../../../services/AuthContext';
import api from '../../../services/api';
vi.mock('../../../services/api');

const mockUser = {
  username: '@johndoe',
  terms_accepted: false
};
const mockUpdateUser = vi.fn();
const renderWithContext = () =>
  render(
    <AuthContext.Provider value={{ user: mockUser, token: 'fake', updateUser: mockUpdateUser }}>
      <TermsContextProvider>
        <TestComponent />
      </TermsContextProvider>
    </AuthContext.Provider>
  );
const TestComponent = () => {
  const {
    showTermsModal,
    termsAccepted,
    isLoading,
    termsContent,
    loadTermsContent,
    acceptTerms,
    declineTerms
  } = useTerms();

  return (
    <div>
      <p>Terms Accepted: {termsAccepted ? 'true' : 'false'}</p>
      <p>Show Modal: {showTermsModal ? 'true' : 'false'}</p>
      <p>Is Loading: {isLoading ? 'true' : 'false'}</p>
      <p>Terms Content: {termsContent || 'none'}</p>
      <button onClick={loadTermsContent}>Load Terms</button>
      <button onClick={acceptTerms}>Accept</button>
      <button onClick={declineTerms}>Decline</button>
    </div>
  );
};

describe('TermsContextProvider', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });
  
    it('sets terms accepted as false', () => {
      renderWithContext();
      expect(screen.getByText('Terms Accepted: false')).toBeInTheDocument();
      expect(screen.getByText('Show Modal: true')).toBeInTheDocument();
      expect(screen.getByText('Is Loading: false')).toBeInTheDocument();
      expect(screen.getByText('Terms Content: none')).toBeInTheDocument();
    });
  
    it('loads terms content', async () => {
      api.get.mockResolvedValueOnce({ data: { content: 'These are the terms' } });
      renderWithContext();
      act(() => {
        screen.getByText('Load Terms').click();
      });
      expect(screen.getByText('Is Loading: true')).toBeInTheDocument();
      await waitFor(() => {
        expect(screen.getByText('Is Loading: false')).toBeInTheDocument();
        expect(screen.getByText('Terms Content: These are the terms')).toBeInTheDocument();
      });
    });

    it('catches error in loading', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        api.get.mockRejectedValueOnce(new Error('Network error'));
        renderWithContext();
        act(() => {
          screen.getByText('Load Terms').click();
        });
    
        await waitFor(() => {
          expect(consoleSpy).toHaveBeenCalledWith('Failed to load terms and conditions:', expect.any(Error));
        });
        consoleSpy.mockRestore();
      });
  
    it('accepts terms', async () => {
      api.post.mockResolvedValueOnce({});
      renderWithContext();
      act(() => {
        screen.getByText('Accept').click();
      });
  
      await waitFor(() => {
        expect(mockUpdateUser).toHaveBeenCalledWith({
          ...mockUser,
          terms_accepted: true
        });
        expect(screen.getByText('Terms Accepted: true')).toBeInTheDocument();
        expect(screen.getByText('Show Modal: false')).toBeInTheDocument();
      });
    });

    it('catches error in accepting terms', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        api.post.mockRejectedValueOnce(new Error('Post failed'));
        renderWithContext();
        act(() => {
          screen.getByText('Accept').click();
        });
    
        await waitFor(() => {
          expect(consoleSpy).toHaveBeenCalledWith('Failed to accept terms:', expect.any(Error));
          expect(screen.getByText('Terms Accepted: false')).toBeInTheDocument();
        });
    
        consoleSpy.mockRestore();
      });
  
    it('declines terms', async () => {
      renderWithContext();
      act(() => {
        screen.getByText('Decline').click();
      });
      expect(screen.getByText('Show Modal: false')).toBeInTheDocument();
    });
  

  });
  