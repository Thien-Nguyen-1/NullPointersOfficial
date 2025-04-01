// Handles admin email verification

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/VerifyAdminEmail.module.css';

const VerifyAdminEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        // Call the verification endpoint
        const response = await axios.get(`/api/verify-admin-email/${token}/`);
        
        // Store tokens if provided
        if (response.data.tokens) {
          localStorage.setItem('token', response.data.tokens.access);
          localStorage.setItem('refreshToken', response.data.tokens.refresh);
        }
        
        setVerificationStatus('success');
        setMessage(response.data.message || 'Email verified successfully. You can now log in.');
        
        // Redirect after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setVerificationStatus('error');
        setMessage(error.response?.data?.error || 'Verification failed. Please try again or contact support.');
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="verification-container">
      <div className="verification-card">
        <h2>Email Verification</h2>
        
        {verificationStatus === 'verifying' && (
          <div className="verification-status pending">
            <div className="spinner"></div>
            <p>Verifying your email...</p>
          </div>
        )}
        
        {verificationStatus === 'success' && (
          <div className="verification-status success">
            <div className="icon-circle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" fill="#28a745"/>
              </svg>
            </div>
            <p>{message}</p>
            <p className="redirect-message">Redirecting to login page...</p>
          </div>
        )}
        
        {verificationStatus === 'error' && (
          <div className="verification-status error">
            <div className="icon-circle">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" fill="#dc3545"/>
              </svg>
            </div>
            <p>{message}</p>
            <div className="actions">
              <button onClick={() => navigate('/login')}>Go to Login</button>
              <button onClick={() => window.location.reload()}>Try Again</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyAdminEmail;