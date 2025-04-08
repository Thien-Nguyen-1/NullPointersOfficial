// Handles admin email verification with improved UX

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import styles from '../../styles/VerifyAdminEmail.module.css';

const VerifyAdminEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [verificationStatus, setVerificationStatus] = useState('verifying');
  const [message, setMessage] = useState('');
  const [countdown, setCountdown] = useState(10);
  const [verificationComplete, setVerificationComplete] = useState(false);

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        console.log('Attempting to verify admin email with token:', token);

        // Use the absolute URL to the backend
        const backendUrl = 'http://localhost:8000';
        const response = await axios.get(`${backendUrl}/api/verify-admin-email/${token}/`);

        console.log('Verification response:', response.data);

        // Store tokens if provided
        if (response.data.tokens) {
          console.log('Storing tokens from verification response');
          localStorage.setItem('token', response.data.tokens.access);
          localStorage.setItem('refreshToken', response.data.tokens.refresh);
        }

        setVerificationStatus('success');
        setMessage(response.data.message || 'Email verified successfully. You can now log in.');
        setVerificationComplete(true);

      } catch (error) {
        console.error("Verification error:", error);
        console.error("Error response:", error.response?.data);

        // Even if we get an error, if it's because the token was already used
        // (which can happen if there's a race condition or multiple requests),
        // we'll still consider it a success if the response indicates "already verified"
        const errorMsg = error.response?.data?.error || '';

        if (errorMsg.includes('already verified')) {
          setVerificationStatus('success');
          setMessage('Your email is already verified. You can now log in.');
          setVerificationComplete(true);
        } else {
          setVerificationStatus('error');
          setMessage(errorMsg || 'Verification failed. Please try again or contact support.');
        }
      }
    };

    verifyEmail();
  }, [token]);

  // Countdown effect
  useEffect(() => {
    if (verificationComplete && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);

      return () => clearTimeout(timer);
    } else if (verificationComplete && countdown === 0) {
      navigate('/login');
    }
  }, [verificationComplete, countdown, navigate]);

  return (
    <div className={styles.admin_verify_container}>
      <div className={styles.admin_verify_card}>
        {verificationStatus === 'verifying' && (
          <>
            <h1>Verifying Your Email</h1>
            <div className={styles.admin_verify_icon_container}>
              <div className={styles.admin_verify_spinner}></div>
            </div>
            <p className={styles.admin_verify_message}>Please wait while we confirm your account...</p>
            <p className={styles.admin_verify_details}>This will only take a moment.</p>
          </>
        )}

        {verificationStatus === 'success' && (
          <>
            <h1>Email Verified</h1>
            <div className={styles.admin_verify_icon_container}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1.177-7.86l-2.765-2.767L7 12.431l3.823 3.827L18 8.83l-1.06-1.06-6.117 6.37z"
                      fill="#28a745"/>
              </svg>
            </div>
            <p className={styles.admin_verify_message}>{message}</p>
            <p className={styles.admin_verify_details}>
              Redirecting to login page in <span className={styles.admin_verify_countdown}>{countdown}</span> seconds
            </p>
            <div className={styles.admin_verify_progress_container}>
              <div className={styles.admin_verify_progress_bar}>
                <div
                  className={styles.admin_verify_progress}
                  style={{ width: `${(countdown / 10) * 100}%` }}
                ></div>
              </div>
            </div>
            <Link to="/login" className={styles.admin_verify_action_button}>
              Log in now
            </Link>
          </>
        )}

        {verificationStatus === 'error' && (
          <div className={styles.admin_verify_error}>
            <h1>Verification Failed</h1>
            <div className={styles.admin_verify_icon_container}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96">
                <path fill="none" d="M0 0h24v24H0z"/>
                <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm-1-7v2h2v-2h-2zm0-8v6h2V7h-2z"
                      fill="#dc3545"/>
              </svg>
            </div>
            <p className={styles.admin_verify_message}>{message}</p>
            <p className={styles.admin_verify_details}>
              There was a problem with your verification. Please try again or contact support.
            </p>
            <div className={styles.admin_verify_button_group}>
              <Link to="/login" className={styles.admin_verify_action_button}>
                Go to Login
              </Link>
              <button onClick={() => window.location.reload()} className={styles.admin_verify_secondary_button}>
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyAdminEmail;