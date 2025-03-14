// Context for SuperAdmin functionality 
// context provider that manages superadmin-specific state and operations, 
// integrated with the existing AuthContext.

import React, { createContext, useContext, useState, useEffect } from 'react';
import {AuthContext} from "./AuthContext";
import api from './api';

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
    const fetchTermsAndConditions = async () => {
      if (!token) {
        // if !isSuperAdmin, is will not run
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get('/api/terms-and-conditions/', {
          headers: { Authorization: `Token ${token}` }
        });
        
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
    const fetchAdminUsers = async () => {
      if (!token || !isSuperAdmin) {
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get('/api/admin-users/', {
          headers: { Authorization: `Token ${token}` }
        });
        
        setAdminUsers(response.data || []);
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
      const response = await api.put('/api/terms-and-conditions/', {
        content
      }, {
        headers: { Authorization: `Token ${token}` }
      });
      
      setTermsAndConditions(response.data.content);
      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error updating terms and conditions:", err);
      throw new Error("Failed to update terms and conditions");
    }
  };

  // Add a new admin user
  const addAdminUser = async (userData) => {
    if (!token || !isSuperAdmin) {
      throw new Error("Unauthorized access");
    }

    try {
      // Adding user_type as admin
      const adminData = {
        ...userData,
        user_type: 'admin'
      };

      const response = await api.post('/api/admin-users/', adminData, {
        headers: { Authorization: `Token ${token}` }
      });
      
      setAdminUsers([...adminUsers, response.data]);
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

    try {
      await api.delete(`/api/admin-users/${userId}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      
      setAdminUsers(adminUsers.filter(admin => admin.id !== userId));
      return { success: true };
    } catch (err) {
      console.error("Error removing admin user:", err);
      throw new Error("Failed to remove admin user");
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
      removeAdminUser
    }}>
      {children}
    </SuperAdminContext.Provider>
  );
};

// Custom hook for using the super admin context
export const useSuperAdmin = () => useContext(SuperAdminContext);