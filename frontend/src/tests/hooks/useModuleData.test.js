import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useModuleData } from '../../hooks/useModuleData';
import { QuizApiUtils } from '../../services/QuizApiUtils';

// Mock the QuizApiUtils
vi.mock('../../services/QuizApiUtils', () => ({
  QuizApiUtils: {
    getModule: vi.fn(),
    getModuleSpecificTasks: vi.fn(),
    getModuleContents: vi.fn(),
    getQuestions: vi.fn(),
    getComponentType: vi.fn(),
    getUIMediaTypeFromAPIType: vi.fn(),
    getUITypeFromAPIType: vi.fn()
  }
}));

describe('useModuleData', () => {
  const mockModule = { id: 'module-1', title: 'Test Module' };
  const mockTasks = [
    { contentID: 'task-1', quiz_type: 'multiple_choice' },
    { contentID: 'task-2', quiz_type: 'fill_blank' }
  ];
  const mockDocuments = [
    { contentID: 'doc-1', order_index: 1 },
    { contentID: 'doc-2', order_index: 2 }
  ];
  const mockAudios = [
    { contentID: 'audio-1', order_index: 3 }
  ];
  const mockImages = [
    { contentID: 'image-1', order_index: 4 }
  ];
  const mockVideos = [
    { contentID: 'video-1', order_index: 5 }
  ];
  const mockQuestions = [
    { id: 'question-1', content: 'Test question' }
  ];
  const mockInitialQuestionsRef = { current: {} };

  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();

    // Set up mock implementations
    QuizApiUtils.getModule.mockResolvedValue(mockModule);
    QuizApiUtils.getModuleSpecificTasks.mockResolvedValue(mockTasks);
    QuizApiUtils.getModuleContents.mockImplementation((moduleId, type) => {
      if (type === 'audio') return Promise.resolve(mockAudios);
      if (type === 'image') return Promise.resolve(mockImages);
      if (type === 'video') return Promise.resolve(mockVideos);
      return Promise.resolve(mockDocuments); // Default is documents
    });
    QuizApiUtils.getQuestions.mockResolvedValue(mockQuestions);
    QuizApiUtils.getComponentType.mockImplementation((quizType) => {
      if (quizType === 'audio' || quizType === 'document' || quizType === 'image' || quizType === 'video') return 'media';
      return 'quiz';
    });
    QuizApiUtils.getUIMediaTypeFromAPIType.mockImplementation((quizType) => {
      return quizType; // For simplicity, just return the same type
    });
    QuizApiUtils.getUITypeFromAPIType.mockImplementation((quizType) => {
      if (quizType === 'multiple_choice') return 'Multiple Choice';
      if (quizType === 'fill_blank') return 'Fill in the Blank';
      return 'Unknown Type';
    });

    // Mock console.log and console.error
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should initialize with empty modules array', () => {
    const { result } = renderHook(() => useModuleData('edit-1'));

    expect(result.current.modules).toEqual([]);
    expect(typeof result.current.setModules).toBe('function');
    expect(typeof result.current.fetchModuleData).toBe('function');
  });

  it('should fetch module data successfully', async () => {
    const { result } = renderHook(() => useModuleData('edit-1'));

    let moduleData;
    await act(async () => {
      moduleData = await result.current.fetchModuleData('module-1', mockInitialQuestionsRef);
    });

    // Verify module data was returned
    expect(moduleData).toEqual(mockModule);

    // Verify API calls were made with correct parameters
    expect(QuizApiUtils.getModule).toHaveBeenCalledWith('module-1');
    expect(QuizApiUtils.getModuleSpecificTasks).toHaveBeenCalledWith('module-1');
    expect(QuizApiUtils.getModuleContents).toHaveBeenCalledWith('module-1');
    expect(QuizApiUtils.getModuleContents).toHaveBeenCalledWith('module-1', 'audio');
    expect(QuizApiUtils.getModuleContents).toHaveBeenCalledWith('module-1', 'image');
    expect(QuizApiUtils.getModuleContents).toHaveBeenCalledWith('module-1', 'video');

    // Verify questions were fetched for each task
    expect(QuizApiUtils.getQuestions).toHaveBeenCalledWith('task-1');
    expect(QuizApiUtils.getQuestions).toHaveBeenCalledWith('task-2');

    // Verify questions were stored in initialQuestionsRef
    expect(mockInitialQuestionsRef.current['task-1']).toEqual(mockQuestions);
    expect(mockInitialQuestionsRef.current['task-2']).toEqual(mockQuestions);

    // Verify modules state was updated with correct structure
    expect(result.current.modules.length).toBe(7); // 2 tasks + 2 docs + 1 audio + 1 image + 1 video

    // Verify task modules structure
    const taskModules = result.current.modules.filter(m => m.componentType === 'quiz');
    expect(taskModules.length).toBe(2);
    expect(taskModules[0].id).toBe('task-1');
    expect(taskModules[0].type).toBe('Multiple Choice');

    // Verify document modules structure
    const docModules = result.current.modules.filter(m => m.type === 'Upload Document');
    expect(docModules.length).toBe(2);
    expect(docModules[0].id).toBe('doc-1');
    expect(docModules[0].mediaType).toBe('document');
  });

  it('should handle missing initialQuestionsRef', async () => {
    const { result } = renderHook(() => useModuleData('edit-1'));

    let moduleData;
    await act(async () => {
      moduleData = await result.current.fetchModuleData('module-1');
    });

    // Verify module data was still fetched successfully
    expect(moduleData).toEqual(mockModule);

    // Verify API calls were made with correct parameters
    expect(QuizApiUtils.getModule).toHaveBeenCalledWith('module-1');
    expect(QuizApiUtils.getModuleSpecificTasks).toHaveBeenCalledWith('module-1');

    // Verify questions were NOT fetched for tasks (since initialQuestionsRef is undefined)
    expect(QuizApiUtils.getQuestions).not.toHaveBeenCalled();
  });

  it('should handle errors in API calls', async () => {
    // Mock API errors
    const apiError = new Error('API Error');
    QuizApiUtils.getModuleSpecificTasks.mockRejectedValue(apiError);
    QuizApiUtils.getModuleContents.mockRejectedValue(apiError);

    const { result } = renderHook(() => useModuleData('edit-1'));

    let moduleData;
    await act(async () => {
      moduleData = await result.current.fetchModuleData('module-1', mockInitialQuestionsRef);
    });

    // Verify module data was still returned
    expect(moduleData).toEqual(mockModule);

    // Verify errors were logged
    expect(console.error).toHaveBeenCalledWith("Error fetching tasks:", apiError);
    expect(console.error).toHaveBeenCalledWith("Error fetching documents:", apiError);
    expect(console.error).toHaveBeenCalledWith("Error fetching audio clips:", apiError);
    expect(console.error).toHaveBeenCalledWith("Error fetching inline images:", apiError);
    expect(console.error).toHaveBeenCalledWith("Error fetching embedded videos:", apiError);

    // Verify modules state was updated with empty arrays
    expect(result.current.modules).toEqual([]);
  });

  it('should handle errors in getQuestions', async () => {
    // Mock getQuestions to reject
    const questionsError = new Error('Questions API Error');
    QuizApiUtils.getQuestions.mockRejectedValue(questionsError);

    const { result } = renderHook(() => useModuleData('edit-1'));

    await act(async () => {
      await result.current.fetchModuleData('module-1', mockInitialQuestionsRef);
    });

    // Verify errors were logged
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Error fetching questions for task"), questionsError);

    // Verify initialQuestionsRef was set to empty arrays for failed tasks
    expect(mockInitialQuestionsRef.current['task-1']).toEqual([]);
    expect(mockInitialQuestionsRef.current['task-2']).toEqual([]);
  });

  it('should handle error in getModule', async () => {
    // Mock getModule to reject
    const moduleError = new Error('Module API Error');
    QuizApiUtils.getModule.mockRejectedValue(moduleError);

    const { result } = renderHook(() => useModuleData('edit-1'));

    // Should throw the error from fetchModuleData
    await expect(async () => {
      await act(async () => {
        await result.current.fetchModuleData('module-1', mockInitialQuestionsRef);
      });
    }).rejects.toThrow('Module API Error');

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith("Error fetching module data:", moduleError);
  });

  it('should sort media resources by order_index', async () => {
    // Set different order indices
    const outOfOrderDocs = [
      { contentID: 'doc-1', order_index: 5 }, // Higher order index
      { contentID: 'doc-2', order_index: 2 }
    ];
    const outOfOrderAudios = [
      { contentID: 'audio-1', order_index: 1 } // Lower order index
    ];

    QuizApiUtils.getModuleContents.mockImplementation((moduleId, type) => {
      if (type === 'audio') return Promise.resolve(outOfOrderAudios);
      if (type === 'image') return Promise.resolve(mockImages);
      if (type === 'video') return Promise.resolve(mockVideos);
      return Promise.resolve(outOfOrderDocs);
    });

    const { result } = renderHook(() => useModuleData('edit-1'));

    await act(async () => {
      await result.current.fetchModuleData('module-1', mockInitialQuestionsRef);
    });

    // Get all media resources (documents, audios, images, videos)
    const mediaResources = result.current.modules.filter(m => m.componentType === 'media');

    // Verify they are ordered by order_index
    expect(mediaResources[0].id).toBe('audio-1'); // order_index: 1
    expect(mediaResources[1].id).toBe('doc-2');   // order_index: 2
    expect(mediaResources[2].id).toBe('image-1'); // order_index: 4
    expect(mediaResources[3].id).toBe('doc-1');   // order_index: 5
  });

  it('should handle missing order_index by defaulting to 0', async () => {
    // Mock docs with missing order_index
    const docsWithMissingOrderIndex = [
      { contentID: 'doc-1' }, // Missing order_index
      { contentID: 'doc-2', order_index: 2 }
    ];

    QuizApiUtils.getModuleContents.mockImplementation((moduleId, type) => {
      if (type === 'audio') return Promise.resolve(mockAudios);
      if (type === 'image') return Promise.resolve(mockImages);
      if (type === 'video') return Promise.resolve(mockVideos);
      return Promise.resolve(docsWithMissingOrderIndex);
    });

    const { result } = renderHook(() => useModuleData('edit-1'));

    await act(async () => {
      await result.current.fetchModuleData('module-1', mockInitialQuestionsRef);
    });

    // Find the document with missing order_index
    const docWithDefaultOrder = result.current.modules.find(m => m.id === 'doc-1');

    // Verify it has order_index set to 0
    expect(docWithDefaultOrder.order_index).toBe(0);
  });
});