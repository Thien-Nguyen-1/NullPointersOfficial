// This help to manage terms acceptance state across the app
// Provides functions to accept or decline terms
// Tracks whether a user has already accepted terms

import React, { createContext, useState, useContext, useEffect } from 'react';
import api from './api';
import { AuthContext } from './AuthContext';

export const TermsContext = createContext();

export const TermsContextProvider = ({ children }) => {
  const { user, token, updateUser } = useContext(AuthContext);
  const [termsAccepted, setTermsAccepted] = useState(true); // Default to true to prevent unnecessary prompts
  const [termsContent, setTermsContent] = useState('');
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user has accepted terms
  useEffect(() => {
    if (user) {
      // Assumes user object has a 'terms_accepted' property
      // If it doesn't, you'll need to add this to your backend !!!!!
      const hasAcceptedTerms = user.terms_accepted || false;
      setTermsAccepted(hasAcceptedTerms);
      
      // If user hasn't accepted terms, show the modal
      if (!hasAcceptedTerms) {
        setShowTermsModal(true);
      }
    }
  }, [user]);

  // Load terms and conditions content
  const loadTermsContent = async () => {
    if (!termsContent) {
      setIsLoading(true);
      try {
        const response = await api.get('/api/terms-and-conditions/');
        setTermsContent(response.data.content);
      } catch (error) {
        console.error('Failed to load terms and conditions:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Accept terms and update user record
  const acceptTerms = async () => {
    try {
      // Update user's terms acceptance status in the backend
      // This endpoint needs to be implemented on your backend
      // await api.post('/api/accept-terms/', {}, {
      //   headers: { Authorization: `Token ${token}` }
      // });

      await api.post('/api/accept-terms/', {});
      
      // Update local user state
      if (updateUser && user) {
        await updateUser({ ...user, terms_accepted: true });
      }
      
      setTermsAccepted(true);
      setShowTermsModal(false);
    } catch (error) {
      console.error('Failed to accept terms:', error);
    }
  };

  // Decline terms (logout or other actions as needed)
  const declineTerms = () => {
    // You could implement a logout here if terms are mandatory
    setShowTermsModal(false);
  };

  return (
    <TermsContext.Provider 
      value={{ 
        termsAccepted, 
        showTermsModal, 
        setShowTermsModal, 
        termsContent,
        isLoading, 
        loadTermsContent,
        acceptTerms, 
        declineTerms 
      }}
    >
      {children}
    </TermsContext.Provider>
  );
};

// Custom hook for using the terms context
export const useTerms = () => useContext(TermsContext);