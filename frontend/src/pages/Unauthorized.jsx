// Page for unauthorized access

import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../services/AuthContext';
import '../styles/Unauthorized.css';

const Unauthorized = () => {
  const { user } = useContext(AuthContext);
  
  // Determine where to redirect based on user type
  const getRedirectPath = () => {
    if (!user) return '/login';
    
    switch(user.user_type) {
      case 'admin':
        return '/admin/home';
      case 'service user':
        return '/worker/home';
      default:
        return '/';
    }
  };

  return (
    <div className="unauthorized-container">
      <div className="unauthorized-card">
        <h1>Access Denied</h1>
        <div className="icon-container">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96">
            <path fill="none" d="M0 0h24v24H0z"/>
            <path d="M12 22C6.477 22 2 17.523 2 12S6.477 2 12 2s10 4.477 10 10-4.477 10-10 10zm0-2a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm-1-5h2v2h-2v-2zm0-8h2v6h-2V7z" 
                  fill="var(--primary-green)"/>
          </svg>
        </div>
        <p className="message">You don't have permission to access this page.</p>
        <p className="details">This area is restricted to Super Administrators only.</p>
        <Link to={getRedirectPath()} className="back-button">
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized;