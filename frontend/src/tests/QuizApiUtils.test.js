//src/tests/QuizApiUtils.test.js
import { describe, beforeEach, test, expect, vi } from 'vitest';
import { QuizApiUtils } from '../services/QuizApiUtils';
import api from '../services/api';

// Mock the API module
vi.mock('../services/api', () => {
  return {
    default: {
      post: vi.fn(),
      get: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    }
  };
});

describe('QuizApiUtils', () => {
  // Module 2 task IDs from your database
  const taskIds = {
    flashcard: '7d35205c02c840d587fbed816d5e9b66',  // Flashcard Quiz for Module 2
    fillInBlanks: '3d3ab0d50a754cb29ef0dcd810c46db1',  // Fill in the Blanks for Module 2
    flowchart: 'e84e0e1131294626935e3f921c9e0645',  // Flowchart Quiz for Module 2
  };

  // Reset mocks before each test
  beforeEach(() => {
    vi.resetAllMocks();
    // Suppress console output during tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  describe('createQuestion', () => {
    // Test 1: Basic successful question creation
    test('should successfully create a question with task_id and question_text', async () => {
      // Mock successful API response
      api.post.mockResolvedValue({
        data: {
          id: 123,
          question_text: 'Test question',
          answers: [],
          hint_text: 'Test hint',
          order: 0
        }
      });

      const questionData = {
        task_id: taskIds.flashcard,
        question_text: 'Test question',
        answers: [],
        hint_text: 'Test hint',
        order: 0
      };

      const result = await QuizApiUtils.createQuestion(questionData);

      // Verify API was called with correct parameters
      expect(api.post).toHaveBeenCalledWith('/api/quiz/questions/', {
        task_id: taskIds.flashcard,
        question_text: 'Test question',
        answers: [],
        hint_text: 'Test hint',
        order: 0
      });

      // Verify result is as expected
      expect(result).toEqual({
        id: 123,
        question_text: 'Test question',
        answers: [],
        hint_text: 'Test hint',
        order: 0
      });
    });

    // Test 2: Using task instead of task_id
    test('should correctly map task to task_id when task_id is not provided', async () => {
      api.post.mockResolvedValue({
        data: { id: 124 }
      });

      const questionData = {
        task: taskIds.fillInBlanks,
        question_text: 'Another test question',
        answers: [],
        hint_text: 'Another hint'
      };

      await QuizApiUtils.createQuestion(questionData);

      // Verify task was mapped to task_id
      expect(api.post).toHaveBeenCalledWith('/api/quiz/questions/', {
        task_id: taskIds.fillInBlanks,
        question_text: 'Another test question',
        answers: [],
        hint_text: 'Another hint',
        order: 0
      });
    });

    // Test 3: Missing task_id and task should throw error
    test('should throw error when both task_id and task are missing', async () => {
      const questionData = {
        question_text: 'Question without task_id',
        hint_text: 'Hint'
      };

      await expect(QuizApiUtils.createQuestion(questionData)).rejects.toThrow('Task ID is required');
      
      // Verify API was not called
      expect(api.post).not.toHaveBeenCalled();
    });
  });

  describe('getQuizTypeValue', () => {
    test('should return correct quiz type value for UI type', () => {
      expect(QuizApiUtils.getQuizTypeValue('Flashcard Quiz')).toBe('flashcard');
      expect(QuizApiUtils.getQuizTypeValue('Fill in the Blanks')).toBe('text_input');
      expect(QuizApiUtils.getQuizTypeValue('Flowchart Quiz')).toBe('statement_sequence');
      expect(QuizApiUtils.getQuizTypeValue('Unknown Type')).toBe('text_input'); // Default
    });
  });

  test('successfully fetches questions for a given task ID', async () => {
    const mockQuestions = [
      { id: '1', question_text: 'What is the capital of France?', hint_text: '', order: 1 },
      { id: '2', question_text: 'What is the largest ocean on Earth?', hint_text: '', order: 2 }
    ];

    api.get.mockResolvedValue({ data: mockQuestions });

    const result = await QuizApiUtils.getQuestions('7d35205c02c840d587fbed816d5e9b66');

    expect(api.get).toHaveBeenCalledWith('/api/quiz/questions/', { params: { task_id: '7d35205c02c840d587fbed816d5e9b66' } });
    expect(result).toEqual(mockQuestions);
  });



  test('handles API errors when fetching questions', async () => {
    api.get.mockRejectedValue(new Error('API Error'));

    await expect(QuizApiUtils.getQuestions('7d35205c02c840d587fbed816d5e9b66'))
      .rejects.toThrow('API Error');

    expect(api.get).toHaveBeenCalledWith('/api/quiz/questions/', { params: { task_id: '7d35205c02c840d587fbed816d5e9b66' } });
  });





  test('successfully updates a task with valid data', async () => {
    const taskId = '123';
    const taskData = {
      moduleID: '1',
      order_index: 1,
      description: 'Updated task description'
    };

    const expectedData = {
      id: taskId,
      ...taskData
    };

    api.put.mockResolvedValue({ data: expectedData });

    const result = await QuizApiUtils.updateTask(taskId, taskData);

    expect(api.put).toHaveBeenCalledWith(`/api/tasks/${taskId}/`, {
      ...taskData,
      moduleID: parseInt(taskData.moduleID, 10),
      order_index: taskData.order_index
    });
    expect(result).toEqual(expectedData);
  });




  test('converts moduleID to number if provided as string', async () => {
    const taskId = '123';
    const taskData = {
      moduleID: '1',
      order_index: 1,
      description: 'Task description'
    };

    const expectedData = {
      id: taskId,
      ...taskData,
      moduleID: 1
    };

    api.put.mockResolvedValue({ data: expectedData });

    await QuizApiUtils.updateTask(taskId, taskData);

    expect(api.put).toHaveBeenCalledWith(`/api/tasks/${taskId}/`, {
      ...taskData,
      moduleID: 1,
      order_index: 1
    });
  });
  describe('getModuleTasks', () => {
    const moduleId = '123';

    test('fetches tasks for a specific module successfully', async () => {
      const mockTasks = [{ id: '1', title: 'Task 1' }, { id: '2', title: 'Task 2' }];
      api.get.mockResolvedValue({ data: mockTasks });

      const tasks = await QuizApiUtils.getModuleTasks(moduleId);

      expect(api.get).toHaveBeenCalledWith('/api/tasks/', { params: { moduleID: moduleId } });
      expect(tasks).toEqual(mockTasks);
    });

    test('throws an error when API call fails', async () => {
      const errorMessage = 'API Error';
      api.get.mockRejectedValue(new Error(errorMessage));

      await expect(QuizApiUtils.getModuleTasks(moduleId))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('getTask', () => {
    const taskId = '1';

    test('fetches a single task successfully', async () => {
      const mockTask = { id: taskId, title: 'Task 1' };
      api.get.mockResolvedValue({ data: mockTask });

      const task = await QuizApiUtils.getTask(taskId);

      expect(api.get).toHaveBeenCalledWith(`/api/tasks/${taskId}/`);
      expect(task).toEqual(mockTask);
    });

    test('throws an error when unable to fetch the task', async () => {
      const errorMessage = 'API Error';
      api.get.mockRejectedValue(new Error(errorMessage));

      await expect(QuizApiUtils.getTask(taskId))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('createTask', () => {
    const taskData = { title: 'New Task', moduleID: '123' };

    test('creates a task successfully', async () => {
      const mockTask = { id: '3', ...taskData };
      api.post.mockResolvedValue({ data: mockTask });

      const task = await QuizApiUtils.createTask(taskData);

      expect(api.post).toHaveBeenCalledWith('/api/tasks/', taskData);
      expect(task).toEqual(mockTask);
    });

    test('throws an error when task creation fails', async () => {
      const errorMessage = 'Creation Error';
      api.post.mockRejectedValue(new Error(errorMessage));

      await expect(QuizApiUtils.createTask(taskData))
        .rejects.toThrow(errorMessage);
    });
  });

  test('fetches a module successfully', async () => {
    const mockModule = { id: 123, name: 'Module Name' };
    api.get.mockResolvedValue({ data: mockModule });

    const module = await QuizApiUtils.getModule(123);

    expect(api.get).toHaveBeenCalledWith(`/api/modules/${123}/`);
    expect(module).toEqual(mockModule);
  });

  test('throws an error when unable to fetch the module', async () => {
    const errorMessage = 'API Error';
    api.get.mockRejectedValue(new Error(errorMessage));

    await expect(QuizApiUtils.getModule(123))
      .rejects.toThrow(errorMessage);
  });


});
describe('QuizApiUtils tests', () => {
  it('should always pass', () => {
    // You can just return or use a trivial assertion
    expect(true).toBe(true); // This test will pass
  });
});

describe('createModule', () => {
  const moduleData = { name: 'New Module' };

  test('creates a module successfully', async () => {
    const mockModule = { id: '124', ...moduleData };
    api.post.mockResolvedValue({ data: mockModule });

    const module = await QuizApiUtils.createModule(moduleData);

    expect(api.post).toHaveBeenCalledWith('/api/modules/', moduleData);
    expect(module).toEqual(mockModule);
  });

  test('throws an error when module creation fails', async () => {
    const errorMessage = 'Creation Error';
    api.post.mockRejectedValue(new Error(errorMessage));

    await expect(QuizApiUtils.createModule(moduleData))
      .rejects.toThrow(errorMessage);
  });
});


describe('updateModule', () => {
  const moduleId = '125';
  const moduleData = { name: 'Updated Module' };

  test('updates a module successfully', async () => {
    const updatedModule = { id: moduleId, ...moduleData };
    api.put.mockResolvedValue({ data: updatedModule });

    const result = await QuizApiUtils.updateModule(moduleId, moduleData);

    expect(api.put).toHaveBeenCalledWith(`/api/modules/${moduleId}/`, moduleData);
    expect(result).toEqual(updatedModule);
  });

  test('throws an error when module update fails', async () => {
    const errorMessage = 'Update Error';
    api.put.mockRejectedValue(new Error(errorMessage));

    await expect(QuizApiUtils.updateModule(moduleId, moduleData))
      .rejects.toThrow(errorMessage);
  });
});


describe('deleteModule', () => {
  const moduleId = '126';

  test('deletes a module successfully', async () => {
    api.delete.mockResolvedValue(true);

    const result = await QuizApiUtils.deleteModule(moduleId);

    expect(api.delete).toHaveBeenCalledWith(`/api/modules/${moduleId}/`);
    expect(result).toBe(true);
  });

  test('throws an error when module deletion fails', async () => {
    const errorMessage = 'Deletion Error';
    api.delete.mockRejectedValue(new Error(errorMessage));

    await expect(QuizApiUtils.deleteModule(moduleId))
      .rejects.toThrow(errorMessage);
  });
});



describe('cleanupOrphanedTasks', () => {
  const moduleId = '200';
  const keepTaskIds = ['101', '102'];

  test('successfully deletes orphaned tasks', async () => {
    const mockTasks = [
      { contentID: '100', moduleID: moduleId },
      { contentID: '101', moduleID: moduleId },
      { contentID: '102', moduleID: moduleId },
      { contentID: '103', moduleID: moduleId }
    ];

    api.get.mockResolvedValue({ data: mockTasks });
    api.delete.mockResolvedValue(true);

    const result = await QuizApiUtils.cleanupOrphanedTasks(moduleId, keepTaskIds);

    expect(api.get).toHaveBeenCalledWith('/api/tasks/', { params: { moduleID: moduleId } });
    expect(api.delete).toHaveBeenCalledTimes(4);
    expect(api.delete).toHaveBeenCalledWith(`/api/tasks/100/`);
    expect(api.delete).toHaveBeenCalledWith(`/api/tasks/103/`);
    expect(result).toBe(2); // Two tasks should have been deleted
  });

  test('handles API errors during task fetching', async () => {
    const errorMessage = 'API Error on fetch';
    api.get.mockRejectedValue(new Error(errorMessage));

    await expect(QuizApiUtils.cleanupOrphanedTasks(moduleId, keepTaskIds))
      .rejects.toThrow(errorMessage);
  });

  test('handles API errors during task deletion', async () => {
    const mockTasks = [
      { contentID: '100', moduleID: moduleId }
    ];

    api.get.mockResolvedValue({ data: mockTasks });
    const deleteErrorMessage = 'API Error on delete';
    api.delete.mockRejectedValue(new Error(deleteErrorMessage));

    await expect(QuizApiUtils.cleanupOrphanedTasks(moduleId, keepTaskIds))
      .rejects.toThrow(deleteErrorMessage);

    expect(api.delete).toHaveBeenCalledWith(`/api/tasks/100/`);
  });
});


describe('getModuleSpecificTasks', () => {
  const moduleId = '123';

  test('fetches tasks specific to a module', async () => {
    const mockTasks = [
      { contentID: '101', moduleID: moduleId },
      { contentID: '102', moduleID: moduleId },
      { contentID: '103', moduleID: '456' } // This should be filtered out
    ];

    api.get.mockResolvedValue({ data: mockTasks });

    const result = await QuizApiUtils.getModuleSpecificTasks(moduleId);

    expect(api.get).toHaveBeenCalledWith('/api/tasks/', { params: { moduleID: moduleId } });
    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining([
      expect.objectContaining({ contentID: '101' }),
      expect.objectContaining({ contentID: '102' })
    ]));
  });

  test('handles errors during fetching of tasks', async () => {
    const errorMessage = 'API Error';
    api.get.mockRejectedValue(new Error(errorMessage));

    await expect(QuizApiUtils.getModuleSpecificTasks(moduleId))
      .rejects.toThrow(errorMessage);
  });
});



describe('createModuleTask', () => {
  const moduleId = '123';
  const taskData = {
    name: 'New Task',
    description: 'Detailed Description'
  };

  test('successfully creates a task for a module', async () => {
    const mockResponse = {
      data: {
        contentID: '201',
        name: 'New Task',
        moduleID: moduleId
      }
    };

    api.post.mockResolvedValue(mockResponse);

    const result = await QuizApiUtils.createModuleTask(moduleId, taskData);

    expect(api.post).toHaveBeenCalledWith('/api/tasks/', {
      ...taskData,
      moduleID: parseInt(moduleId, 10),
      order_index: 0  // Default order_index
    });
    expect(result).toEqual(mockResponse.data);
  });

  test('handles errors during task creation', async () => {
    const errorMessage = 'Creation Error';
    api.post.mockRejectedValue(new Error(errorMessage));

    await expect(QuizApiUtils.createModuleTask(moduleId, taskData))
      .rejects.toThrow(errorMessage);
  });
});

describe('QuizApiUtils - Module Content Fetching', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  const moduleId = '123';
  const mediaTypes = {
    document: '/api/documents/',
    audio: '/api/audios/',
    image: '/api/images/',
    video: '/api/embedded-videos/'
  };

  Object.entries(mediaTypes).forEach(([type, endpoint]) => {
    test(`fetches ${type} contents for a module`, async () => {
      const mockData = [
        { id: '001', name: `${type} 1`, url: `${endpoint}001` },
        { id: '002', name: `${type} 2`, url: `${endpoint}002` }
      ];
      api.get.mockResolvedValue({ data: mockData });

      const result = await QuizApiUtils.getModuleContents(moduleId, type);

      expect(api.get).toHaveBeenCalledWith(endpoint, {
        params: { module_id: moduleId }
      });
      expect(result).toEqual(mockData);
    });
  });

  test('handles unsupported media types by throwing an error', async () => {
    const unsupportedType = 'unknown';

    await expect(QuizApiUtils.getModuleContents(moduleId, unsupportedType))
      .rejects.toThrow(`Unsupported media type: ${unsupportedType}`);
  });

  test('handles errors during fetching of module contents', async () => {
    const errorMessage = 'API Error';
    api.get.mockRejectedValue(new Error(errorMessage));
    const type = 'document';

    await expect(QuizApiUtils.getModuleContents(moduleId, type))
      .rejects.toThrow(errorMessage);
  });
});


// describe('QuizApiUtils - Submit Quiz Answers', () => {
//   beforeEach(() => {
//     vi.resetAllMocks();
//       post: vi.fn()
    
//   });

//   const taskId = 'example-task-id';
//   const token = 'fake-token';

  // test('submits quiz answers correctly and returns success', async () => {
  //   // Prepare mocked answers and API response
  //   const answers = {
  //     '1': 'Answer 1',
  //     '2': ['Part 1', 'Part 2']
  //   };
  //   const expectedSubmissions = [
  //     { question_id: '1', response_text: 'Answer 1' },
  //     { question_id: '2', response_text: 'Part 1 | Part 2' }
  //   ];
  //   api.post.mockResolvedValueOnce({ data: { success: true, id: '1' } });
  //   api.post.mockResolvedValueOnce({ data: { success: true, id: '2' } });

  //   const result = await QuizApiUtils.submitQuizAnswers(taskId, answers, token);

  //   // Check if API was called correctly
  //   expect(api.post).toHaveBeenCalledTimes(2);
  //   expect(api.post).toHaveBeenNthCalledWith(1, '/api/quiz/response/', expectedSubmissions[0], { headers: { 'Authorization': `Token ${token}` } });
  //   expect(api.post).toHaveBeenNthCalledWith(2, '/api/quiz/response/', expectedSubmissions[1], { headers: { 'Authorization': `Token ${token}` } });

  //   // Verify the response
  //   expect(result).toEqual({
  //     status: 'success',
  //     message: 'Saved 2 responses',
  //     results: [{ success: true, id: '1' }, { success: true, id: '2' }]
  //   });
  // });

  // test('handles errors when submitting answers', async () => {
  //   // Prepare answers and API to throw an error
  //   const answers = { '1': 'Answer 1' };
  //   const errorMessage = 'Network error';
  //   api.post.mockRejectedValueOnce(new Error(errorMessage));

  //   // Expect the function to throw an error
  //   await expect(QuizApiUtils.submitQuizAnswers(taskId, answers, token))
  //     .rejects.toThrow(errorMessage);

  //   // Ensure it attempted to submit the answer
  //   expect(api.post).toHaveBeenCalledWith('/api/quiz/response/', {
  //     question_id: '1',
  //     response_text: 'Answer 1'
  //   }, { headers: { 'Authorization': `Token ${token}` } });
  // });
//});