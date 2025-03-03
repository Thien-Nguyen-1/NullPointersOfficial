import api from './api';

/**
 * Helper functions for working with quiz-related API endpoints
 */
export const QuizApiUtils = {
  // Get all questions for a task
  getQuestions: async (taskId) => {
    try {
      const response = await api.get(`/api/quiz/questions/?task_id=${taskId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching questions:', error);
      throw error;
    }
  },

  // Create a new question
  createQuestion: async (questionData) => {
    try {
      const response = await api.post('/api/quiz/questions/', questionData);
      return response.data;
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  },

  // Update an existing question
  updateQuestion: async (questionId, questionData) => {
    try {
      const response = await api.put(`/api/quiz/questions/${questionId}/`, questionData);
      return response.data;
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  },

  // Delete a question
  deleteQuestion: async (questionId) => {
    try {
      await api.delete(`/api/quiz/questions/${questionId}/`);
      return true;
    } catch (error) {
      console.error('Error deleting question:', error);
      throw error;
    }
  },

  // Get quiz details
  getQuizDetails: async (taskId) => {
    try {
      const response = await api.get(`/api/quiz/${taskId}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching quiz details:', error);
      throw error;
    }
  },

  // Create a new task for a module
  createTask: async (taskData) => {
    try {
      const response = await api.post('/api/tasks/', taskData);
      return response.data;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  },

  // Get all tasks for a module
  getModuleTasks: async (moduleId) => {
    try {
      const response = await api.get(`/api/tasks/?moduleID=${moduleId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching module tasks:', error);
      throw error;
    }
  },

  // Create a new module
  createModule: async (moduleData) => {
    try {
      const response = await api.post('/api/modules/', moduleData);
      return response.data;
    } catch (error) {
      console.error('Error creating module:', error);
      throw error;
    }
  },

  // Map frontend quiz types to backend types
  getQuizTypeValue: (uiType) => {
    const typeMap = {
      'Flashcard Quiz': 'flashcard',
      'Fill in the Blanks': 'text_input',
      'Flowchart Quiz': 'statement_sequence'
    };
    return typeMap[uiType] || 'text_input';
  },

  // Add authorization header to requests
  getAuthHeader: () => {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Token ${token}` } : {};
  }
};

export default QuizApiUtils;