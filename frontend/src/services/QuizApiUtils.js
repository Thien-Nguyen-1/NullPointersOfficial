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
      console.log('creating question:', questionData);
      console.log('respons data:', response.data);
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
  createModuleTask: async (moduleId, taskData) => {
    try {
      // Ensure the moduleID is explicitly set to this module
      const data = {
        ...taskData,
        moduleID: moduleId
      };
      
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

  createQuestionAnswerFormTask: async(formData) =>{
    try{
      const data = {
        ...formData
      };
      const response = await api.post('/api/question_answer_forms/',data);
      return response.data;
    }catch(error){
      console.error('Error Question & Answer form task:', error);
      throw error;
    }

  },

  createMatchingQuestionsTask: async(pairData) =>{
    try{
      const data = {
        ...pairData
      };
      const response = await api.post('/api/matching_questions/',data);
      return response.data;
    }catch(error){
      console.error('Error matching questions task:', error);
      throw error;
    }

  },
  getMatchingQuestions: async(taskId) =>{

  }
};

export default QuizApiUtils;