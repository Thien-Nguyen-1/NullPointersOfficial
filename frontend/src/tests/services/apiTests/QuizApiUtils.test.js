import { describe, test, expect, beforeEach, vi, afterEach } from 'vitest';
 import QuizApiUtils from '../../../services/QuizApiUtils';

 // Mock the API module
 vi.mock('../../../services/api', () => {
   return {
     default: {
       get: vi.fn(),
       post: vi.fn(),
       put: vi.fn(),
       delete: vi.fn()
     }
   };
 });

 // Import the mocked api
 import api from '../../../services/api';

 describe('QuizApiUtils', () => {
   // Clear all mocks - Prevents test interference
   beforeEach(() => {
     vi.clearAllMocks();
   });
  // Reset all mocks - Ensures a clean slate after each test
   afterEach(() => {
     vi.resetAllMocks();
   });

   // Module related tests
   describe('Module Functions', () => {
     test('getModule should fetch a module by ID', async () => {
       const mockData = { id: '123', name: 'Test Module' };
       api.get.mockReturnValue(Promise.resolve({ data: mockData }));

       const result = await QuizApiUtils.getModule('123');

       expect(api.get).toHaveBeenCalledWith('/api/modules/123/');
       expect(result).toEqual(mockData);
     });

     test('getModule should throw an error if the API call fails', async () => {
       const mockError = new Error('API error');
       api.get.mockReturnValue(Promise.reject(mockError));

       // Mock console.error to prevent test logs being polluted
       const originalConsoleError = console.error;
       console.error = vi.fn();


       await expect(QuizApiUtils.getModule('123')).rejects.toThrow('API error');
       expect(api.get).toHaveBeenCalledWith('/api/modules/123/');
       expect(console.error).toHaveBeenCalledWith('Error fetching module:', mockError);
     });

     test('createModule should post module data', async () => {
       const moduleData = { name: 'New Module', description: 'Test Description' };
       const mockResponse = { id: '123', ...moduleData };
       api.post.mockReturnValue(Promise.resolve({ data: mockResponse }));

       const result = await QuizApiUtils.createModule(moduleData);

       expect(api.post).toHaveBeenCalledWith('/api/modules/', moduleData);
       expect(result).toEqual(mockResponse);
     });

     test('createModule should throw an error if the API call fails', async () => {
       const mockError = new Error('API error');
       api.post.mockRejectedValue(mockError);

       // Mock console.error to prevent test logs being polluted
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.createModule({ name: 'Test' })).rejects.toThrow('API error');
       expect(api.post).toHaveBeenCalledWith('/api/modules/', { name: 'Test' });
       expect(console.error).toHaveBeenCalledWith('Error creating module:', mockError);

       console.error = originalConsoleError;
     });

     test('updateModule should update module data', async () => {
       const moduleId = '123';
       const moduleData = { name: 'Updated Module' };
       const mockResponse = { id: moduleId, ...moduleData };
       api.put.mockReturnValue(Promise.resolve({ data: mockResponse }));

       const result = await QuizApiUtils.updateModule(moduleId, moduleData);

       expect(api.put).toHaveBeenCalledWith('/api/modules/123/', moduleData);
       expect(result).toEqual(mockResponse);
     });

     test('updateModule should throw an error if the API call fails', async () => {
       const mockError = new Error('API error');
       api.put.mockRejectedValue(mockError);

       // Mock console.error to prevent test logs being polluted
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.updateModule('123', { name: 'Test' })).rejects.toThrow('API error');
       expect(api.put).toHaveBeenCalledWith('/api/modules/123/', { name: 'Test' });
       expect(console.error).toHaveBeenCalledWith('Error updating module:', mockError);

       console.error = originalConsoleError;
     });

     test('deleteModule should delete a module', async () => {
       api.delete.mockReturnValue(Promise.resolve({}));

       const result = await QuizApiUtils.deleteModule('123');

       expect(api.delete).toHaveBeenCalledWith('/api/modules/123/');
       expect(result).toBe(true);
     });

     test('deleteModule should throw an error if the API call fails', async () => {
       const mockError = new Error('API error');
       api.delete.mockRejectedValue(mockError);

       // Mock console.error to prevent test logs being polluted
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.deleteModule('123')).rejects.toThrow('API error');
       expect(api.delete).toHaveBeenCalledWith('/api/modules/123/');
       expect(console.error).toHaveBeenCalledWith('Error deleting module:', mockError);

       console.error = originalConsoleError;
     });
   });

   // Task related tests
   describe('Task Functions', () => {
     test('getModuleTasks should fetch tasks for a module', async () => {
       const mockTasks = [{ id: '1', title: 'Task 1' }, { id: '2', title: 'Task 2' }];
       api.get.mockReturnValue(Promise.resolve({ data: mockTasks }));

       const result = await QuizApiUtils.getModuleTasks('123');

       expect(api.get).toHaveBeenCalledWith('/api/tasks/', { params: { moduleID: '123' } });
       expect(result).toEqual(mockTasks);
     });

     test('getModuleTasks should throw an error if the API call fails', async () => {
       const mockError = new Error('API error');
       api.get.mockRejectedValue(mockError);

       // Mock console.error to prevent test logs being polluted
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.getModuleTasks('123')).rejects.toThrow('API error');
       expect(api.get).toHaveBeenCalledWith('/api/tasks/', { params: { moduleID: '123' } });
       expect(console.error).toHaveBeenCalledWith('Error fetching module tasks:', mockError);

       console.error = originalConsoleError;
     });

     test('getTask should fetch a task by ID', async () => {
       const mockTask = { id: '1', title: 'Task 1' };
       api.get.mockReturnValue(Promise.resolve({ data: mockTask }));

       const result = await QuizApiUtils.getTask('1');

       expect(api.get).toHaveBeenCalledWith('/api/tasks/1/');
       expect(result).toEqual(mockTask);
     });

     test('getTask should throw an error if the API call fails', async () => {
       const mockError = new Error('API error');
       api.get.mockRejectedValue(mockError);

       // Mock console.error to prevent test logs being polluted
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.getTask('1')).rejects.toThrow('API error');
       expect(api.get).toHaveBeenCalledWith('/api/tasks/1/');
       expect(console.error).toHaveBeenCalledWith('Error fetching task:', mockError);

       console.error = originalConsoleError;
     });

     test('createTask should post task data', async () => {
       const taskData = { title: 'New Task', description: 'Test Description' };
       const mockResponse = { id: '1', ...taskData };
       api.post.mockReturnValue(Promise.resolve({ data: mockResponse }));

       const result = await QuizApiUtils.createTask(taskData);

       expect(api.post).toHaveBeenCalledWith('/api/tasks/', taskData);
       expect(result).toEqual(mockResponse);
     });

     test('createTask should throw an error if the API call fails', async () => {
       const taskData = { title: 'New Task', description: 'Test Description' };
       const mockError = new Error('API error');
       api.post.mockRejectedValue(mockError);

       // Mock console.error to prevent test logs being polluted
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.createTask(taskData)).rejects.toThrow('API error');
       expect(api.post).toHaveBeenCalledWith('/api/tasks/', taskData);
       expect(console.error).toHaveBeenCalledWith('Error creating task:', mockError);

       console.error = originalConsoleError;
     });

     test('updateTask should update task data and handle string moduleID', async () => {
       const taskId = '1';
       const taskData = {
         title: 'Updated Task',
         moduleID: '123'
       };
       const mockResponse = { id: taskId, ...taskData, moduleID: 123 };
       api.put.mockReturnValue(Promise.resolve({ data: mockResponse }));

       const result = await QuizApiUtils.updateTask(taskId, taskData);

       expect(api.put).toHaveBeenCalledWith('/api/tasks/1/', { ...taskData, moduleID: 123 });
       expect(result).toEqual(mockResponse);
     });

     test('updateTask should handle numeric moduleID', async () => {
       const taskId = '1';
       const taskData = {
         title: 'Updated Task',
         moduleID: 123 // Already numeric
       };
       const mockResponse = { id: taskId, ...taskData };
       api.put.mockReturnValue(Promise.resolve({ data: mockResponse }));

       const result = await QuizApiUtils.updateTask(taskId, taskData);

       expect(api.put).toHaveBeenCalledWith('/api/tasks/1/', taskData);
       expect(result).toEqual(mockResponse);
     });

     test('updateTask should handle tasks without moduleID', async () => {
       const taskId = '1';
       const taskData = {
         title: 'Updated Task'
         // No moduleID
       };
       const mockResponse = { id: taskId, ...taskData };
       api.put.mockReturnValue(Promise.resolve({ data: mockResponse }));

       const result = await QuizApiUtils.updateTask(taskId, taskData);

       expect(api.put).toHaveBeenCalledWith('/api/tasks/1/', taskData);
       expect(result).toEqual(mockResponse);
     });

     test('updateTask should properly handle API errors', async () => {
       const taskId = '1';
       const taskData = { title: 'Test Task' };

       // Create a mock error with response property
       const mockError = new Error('API error');
       mockError.response = {
         data: { detail: 'Invalid data format' }
       };
       api.put.mockRejectedValue(mockError);

       // Mock console.error
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.updateTask(taskId, taskData)).rejects.toThrow('API error');
       expect(api.put).toHaveBeenCalledWith('/api/tasks/1/', taskData);

       // Verify both error log calls are made
       expect(console.error).toHaveBeenCalledWith('Error updating task:', mockError);
       expect(console.error).toHaveBeenCalledWith('Error response data:', { detail: 'Invalid data format' });

       console.error = originalConsoleError;
     });

     test('updateTask should handle properly handle errors without response data', async () => {
       const taskId = '123';
       const taskData = { title: 'Test Task' };

       // Simple error without response property
       const mockError = new Error('Network error');
       api.put.mockRejectedValue(mockError);

       // Mock console.error
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.updateTask(taskId, taskData)).rejects.toThrow('Network error');

       // First error log is called
       expect(console.error).toHaveBeenCalledWith('Error updating task:', mockError);
       // Second call gets undefined
       expect(console.error).toHaveBeenCalledWith('Error response data:', undefined);

       console.error = originalConsoleError;
     });

     test('deleteTask should delete a task', async () => {
       api.delete.mockReturnValue(Promise.resolve({}));

       const result = await QuizApiUtils.deleteTask('1');

       expect(api.delete).toHaveBeenCalledWith('/api/tasks/1/');
       expect(result).toBe(true);
     });

     test('deleteTask should throw an error if the API call fails', async () => {
       const mockError = new Error('API error');
       api.delete.mockRejectedValue(mockError);

       // Mock console.error to prevent test logs being polluted
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.deleteTask('123')).rejects.toThrow('API error');
       expect(api.delete).toHaveBeenCalledWith('/api/tasks/123/');
       expect(console.error).toHaveBeenCalledWith('Error deleting task:', mockError);

       console.error = originalConsoleError;
     });

     test('getModuleSpecificTasks should filter tasks by moduleID', async () => {
       const moduleId = '123';
       const mockTasks = [
         { contentID: '1', moduleID: '123', title: 'Task 1' },
         { contentID: '2', moduleID: '123', title: 'Task 2' },
         { contentID: '3', moduleID: '456', title: 'Task 3' } // Should be filtered out
       ];
       api.get.mockReturnValue(Promise.resolve({ data: mockTasks }));

       const result = await QuizApiUtils.getModuleSpecificTasks(moduleId);

       expect(api.get).toHaveBeenCalledWith('/api/tasks/', { params: { moduleID: moduleId } });
       expect(result).toHaveLength(2);
       expect(result.map(t => t.contentID)).toEqual(['1', '2']);
     });

     test('getModuleSpecificTasks should throw an error if the API call fails', async () => {
       const mockError = new Error('API error');
       api.get.mockRejectedValue(mockError);

       // Mock console.error
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.getModuleSpecificTasks('123')).rejects.toThrow('API error');
       expect(api.get).toHaveBeenCalledWith('/api/tasks/', { params: { moduleID: '123' } });
       expect(console.error).toHaveBeenCalledWith('Error fetching module-specific tasks:', mockError);

       console.error = originalConsoleError;
     });

     test('createModuleTask should create a task and handle string moduleId', async () => {
       const moduleId = '123';
       const taskData = { title: 'New Task', description: 'Test Description', order_index: 0 };
       const mockResponse = { id: '1', ...taskData, moduleID: 123 };
       api.post.mockReturnValue(Promise.resolve({ data: mockResponse }));

       const result = await QuizApiUtils.createModuleTask(moduleId, taskData);

       expect(api.post).toHaveBeenCalledWith('/api/tasks/', { ...taskData, moduleID: 123 });
       expect(result).toEqual(mockResponse);
     });

     test('createModuleTask should create a task and handle numeric moduleId', async () => {
       const moduleId = 123; // Numeric moduleId
       const taskData = { title: 'New Task', description: 'Test Description', order_index: 0 };
       const mockResponse = { id: '1', ...taskData, moduleID: 123 };
       api.post.mockReturnValue(Promise.resolve({ data: mockResponse }));

       const result = await QuizApiUtils.createModuleTask(moduleId, taskData);

       expect(api.post).toHaveBeenCalledWith('/api/tasks/', { ...taskData, moduleID: 123 });
       expect(result).toEqual(mockResponse);
     });

     test('createModuleTask should handle API errors', async () => {
       const moduleId = '123';
       const taskData = { title: 'New Task', description: 'Test Description' };

       // Create a mock error with response property
       const mockError = new Error('API error');
       mockError.response = { data: { detail: 'Invalid data' } };
       api.post.mockReturnValue(Promise.reject(mockError));

       // Mock console.error
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.createModuleTask(moduleId, taskData)).rejects.toThrow('API error');

       // Verify error logging
       expect(console.error).toHaveBeenCalledWith('Error creating module task:', mockError);
       expect(console.error).toHaveBeenCalledWith('Error response data:', { detail: 'Invalid data' });

       console.error = originalConsoleError;
     });

     test('cleanupOrphanedTasks should delete tasks not in keepTaskIds', async () => {
       const moduleId = '123';
       const keepTaskIds = ['1', '2'];
       const mockTasks = [
         { contentID: '1', moduleID: '123' },
         { contentID: '2', moduleID: '123' },
         { contentID: '3', moduleID: '123' }, // Should be deleted
         { contentID: '4', moduleID: '456' }  // Different module, should be kept
       ];

       api.get.mockReturnValue(Promise.resolve({ data: mockTasks }));
       api.delete.mockReturnValue(Promise.resolve({}));

       const deletedCount = await QuizApiUtils.cleanupOrphanedTasks(moduleId, keepTaskIds);

       expect(api.get).toHaveBeenCalledWith('/api/tasks/', { params: { moduleID: moduleId } });
       expect(api.delete).toHaveBeenCalledTimes(1);
       expect(api.delete).toHaveBeenCalledWith('/api/tasks/3/');
       expect(deletedCount).toBe(1);
     });

     test('cleanupOrphanedTasks should throw an error if the API call fails', async () => {
       const mockError = new Error('API error');
       api.get.mockRejectedValue(mockError);

       // Mock console.error
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.cleanupOrphanedTasks('123', ['1', '2'])).rejects.toThrow('API error');
       expect(console.error).toHaveBeenCalledWith('Error cleaning up orphaned tasks:', mockError);

       console.error = originalConsoleError;
     });
   });

   // Quiz question related tests
   describe('Question Functions', () => {
     test('getQuestions should fetch questions for a task', async () => {
       const mockQuestions = [{ id: '1', text: 'Question 1' }, { id: '2', text: 'Question 2' }];
       api.get.mockReturnValue(Promise.resolve({ data: mockQuestions }));

       const result = await QuizApiUtils.getQuestions('123');

       expect(api.get).toHaveBeenCalledWith('/api/quiz/questions/', { params: { task_id: '123' } });
       expect(result).toEqual(mockQuestions);
     });

     test('getQuestions should throw an error if the API call fails', async () => {
       const mockError = new Error('API error');
       api.get.mockRejectedValue(mockError);

       // Mock console.error to prevent test logs being polluted
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.getQuestions('123')).rejects.toThrow('API error');
       expect(api.get).toHaveBeenCalledWith('/api/quiz/questions/', { params: { task_id: '123' } });
       expect(console.error).toHaveBeenCalledWith('Error fetching questions:', mockError);

       console.error = originalConsoleError;
     });

     test('getQuestion should fetch a question by ID', async () => {
       const mockQuestion = { id: '1', text: 'Question 1' };
       api.get.mockReturnValue(Promise.resolve({ data: mockQuestion }));

       const result = await QuizApiUtils.getQuestion('1');

       expect(api.get).toHaveBeenCalledWith('/api/quiz/questions/1/');
       expect(result).toEqual(mockQuestion);
     });

     test('getQuestion should throw an error if the API call fails', async () => {
       const mockError = new Error('API error');
       api.get.mockRejectedValue(mockError);

       // Mock console.error to prevent test logs being polluted
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.getQuestion('123')).rejects.toThrow('API error');
       expect(api.get).toHaveBeenCalledWith('/api/quiz/questions/123/');
       expect(console.error).toHaveBeenCalledWith('Error fetching question:', mockError);

       console.error = originalConsoleError;
     });

     test('createQuestion should handle different property names', async () => {
       const questionData = {
         task_id: '123',
         text: 'Question text',
         hint: 'Hint text',
         order: 1,
         answers: ['Answer 1', 'Answer 2']
       };

       const expectedApiData = {
         task_id: '123',
         question_text: 'Question text',
         hint_text: 'Hint text',
         order: 1,
         answers: ['Answer 1', 'Answer 2']
       };

       const mockResponse = { id: '1', ...expectedApiData };
       api.post.mockReturnValue(Promise.resolve({ data: mockResponse }));

       const result = await QuizApiUtils.createQuestion(questionData);

       expect(api.post).toHaveBeenCalledWith('/api/quiz/questions/', expectedApiData);
       expect(result).toEqual(mockResponse);
     });

     test('createQuestion should throw error if required fields are missing', async () => {
       const questionData = {
         // Missing task_id and question_text
         hint: 'Hint text'
       };

       // Mock console.error
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.createQuestion(questionData)).rejects.toThrow('Task ID is required');

       // Verify the proper error message was logged
       expect(console.error).toHaveBeenCalledWith("Error: Both task_id and task are missing");

       console.error = originalConsoleError;
     });

     test('createQuestion should throw error if task_id exists but question_text is missing', async () => {
       const questionData = {
         task_id: '123',
         // Missing question_text
         hint: 'Hint text'
       };

       // Mock console.error
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.createQuestion(questionData)).rejects.toThrow('Question text is required');

       // Verify the proper error message was logged
       expect(console.error).toHaveBeenCalledWith("Error: Both question_text and text are missing");

       console.error = originalConsoleError;
     });

     // Test for error with response data
     test('createQuestion should handle API error with response data', async () => {
       const questionData = {
         task_id: '123',
         question_text: 'Test question'
       };

       // Simple error without response
       const mockError = new Error('API error');
       mockError.response = { data: { detail: 'Invalid data' } };
       api.post.mockReturnValue(Promise.reject(mockError));

       // Mock console.error
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.createQuestion(questionData)).rejects.toThrow('API error');

       // Check both error logs, second should get undefined
       expect(console.error).toHaveBeenCalledWith('Error creating question:', mockError);
       expect(console.error).toHaveBeenCalledWith('Error response data:', { detail: 'Invalid data' });

       console.error = originalConsoleError;
     });

     // Test for error without response data
     test('createQuestion should handle API error without response data', async () => {
       const questionData = {
         task_id: '123',
         question_text: 'Test question'
       };

       // Simple error without response
       const mockError = new Error('Network failure');
       api.post.mockRejectedValue(mockError);

       // Mock console.error
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.createQuestion(questionData)).rejects.toThrow('Network failure');

       // Check both error logs, second should get undefined
       expect(console.error).toHaveBeenCalledWith('Error creating question:', mockError);
       console.error = originalConsoleError;
     });

     // Testing the fallback empty strings in createQuestion
     test('createQuestion should use empty string fallbacks when values are null or undefined', async () => {
       // Minimal valid question data with null/undefined values
       const questionData = {
         task_id: '123',
         question_text: 'Test question',
         hint_text: null, // Should become ""
         // No order provided - should default to 0
         // No answers provided - should default to []
       };

       const mockResponse = { id: '1', task_id: '123', question_text: 'Test question' };
       api.post.mockReturnValue(Promise.resolve({ data: mockResponse }));

       const result = await QuizApiUtils.createQuestion(questionData);

       // Check the API call has the expected defaults
       const expectedApiData = {
         task_id: '123',
         question_text: 'Test question',
         hint_text: "", // Empty string fallback
         order: 0,      // Default value
         answers: []    // Default empty array
       };

       // Check that it's sending the API data with defaults
       expect(api.post).toHaveBeenCalledWith('/api/quiz/questions/', expectedApiData);
       expect(result).toEqual(mockResponse);
     });

     // Test alternative field naming (hint vs hint_text)
     test('createQuestion should handle alternative field names correctly', async () => {
       const questionData = {
         task: '123',       // Instead of task_id
         text: 'Question?', // Instead of question_text
         hint: 'Help text', // Instead of hint_text
         order: 2,
         answers: ['yes', 'no']
       };

       const mockResponse = { id: '1', task_id: '123', question_text: 'Question?' };
       api.post.mockReturnValue(Promise.resolve({ data: mockResponse }));

       // Mock console.log
       const originalConsoleLog = console.log;
       console.log = vi.fn();

       const result = await QuizApiUtils.createQuestion(questionData);

       // Check the API call transformed the field names correctly
       const expectedApiData = {
         task_id: '123',
         question_text: 'Question?',
         hint_text: 'Help text',
         order: 2,
         answers: ['yes', 'no']
       };

       expect(api.post).toHaveBeenCalledWith('/api/quiz/questions/', expectedApiData);
       expect(result).toEqual(mockResponse);

       console.log = originalConsoleLog;
     });

     test('updateQuestion should update question data', async () => {
       const questionId = '1';
       const questionData = { question_text: 'Updated Question' };

       const mockResponse = { id: questionId, ...questionData };
       api.put.mockReturnValue(Promise.resolve({ data: mockResponse }));

       const result = await QuizApiUtils.updateQuestion(questionId, questionData);

       expect(api.put).toHaveBeenCalledWith('/api/quiz/questions/1/', questionData);
       expect(result).toEqual(mockResponse);
     });

     test('updateQuestion should throw an error if the API call fails', async () => {
       const mockError = new Error('API error');
       api.put.mockRejectedValue(mockError);

       // Mock console.error to prevent test logs being polluted
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.updateQuestion('123', { text: 'New text' })).rejects.toThrow('API error');
       expect(api.put).toHaveBeenCalledWith('/api/quiz/questions/123/', { text: 'New text' });
       expect(console.error).toHaveBeenCalledWith('Error updating question:', mockError);

       console.error = originalConsoleError;
     });

     test('deleteQuestion should delete a question', async () => {
       api.delete.mockReturnValue(Promise.resolve({}));

       const result = await QuizApiUtils.deleteQuestion('1');

       expect(api.delete).toHaveBeenCalledWith('/api/quiz/questions/1/');
       expect(result).toBe(true);
     });

     test('deleteQuestion should throw an error if the API call fails', async () => {
       const mockError = new Error('API error');
       api.delete.mockRejectedValue(mockError);

       // Mock console.error to prevent test logs being polluted
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.deleteQuestion('123')).rejects.toThrow('API error');
       expect(api.delete).toHaveBeenCalledWith('/api/quiz/questions/123/');
       expect(console.error).toHaveBeenCalledWith('Error deleting question:', mockError);

       console.error = originalConsoleError;
     });

   });

   // Type mapping tests
   describe('Type Mapping Functions', () => {
     test('getQuizTypeValue should map UI types to API types', () => {
       expect(QuizApiUtils.getQuizTypeValue('Flashcard Quiz')).toBe('flashcard');
       expect(QuizApiUtils.getQuizTypeValue('Fill in the Blanks')).toBe('text_input');
       expect(QuizApiUtils.getQuizTypeValue('Flowchart Quiz')).toBe('statement_sequence');
       expect(QuizApiUtils.getQuizTypeValue('Question and Answer Form')).toBe('question_input');
       expect(QuizApiUtils.getQuizTypeValue('Matching Question Quiz')).toBe('pair_input');
       expect(QuizApiUtils.getQuizTypeValue('Ranking Quiz')).toBe('ranking_quiz');
       expect(QuizApiUtils.getQuizTypeValue('Unknown Type')).toBe('text_input'); // Default
     });

     test('getComponentType should return correct component type', () => {
       expect(QuizApiUtils.getComponentType('document')).toBe('media');
       expect(QuizApiUtils.getComponentType('audio')).toBe('media');
       expect(QuizApiUtils.getComponentType('image')).toBe('media');
       expect(QuizApiUtils.getComponentType('video')).toBe('media');
       expect(QuizApiUtils.getComponentType('flashcard')).toBe('template');
       expect(QuizApiUtils.getComponentType('text_input')).toBe('template');
     });

     test('getUITypeFromAPIType should map API types to UI types', () => {
       expect(QuizApiUtils.getUITypeFromAPIType('flashcard')).toBe('Flashcard Quiz');
       expect(QuizApiUtils.getUITypeFromAPIType('text_input')).toBe('Fill in the Blanks');
       expect(QuizApiUtils.getUITypeFromAPIType('statement_sequence')).toBe('Flowchart Quiz');
       expect(QuizApiUtils.getUITypeFromAPIType('question_input')).toBe('Question and Answer Form');
       expect(QuizApiUtils.getUITypeFromAPIType('pair_input')).toBe('Matching Question Quiz');
       expect(QuizApiUtils.getUITypeFromAPIType('ranking_quiz')).toBe('Ranking Quiz');
       expect(QuizApiUtils.getUITypeFromAPIType('unknown')).toBe('Flashcard Quiz'); // Default
     });

     test('getUIMediaTypeFromAPIType should map API media types to UI types', () => {
       expect(QuizApiUtils.getUIMediaTypeFromAPIType('document')).toBe('Upload Document');
       expect(QuizApiUtils.getUIMediaTypeFromAPIType('audio')).toBe('Upload Audio');
       expect(QuizApiUtils.getUIMediaTypeFromAPIType('image')).toBe('Upload Image');
       expect(QuizApiUtils.getUIMediaTypeFromAPIType('video')).toBe('Link Video');
       expect(QuizApiUtils.getUIMediaTypeFromAPIType('unknown')).toBe(null); // Unknown type
     });

     test('getUIMediaTypeFromAPIType should handle null and undefined inputs', () => {
       expect(QuizApiUtils.getUIMediaTypeFromAPIType(null)).toBe(null);
       expect(QuizApiUtils.getUIMediaTypeFromAPIType(undefined)).toBe(null);
     });
   });

   // Media content tests
   describe('Media Content Functions', () => {
     test('getModuleContents should fetch different media types', async () => {
       const mockMedia = [{ id: '1', title: 'Media 1' }];
       api.get.mockReturnValue(Promise.resolve({ data: mockMedia }));
       // Test document
       await QuizApiUtils.getModuleContents('123', 'document');
       expect(api.get).toHaveBeenCalledWith('/api/documents/', { params: { module_id: '123' } });

       // Test audio
       await QuizApiUtils.getModuleContents('123', 'audio');
       expect(api.get).toHaveBeenCalledWith('/api/audios/', { params: { module_id: '123' } });

       // Test image
       await QuizApiUtils.getModuleContents('123', 'image');
       expect(api.get).toHaveBeenCalledWith('/api/images/', { params: { module_id: '123' } });

       // Test video
       await QuizApiUtils.getModuleContents('123', 'video');
       expect(api.get).toHaveBeenCalledWith('/api/embedded-videos/', { params: { module_id: '123' } });
     });

     test('getModuleContents should throw error for unsupported media type', async () => {
       await expect(QuizApiUtils.getModuleContents('123', 'unsupported')).rejects.toThrow('Unsupported media type: unsupported');
     });

     test('getModuleContents should handle API errors', async () => {
       const mockError = new Error('API error');
       api.get.mockReturnValue(Promise.reject(mockError));

       // Mock console.error to prevent test logs being polluted
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.getModuleContents('123', 'document')).rejects.toThrow('API error');

       expect(api.get).toHaveBeenCalledWith('/api/documents/', { params: { module_id: '123' } });
       expect(console.error).toHaveBeenCalledWith('Error fetching document contents:', mockError);

       console.error = originalConsoleError;
     });
   });

   // Quiz submission tests
   describe('Quiz Submission', () => {
     test('submitQuizAnswers should post each answer separately', async () => {
       const taskId = '123';
       const answers = {
         'q1': 'Answer 1',
         'q2': ['Part 1', 'Part 2']
       };

       api.post.mockImplementation((url, data) => {
         return Promise.resolve({
           data: {
             id: data.question_id === 'q1' ? '1' : '2',
             ...data,
             result: 'correct'
           }
         });
       });

       const result = await QuizApiUtils.submitQuizAnswers(taskId, answers);

       expect(api.post).toHaveBeenCalledTimes(2);
       expect(api.post).toHaveBeenCalledWith('/api/quiz/response/', {
         question_id: 'q1',
         response_text: 'Answer 1'
       });
       expect(api.post).toHaveBeenCalledWith('/api/quiz/response/', {
         question_id: 'q2',
         response_text: 'Part 1 | Part 2'
       });

       expect(result.status).toBe('success');
       expect(result.message).toBe('Saved 2 responses');
       expect(result.results).toHaveLength(2);
     });

     test('submitQuizAnswers should handle API errors', async () => {
       const taskId = '123';
       const answers = { 'q1': 'Answer 1' };

       const mockError = new Error('API error');
       api.post.mockReturnValue(Promise.reject(mockError));

       // Mock console.error to prevent test logs being polluted
       const originalConsoleError = console.error;
       console.error = vi.fn();

       await expect(QuizApiUtils.submitQuizAnswers(taskId, answers)).rejects.toThrow('API error');
       expect(console.error).toHaveBeenCalledWith('Error submitting quiz answers:', mockError);

       console.error = originalConsoleError;
     });

     test('submitQuizAnswers should handle empty answers object', async () => {
       const taskId = '123';
       const answers = {};

       const result = await QuizApiUtils.submitQuizAnswers(taskId, answers);

       expect(api.post).not.toHaveBeenCalled();
       expect(result.status).toBe('success');
       expect(result.message).toBe('Saved 0 responses');
       expect(result.results).toHaveLength(0);
     });

     test('submitQuizAnswers should handle with auth token', async () => {
       const taskId = '123';
       const answers = { 'q1': 'Answer 1' };
       const token = 'test-token';

       api.post.mockReturnValue(Promise.resolve({
         data: { id: '1', question_id: 'q1', response_text: 'Answer 1', result: 'correct' }
       }));

       const result = await QuizApiUtils.submitQuizAnswers(taskId, answers, token);

       expect(api.post).toHaveBeenCalledTimes(1);
       expect(result.status).toBe('success');
     });
   });
 });
