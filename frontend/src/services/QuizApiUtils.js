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

  updateTask: async (taskId, taskData) => {
    try {
      const response = await api.put(`/api/tasks/${taskId}/`, taskData);
      return response.data;
    } catch (error) {
      console.error('Error updating task:', error);
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

  createQuestion: async (questionData) => {
    try {
      const response = await api.post('/api/quiz/questions/', questionData);
      return response.data;
    } catch (error) {
      console.error('Error creating question:', error);
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

  // Quiz type helper
  getQuizTypeValue: (uiType) => {
    const typeMap = {
      'Flashcard Quiz': 'flashcard',
      'Fill in the Blanks': 'text_input',
      'Flowchart Quiz': 'statement_sequence',
      'Question and Answer Form': 'text_input',
      'Matching Questions Quiz': 'text_input'

    };
    return typeMap[uiType] || 'text_input';
  },

  // Get UI type from API type
  getUITypeFromAPIType: (apiType) => {
    const typeMap = {
      'flashcard': 'Flashcard Quiz',
      'text_input': 'Fill in the Blanks',
      'statement_sequence': 'Flowchart Quiz',
      'text_input':'Question and Answer Form',
      'text_input':'Matching Questions Quiz'
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
      
      // Log the module-task relationship for debugging
      console.log(`[DEBUG] Filtering tasks specifically for module ${moduleId}`);
      
      // Ensure we only return tasks that belong to this specific module
      const tasks = response.data.filter(task => {
        return String(task.moduleID) === String(moduleId);
      });
      
      console.log(`[DEBUG] Found ${tasks.length} tasks belonging to module ${moduleId}:`, tasks);
      return tasks;
    } catch (error) {
      console.error('Error fetching module-specific tasks:', error);
      throw error;
    }
  },

  // Also add a function to create the module-task relationship in the backend
  createModuleTask: async (moduleId, taskData) => {
    try {
      // Ensure the moduleID is explicitly set to this module
      const data = {
        ...taskData,
        moduleID: moduleId
      };
      
      console.log(`[DEBUG] Creating new task explicitly for module ${moduleId}:`, data);
      const response = await api.post('/api/tasks/', data);
      return response.data;
    } catch (error) {
      console.error('Error creating module task:', error);
      throw error;
    }
  },

  // Add a function to delete tasks that don't belong to the current module
  cleanupOrphanedTasks: async (moduleId, keepTaskIds) => {
    try {
      console.log(`[DEBUG] Cleaning up tasks for module ${moduleId}, keeping only tasks:`, keepTaskIds);
      const allTasks = await api.get('/api/tasks/', { 
        params: { moduleID: moduleId } 
      });
      
      const tasksToDelete = allTasks.data.filter(task => 
        String(task.moduleID) === String(moduleId) && 
        !keepTaskIds.includes(task.contentID)
      );
      
      console.log(`[DEBUG] Found ${tasksToDelete.length} orphaned tasks to delete from module ${moduleId}:`, 
        tasksToDelete.map(t => t.contentID));
      
      for (const task of tasksToDelete) {
        console.log(`[DEBUG] Deleting orphaned task ${task.contentID} from module ${moduleId}`);
        await api.delete(`/api/tasks/${task.contentID}/`);
      }
      
      return tasksToDelete.length;
    } catch (error) {
      console.error('Error cleaning up orphaned tasks:', error);
      throw error;
    }
  }

};

export default QuizApiUtils;