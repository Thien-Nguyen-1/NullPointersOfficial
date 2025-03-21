import api from './api';

/**
 * Helper functions for working with quiz-related API endpoints
 */
export const QuizApiUtils = {
  // Module related functions
  getModule: async (moduleId) => {
    try {
      const response = await api.get(`/api/modules/${moduleId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching module:', error);
      throw error;
    }
  },

  createModule: async (moduleData) => {
    try {
      const response = await api.post('/api/modules/', moduleData);
      return response.data;
    } catch (error) {
      console.error('Error creating module:', error);
      throw error;
    }
  },

  updateModule: async (moduleId, moduleData) => {
    try {
      const response = await api.put(`/api/modules/${moduleId}/`, moduleData);
      return response.data;
    } catch (error) {
      console.error('Error updating module:', error);
      throw error;
    }
  },

  deleteModule: async (moduleId) => {
    try {
      await api.delete(`/api/modules/${moduleId}/`);
      return true;
    } catch (error) {
      console.error('Error deleting module:', error);
      throw error;
    }
  },

  // Task related functions
  getModuleTasks: async (moduleId) => {
    try {
      const response = await api.get('/api/tasks/', { 
        params: { moduleID: moduleId } 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching module tasks:', error);
      throw error;
    }
  },

  getTask: async (taskId) => {
    try {
      const response = await api.get(`/api/tasks/${taskId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching task:', error);
      throw error;
    }
  },

  createTask: async (taskData) => {
    try {
      const response = await api.post('/api/tasks/', taskData);
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  // updateTask: async (taskId, taskData) => {
  //   try {
  //     const response = await api.put(`/api/tasks/${taskId}/`, taskData);
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error updating task:', error);
  //     throw error;
  //   }
  // },

  updateTask: async (taskId, taskData) => {
    try {
      console.log("Updating task with ID:", taskId);
      console.log("Task data:", taskData);
      
      // Ensure moduleID is properly formatted
      if (taskData.moduleID) {
        // Make sure moduleID is a number if it should be
        if (typeof taskData.moduleID === 'string') {
          taskData.moduleID = parseInt(taskData.moduleID, 10);
        }
      }
      
      const response = await api.put(`/api/tasks/${taskId}/`, taskData);
      console.log("Task update response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
      console.error('Error response data:', error.response?.data);
      throw error;
    }
  },

  deleteTask: async (taskId) => {
    try {
      await api.delete(`/api/tasks/${taskId}/`);
      return true;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  },

  // Quiz question related functions
  getQuestions: async (taskId) => {
    try {
      const response = await api.get('/api/quiz/questions/', { 
        params: { task_id: taskId } 
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  },

  getQuestion: async (questionId) => {
    try {
      const response = await api.get(`/api/quiz/questions/${questionId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching question:', error);
      throw error;
    }
  },

  // createQuestion: async (questionData) => {
  //   try {
  //     const response = await api.post('/api/quiz/questions/', questionData);
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error creating question:', error);
  //     throw error;
  //   }
  // },

  createQuestion: async (questionData) => {
    try {
      console.log("[DEBUG] Creating question with original data:", questionData);
      
      // Validate required fields
      if (!questionData.task_id && !questionData.task) {
        console.error("Error: Both task_id and task are missing");
        throw new Error("Task ID is required");
      }
      
      if (!questionData.question_text && !questionData.text) {
        console.error("Error: Both question_text and text are missing");
        throw new Error("Question text is required");
      }
      
      // Prepare data in the format expected by the API
      const apiData = {
        task_id: questionData.task || questionData.task_id, // Use either task or task_id
        question_text: questionData.question_text || questionData.text || "",
        hint_text: questionData.hint_text || questionData.hint || "",
        order: questionData.order || 0,
        answers:questionData.answers || []
      };
      
      console.log("[DEBUG] Sending to API:", apiData);
      
      // Make the API call
      const response = await api.post('/api/quiz/questions/', apiData);
      return response.data;

    } catch (error) {
      // Enhanced error logging
      console.error("Error creating question:", error);
      console.error("Error response data:", error.response?.data);
      
      // Rethrow the error for the caller to handle
      throw error;
    }
  },

  updateQuestion: async (questionId, questionData) => {
    try {
      const response = await api.put(`/api/quiz/questions/${questionId}/`, questionData);
      return response.data;
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  },

  deleteQuestion: async (questionId) => {
    try {
      await api.delete(`/api/quiz/questions/${questionId}/`);
      return true;
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  },

  // Quiz type helper - maps frontend quiz names to their database type
  getQuizTypeValue: (uiType) => {
    const typeMap = {
      'Flashcard Quiz': 'flashcard',
      'Fill in the Blanks': 'text_input',
      'Flowchart Quiz': 'statement_sequence',
      'Question and Answer Form': 'question_input',
      'Matching Question Quiz': 'pair_input'

    };
    return typeMap[uiType] || 'text_input';
  },

  // Get UI type from API type -  retrieves quiz types from the database and maps them to frontend components.
  getUITypeFromAPIType: (apiType) => {
    const typeMap = {
      'flashcard': 'Flashcard Quiz',
      'text_input': 'Fill in the Blanks',
      'statement_sequence': 'Flowchart Quiz',
      'question_input':'Question and Answer Form',
      'pair_input':'Matching Question Quiz'
    };
    return typeMap[apiType] || 'Flashcard Quiz';
  },

  /**
   * Get only tasks specific to a module
   */
  getModuleSpecificTasks: async (moduleId) => {
    try {
      const response = await api.get('/api/tasks/', { 
        params: { moduleID: moduleId } 
      });
    
      
      // Ensure we only return tasks that belong to this specific module
      const tasks = response.data.filter(task => {
        return String(task.moduleID) === String(moduleId);
      });
      
      return tasks;
    } catch (error) {
      console.error('Error fetching module-specific tasks:', error);
      throw error;
    }
  },

  // Also add a function to create the module-task relationship in the backend
  // createModuleTask: async (moduleId, taskData) => {
  //   try {
  //     // Ensure the moduleID is explicitly set to this module
  //     const data = {
  //       ...taskData,
  //       moduleID: moduleId
  //     };
      
  //     const response = await api.post('/api/tasks/', data);
  //     return response.data;
  //   } catch (error) {
  //     console.error('Error creating module task:', error);
  //     throw error;
  //   }
  // },

  createModuleTask: async (moduleId, taskData) => {
    try {
      console.log("Creating task for module ID:", moduleId);
      console.log("Task data:", taskData);
      
      // Ensure the moduleID is properly set
      const data = {
        ...taskData,
        moduleID: parseInt(moduleId, 10) // Ensure moduleID is a number
      };
      
      console.log("Prepared task data:", data);
      
      const response = await api.post('/api/tasks/', data);
      console.log("Task creation response:", response.data);
      return response.data;
    } catch (error) {
      console.error('Error creating module task:', error);
      console.error('Error response data:', error.response?.data);
      throw error;
    }
  },

  // Add a function to delete tasks that don't belong to the current module
  cleanupOrphanedTasks: async (moduleId, keepTaskIds) => {
    try {
      const allTasks = await api.get('/api/tasks/', { 
        params: { moduleID: moduleId } 
      });
      
      const tasksToDelete = allTasks.data.filter(task => 
        String(task.moduleID) === String(moduleId) && 
        !keepTaskIds.includes(task.contentID)
      );
      
      for (const task of tasksToDelete) {
        await api.delete(`/api/tasks/${task.contentID}/`);
      }
      
      return tasksToDelete.length;
    } catch (error) {
      console.error('Error cleaning up orphaned tasks:', error);
      throw error;
    }
  },

  /**
   * Submit a set of answers for a quiz
   * @param {string} taskId - The task/quiz ID
   * @param {Object} answers - Object mapping question IDs to answers
   * @param {string} token - Auth token
   * @returns {Promise} - API response
   */
  submitQuizAnswers: async (taskId, answers, token) => {
    try {
      console.log("Submitting answers for quiz:", taskId);
      
      // Convert the answers object to an array of submissions
      const submissions = [];
      
      // Process each answer
      for (const [questionId, answer] of Object.entries(answers)) {
        // Handle both single string answers and array answers (for fill-in-the-blanks)
        const answerText = Array.isArray(answer) ? answer.join(' | ') : answer;
        
        // Add to submissions
        submissions.push({
          question_id: questionId,
          response_text: answerText
        });
      }
      
      // Make separate API calls for each answer (matching your backend structure)
      const results = [];
      for (const submission of submissions) {
        const headers = token ? { 'Authorization': `Token ${token}` } : {};
        
        const response = await api.post('/api/quiz/response/', submission, { 
          headers 
        });
        
        results.push(response.data);
        console.log(`Response saved for question ${submission.question_id}:`, response.data);
      }
      
      return {
        status: 'success',
        message: `Saved ${results.length} responses`,
        results
      };
    } catch (error) {
      console.error('Error submitting quiz answers:', error);
      throw error;
    }
  },

};

export default QuizApiUtils;
if (typeof window !== 'undefined') {
  window.QuizApiUtils = QuizApiUtils;
}