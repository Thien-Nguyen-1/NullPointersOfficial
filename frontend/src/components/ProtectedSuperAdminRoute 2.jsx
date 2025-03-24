// Route protection component (specifically for superadmin-only pages)
// this prevents regular admins from accessing them

import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../services/AuthContext';

// this component checks if the user is a superadmin before rendering the protected route
const ProtectedSuperAdminRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  
  // check if user is logged in
  if (!user) {
    return <Navigate to="/login" replace />;
    // 'replace' is a boolean parameter for the React Router's Navigate component that determines how the navigation affects the browser history
    // use replace so that unauthorised users arent able to go back to a protected page
  }
  
  // check if user is a superadmin
  if (user.user_type !== 'superadmin') {
    return <Navigate to="/unauthorized" replace />;
    // when replace is set to true -> the current URL is replaced with the new URL so user cant use the browser's back button
    // essentially overwrites the current histroryy entry instead of adding new one
  }
  
  // If user is a superadmin, render the protected component
  return children;
};

export default ProtectedSuperAdminRoute;