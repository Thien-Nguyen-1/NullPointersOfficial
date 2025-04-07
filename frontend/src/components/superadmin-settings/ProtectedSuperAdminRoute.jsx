// Route protection component (specifically for superadmin-only pages)
// this prevents regular admins from accessing them

import React, { useContext, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../../services/AuthContext';

// this component checks if the user is a superadmin before rendering the protected route
const ProtectedSuperAdminRoute = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [isChecking, setIsChecking] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    // On mount or when user changes, check localStorage directly too
    const storedUser = JSON.parse(localStorage.getItem('user'));
    const superAdminCheck =
      (user && user.user_type === 'superadmin') ||
      (storedUser && storedUser.user_type === 'superadmin');

    setIsSuperAdmin(superAdminCheck);
    setIsChecking(false);
  }, [user]);

  // While checking, show nothing or a loading indicator
  if (isChecking) {
    return <div>Loading...</div>;
  }

  // After checking, if not a superadmin, redirect
  if (!isSuperAdmin) {
    return <Navigate to="/unauthorized" replace />;
  }

  // If superadmin, render the protected content
  return children;

  /* // check if user is logged in
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
  return children; */
};

export default ProtectedSuperAdminRoute;