// Context for SuperAdmin functionality 
// context provider that manages superadmin-specific state and operations, 
// integrated with the existing AuthContext.

import React, { createContext, useContext, useState, useEffect } from 'react';
import {AuthContext} from "../services/AuthContext";
import api from '../services/api';

// Create the context
export const SuperAdminContext = createContext();

export const SuperAdminContextProvider = ({ children }) => {  // a special prop that allows this component to wrap other components and provide them access to the shared state.

  const { user, token } = useContext(AuthContext);
  const [termsAndConditions, setTermsAndConditions] = useState('');
  const [adminUsers, setAdminUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Check if current user is a superadmin
  const isSuperAdmin = user && user.user_type === 'superadmin';

  // Fetch terms and conditions
  useEffect(() => {
    console.log('token:', localStorage.getItem('token'));

    const fetchTermsAndConditions = async () => {
      if (!token) {
        // if !isSuperAdmin, is will not run
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        // const response = await api.get('/api/terms-and-conditions/', {
        //   headers: { Authorization: `Token ${token}` }
        // });

        const response = await api.get('/api/terms-and-conditions/');

        
        // if successful, set:
        setTermsAndConditions(response.data.content || '');
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching terms and conditions:", err);
        setError("Failed to load terms and conditions");
        setIsLoading(false);
      }
    };

    if (isSuperAdmin) {
      fetchTermsAndConditions();
    } else {
      setIsLoading(false);
    }
  }, [token, isSuperAdmin]);

  // Fetch admin users (only if superadmin)
  useEffect(() => {
    console.log('token:', localStorage.getItem('token'));

    const fetchAdminUsers = async () => {
      // checks if there's a token and if the user is a superadmin
      if (!token || !isSuperAdmin) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null); // clears any previous errors
        const response = await api.get('/api/admin-users/');

        // ONLY FOR DEBUGGING
        console.log('Raw admin users response:', response);
        console.log('Admin users data:', response.data);

        // make sure each admin has the is_verified field (newly added)
        const adminsWithVerification = response.data.map(admin => {
          // if is_verified is null (for some reason...), default to false
          return {
            ...admin,
            is_verified: admin.is_verified === null? false: admin.is_verified
          };
        });
        
        setAdminUsers(adminsWithVerification || []);
        //setAdminUsers(response.data || []);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching admin users:", err);
        setError("Failed to load admin users");
        setIsLoading(false);
      }
    };

    if (isSuperAdmin) {
      fetchAdminUsers();
    }
  }, [token, isSuperAdmin]);

  // Update terms and conditions
  const updateTermsAndConditions = async (content) => {
    if (!token || !isSuperAdmin) {
      throw new Error("Unauthorized access");
    }

    try {


      const response = await api.put('/api/terms-and-conditions/', {content});
      
      setTermsAndConditions(response.data.content);
      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error updating terms and conditions:", err);
      throw new Error("Failed to update terms and conditions");
    }
  };

  // add a new admin user
  const addAdminUser = async (userData) => {
    if (!token || !isSuperAdmin) {
      throw new Error("Unauthorized access");
    }

    try {
      console.log('[DEBUG] Adding admin user with data:', userData);
      // adding user_type as admin
      const adminData = {
        ...userData,
        user_type: 'admin'
      };
      console.log('[DEBUG] Adding admin data:', adminData);


      const response = await api.post('/api/admin-users/', adminData)

      console.log('[DEBUG] Admin user creation response:', response);

      const newAdmin = response.data.user || response.data
      // update the local state with the new admin
      setAdminUsers(prev => [...prev, newAdmin]);

      // setAdminUsers([...adminUsers, response.data]);
      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error adding admin user:", err);
      throw new Error("Failed to add admin user");
    }
  };

  // Remove an admin user
  const removeAdminUser = async (userId) => {
    if (!token || !isSuperAdmin) {
      throw new Error("Unauthorized access");
    }

    console.log(`[DEBUG] About to delete admin with ID: ${userId}`)
    console.log(`[DEBUG] ID type: ${typeof userId}`)

    try {
      // Make the API call and capture the response
      const response = await api.delete(`/api/admin-users/${userId}/`);
      
      // Update the admin users list
      setAdminUsers(adminUsers.filter(admin => admin.id !== userId));
      
      // Return success with any data from the response
      return { 
        success: true,
        message: response.data?.message || "Admin user removed successfully",
        transferDetails: response.data?.transferred_items
      };
    } catch (err) {
      console.error("Error removing admin user:", err);
      console.log(`[DEBUG] Request URL:`, `/api/admin-users/${userId}/`);

      // Log error details if available
      if (err.response) {
        console.log(`[DEBUG] Error status:`, err.response.status);
        console.log(`[DEBUG] Error data:`, err.response.data);
      }

      throw new Error(err.response?.data?.error || "Failed to remove admin user");
    }
  };

  // Resend verification email to an admin user
  const resendAdminVerification = async (userId) => {
    if (!token || !isSuperAdmin) {
      throw new Error("Unauthorized access");
    }

    try {
      const response = await api.post(`/api/admin-users/${userId}/resend-verification/`);
      return { success: true, message: `Verification email resent to ${response.data.email || 'admin'}` };
    } catch (err) {
      console.error("Error resending verification:", err);
      throw new Error("Failed to resend verification email");
    }
  };

  return (
    <SuperAdminContext.Provider value={{
      isSuperAdmin,
      termsAndConditions,
      adminUsers,
      isLoading,
      error,
      updateTermsAndConditions,
      addAdminUser,
      removeAdminUser,
      resendAdminVerification
    }}>
      {children}
    </SuperAdminContext.Provider>
  );
};

// Custom hook for using the super admin context
export const useSuperAdmin = () => useContext(SuperAdminContext);