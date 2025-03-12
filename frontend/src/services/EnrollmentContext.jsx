// Custom hook to handle Enrollment of User

// Wrapper that provides functions to 
// 1. Check if a user has enrolled in a module
// 2. Enroll user in a module
// 3. Update module progress

import React, { createContext, useContext, useState, useEffect } from 'react';
import { AuthContext } from './AuthContext';
import api from './api';
import CourseItem from '../components/CourseItem'

// Create the context
export const EnrollmentContext = createContext();

export const EnrollmentContextProvider = ({ children }) => {
  const { user, token } = useContext(AuthContext);
  const [enrolledModules, setEnrolledModules] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch user's enrolled modules when component mounts or user/token changes
  useEffect(() => {
    const fetchEnrolledModules = async () => {
      if (!user || !token) {
        setEnrolledModules([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        const response = await api.get('/api/progress-tracker/', {
          headers: { Authorization: `Token ${token}` }
        });
        
        // Filter for current user's enrollments
        const userEnrollments = response.data.filter(tracker => 
          tracker.user === user.id
        );
        
        setEnrolledModules(userEnrollments);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching enrollments:", err);
        setError("Failed to load enrollment data");
        setIsLoading(false);
      }
    };

    fetchEnrolledModules();
  }, [user, token]);

  // Check if user is enrolled in a specific module
  const isEnrolled = (moduleId) => {
    return enrolledModules.some(enrollment => enrollment.module === parseInt(moduleId));
  };

  // Enroll user in a module & Check if user has enrolled
  const enrollInModule = async (moduleId) => {
    if (!user || !token) {
      throw new Error("User must be logged in to enroll");
    }

    if (isEnrolled(moduleId)) {
      return { alreadyEnrolled: true, message: "User is already enrolled in this module" };
    }

    // If user has not enrolled
    try {
      // Create a new progress tracker entry
      const response = await api.post('/api/progress-tracker/', {
        user: user.id,
        module: moduleId,
        completed: false,
        pinned: false,
        hasLiked: false
      }, {
        headers: { Authorization: `Token ${token}` }
      });

      // Update the local state with the new enrollment
      setEnrolledModules([...enrolledModules, response.data]);
      
      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error enrolling in module:", err);
      throw new Error("Failed to enroll in module");
    }
  };

  // Update a module's progress for the user
  const updateModuleProgress = async (moduleId, progressData) => {
    if (!user || !token) {
      throw new Error("User must be logged in to update progress");
    }

    // Find the enrollment
    const enrollment = enrolledModules.find(e => e.module === parseInt(moduleId));
    
    if (!enrollment) {
      throw new Error("User is not enrolled in this module");
    }

    try {
      // Update the progress tracker
      const response = await api.put(`/api/progress-tracker/${enrollment.id}`, {
        ...enrollment,
        ...progressData
      }, {
        headers: { Authorization: `Token ${token}` }
      });

      // Update the local state
      setEnrolledModules(enrolledModules.map(e => 
        e.id === enrollment.id ? response.data : e
      ));
      
      return { success: true, data: response.data };
    } catch (err) {
      console.error("Error updating module progress:", err);
      throw new Error("Failed to update module progress");
    }
  };

  // Get a specific enrollment
  const getEnrollment = (moduleId) => {
    return enrolledModules.find(e => e.module === parseInt(moduleId)) || null;
  };

  // Mark a module as completed
  const completeModule = async (moduleId) => {
    return await updateModuleProgress(moduleId, { completed: true });
  };

  return (
    <EnrollmentContext.Provider value={{
      enrolledModules,
      isLoading,
      error,
      isEnrolled,
      enrollInModule,
      updateModuleProgress,
      getEnrollment,
      completeModule
    }}>
      {children}
    </EnrollmentContext.Provider>
  );
};

// Custom hook for using the enrollment context
export const useEnrollment = () => useContext(EnrollmentContext);