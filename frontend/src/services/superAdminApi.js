// API functions for SuperAdmin

import api from './api';

/**
 * API functions for SuperAdmin operations
 */
export const superAdminApi = {
  // Terms and Conditions functions
  getTermsAndConditions: async (token) => {
    try {
      const response = await api.get('/api/terms-and-conditions/', {
        headers: { Authorization: `Token ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching terms and conditions:', error);
      throw error;
    }
  },
  
  updateTermsAndConditions: async (content, token) => {
    try {
      const response = await api.put('/api/terms-and-conditions/', { content }, {
        headers: { Authorization: `Token ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating terms and conditions:', error);
      throw error;
    }
  },
  
  // Admin User Management functions
  getAdminUsers: async (token) => {
    try {
      const response = await api.get('/api/admin-users/', {
        headers: { Authorization: `Token ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching admin users:', error);
      throw error;
    }
  },
  
  createAdminUser: async (userData, token) => {
    try {
      // Ensure user_type is set to 'admin'
      const adminData = {
        ...userData,
        user_type: 'admin'
      };
      
      const response = await api.post('/api/admin-users/', adminData, {
        headers: { Authorization: `Token ${token}` }
      });
      return response.data;
    } catch (error) {
      console.error('Error creating admin user:', error);
      throw error;
    }
  },
  
  deleteAdminUser: async (userId, token) => {
    try {
      await api.delete(`/api/admin-users/${userId}/`, {
        headers: { Authorization: `Token ${token}` }
      });
      return true;
    } catch (error) {
      console.error('Error deleting admin user:', error);
      throw error;
    }
  },
  
  // Check if user is superadmin
  checkSuperAdminStatus: async (token) => {
    try {
      const response = await api.get('/api/check-superadmin/', {
        headers: { Authorization: `Token ${token}` }
      });
      return response.data.isSuperAdmin;
    } catch (error) {
      console.error('Error checking superadmin status:', error);
      return false;
    }
  }
};

export default superAdminApi;