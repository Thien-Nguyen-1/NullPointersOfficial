import React, { useEffect, useState } from 'react';
import api from '../../services/api';
//import '../../styles/TermsAndConditions.css';

const TermsAndConditionsModal = ({ onAccept, onDecline }) => {
  const [termsContent, setTermsContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchTermsAndConditions = async () => {
      try {
        setIsLoading(true);
        const response = await api.get('/api/terms-and-conditions/');
        setTermsContent(response.data.content);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching terms and conditions:', err);
        setError('Could not load terms and conditions. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchTermsAndConditions();
  }, []);

  return (
    <div className="terms-modal-overlay">
      <div className="terms-modal">
        <h2>Terms and Conditions</h2>
        <div className="terms-content">
          {isLoading ? (
            <div className="loading-spinner">Loading...</div>
          ) : error ? (
            <div className="error-message">{error}</div>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: termsContent }} />
          )}
        </div>
        <div className="terms-buttons">
          <button 
            className="accept-button" 
            onClick={onAccept}
            disabled={isLoading || error}
          >
            I Accept
          </button>
          <button 
            className="decline-button" 
            onClick={onDecline}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
};

export default TermsAndConditionsModal;