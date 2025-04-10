import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import React from 'react';
import MatchingQuestionsQuiz from '../../../components/quizzes/MatchingQuestionsQuiz';
import { QuizApiUtils } from '../../../services/QuizApiUtils';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

// Mock react-dnd hooks
vi.mock('react-dnd', async () => {
  const actual = await vi.importActual('react-dnd');
  return {
    ...actual,
    useDrag: () => [{ isDragging: false }, vi.fn()],
    useDrop: () => [{ isOver: false }, vi.fn()]
  };
});

// Mock QuizApiUtils
vi.mock('../../../services/QuizApiUtils', () => ({
  QuizApiUtils: {
    getQuestions: vi.fn()
  }
}));

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: vi.fn((key) => store[key]),
    setItem: vi.fn((key, value) => {
      store[key] = value;
    }),
    clear: vi.fn(() => {
      store = {};
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    })
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock data
const mockPairs = [
  { id: '1', text: 'Question 1', answers: ['Answer A', 'Answer B', 'Answer C'], order: 1 },
  { id: '2', text: 'Question 2', answers: ['Answer D', 'Answer E', 'Answer F'], order: 0 }
];

// Helper to render with DndProvider
const renderWithDnd = (ui) => {
  return render(
    <DndProvider backend={HTML5Backend}>
      {ui}
    </DndProvider>
  );
};

describe('MatchingQuestionsQuiz', () => {
  // Mocks for common functions and props
  const mockOnComplete = vi.fn();
  const mockTaskId = 'task-123';

  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
    QuizApiUtils.getQuestions.mockResolvedValue(mockPairs);

    // Mocking console methods
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('useEffect for initialization', () => {
    it('should fetch pairs and initialize state on mount - happy path', async () => {
      renderWithDnd(<MatchingQuestionsQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

      // Test loading state
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Wait for data to load
      await waitFor(() => {
        expect(QuizApiUtils.getQuestions).toHaveBeenCalledWith(mockTaskId);
        expect(screen.getByText('Question 1')).toBeInTheDocument();
        expect(screen.getByText('Question 2')).toBeInTheDocument();
      });
    });

    it('should sort pairs by order', async () => {
      renderWithDnd(<MatchingQuestionsQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

      await waitFor(() => {
        const questions = screen.getAllByText(/Question/);
        // First should be Question 2 due to lower order value (0)
        expect(questions[0]).toHaveTextContent('Question 2');
        expect(questions[1]).toHaveTextContent('Question 1');
      });
    });

    it('should initialize with preview questions when in preview mode', async () => {
      const previewQuestions = [
        { id: 'p1', text: 'Preview 1', possible_answers: ['PAnswer A', 'PAnswer B'], order: 0 }
      ];

      renderWithDnd(
        <MatchingQuestionsQuiz
          taskId={mockTaskId}
          onComplete={mockOnComplete}
          isPreview={true}
          previewQuestions={previewQuestions}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Preview 1')).toBeInTheDocument();
        expect(screen.getByText('PAnswer A')).toBeInTheDocument();
        expect(QuizApiUtils.getQuestions).not.toHaveBeenCalled();
      });
    });

    it('should handle quiz already completed in parent component', async () => {
      const completedContentIds = new Set([mockTaskId]);
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        submittedAnswers: { '1': 'Answer A', '2': 'Answer D' },
        isCompleted: true
      }));

      renderWithDnd(
        <MatchingQuestionsQuiz
          taskId={mockTaskId}
          onComplete={mockOnComplete}
          completedContentIds={completedContentIds}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Quiz completed successfully!')).toBeInTheDocument();
        expect(screen.getByText('Answer A')).toBeInTheDocument();
        expect(screen.getByText('Answer D')).toBeInTheDocument();
      });
    });

    it('should handle API fetch error', async () => {
      // Mock API error
      QuizApiUtils.getQuestions.mockRejectedValue(new Error('API error'));

      renderWithDnd(<MatchingQuestionsQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Error: Failed to load data.')).toBeInTheDocument();
        expect(console.error).toHaveBeenCalled();
      });
    });

    it('should handle no questions returned from API', async () => {
      // Mock empty response
      QuizApiUtils.getQuestions.mockResolvedValue([]);

      renderWithDnd(<MatchingQuestionsQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Error: No data available.')).toBeInTheDocument();
      });
    });

    it('should handle localStorage errors when trying to load saved state', async () => {
      const completedContentIds = new Set([mockTaskId]);
      localStorageMock.getItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      renderWithDnd(
        <MatchingQuestionsQuiz
          taskId={mockTaskId}
          onComplete={mockOnComplete}
          completedContentIds={completedContentIds}
        />
      );

      await waitFor(() => {
        expect(console.error).toHaveBeenCalledWith(
          "Failed to load saved quiz state",
          expect.any(Error)
        );
      });
    });
  });

  describe('handleDrop', () => {
    it('should update userAnswers when an answer is dropped - happy path', async () => {
      const { container } = renderWithDnd(<MatchingQuestionsQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Since we can't easily test drag and drop with the mocked useDrop/useDrag,
      // we'll expose a test function by monkey patching the component instance

      // Find the component instance
      const instance = container.querySelector('.container').__reactFiber$;

      // Directly call handleDrop
      let fiber = instance;
      while (fiber) {
        if (fiber.memoizedProps && typeof fiber.memoizedProps.handleDrop === 'function') {
          fiber.memoizedProps.handleDrop('1', 'Answer A');
          break;
        }
        fiber = fiber.return;
      }

      // Check that the answer is selected (would have a 'selected' class)
      // Note: This test approach is fragile and depends on implementation details
      // A better approach would be to refactor the component to expose test hooks

      // For now, let's verify indirectly by checking UI effects after we try to validate
      fireEvent.click(screen.getByText('Continue'));

      // We should see one less validation error for the question we answered
      await waitFor(() => {
        const errors = screen.getAllByText('Answer required');
        expect(errors.length).toBe(1); // Only one question still needs an answer
      });
    });

    it('should clear validation errors when an answer is provided', async () => {
      // First, trigger validation errors
      const { container } = renderWithDnd(<MatchingQuestionsQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Validate to generate errors
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getAllByText('Answer required').length).toBe(2);
      });

      // Now directly call handleDrop
      let fiber = container.querySelector('.container').__reactFiber$;
      while (fiber) {
        if (fiber.memoizedProps && typeof fiber.memoizedProps.handleDrop === 'function') {
          fiber.memoizedProps.handleDrop('1', 'Answer A');
          break;
        }
        fiber = fiber.return;
      }

      // Check that validation error was cleared for the answered question
      await waitFor(() => {
        const errors = screen.getAllByText('Answer required');
        expect(errors.length).toBe(1); // Only one question still has an error
      });
    });
  });

  describe('validateQuiz', () => {
    it('should validate all questions are answered - happy path', async () => {
      const { container } = renderWithDnd(<MatchingQuestionsQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Directly call handleDrop to set answers for all questions
      let fiber = container.querySelector('.container').__reactFiber$;
      let handleDrop;
      while (fiber) {
        if (fiber.memoizedProps && typeof fiber.memoizedProps.handleDrop === 'function') {
          handleDrop = fiber.memoizedProps.handleDrop;
          break;
        }
        fiber = fiber.return;
      }

      // Set answers for both questions
      if (handleDrop) {
        act(() => {
          handleDrop('1', 'Answer A');
          handleDrop('2', 'Answer D');
        });
      }

      // Click validate button
      fireEvent.click(screen.getByText('Continue'));

      // Should move to review mode when all questions are answered
      await waitFor(() => {
        expect(screen.getByText('Review Your Answers')).toBeInTheDocument();
      });
    });

    it('should show validation errors for unanswered questions', async () => {
      renderWithDnd(<MatchingQuestionsQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Click validate button without answering any questions
      fireEvent.click(screen.getByText('Continue'));

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Please match all questions with answers before continuing.')).toBeInTheDocument();
        expect(screen.getAllByText('Answer required').length).toBe(2);
      });
    });
  });

  describe('handleValidateAnswers', () => {
    it('should move to review mode when validation succeeds', async () => {
      const { container } = renderWithDnd(<MatchingQuestionsQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Directly call handleDrop to set answers
      let fiber = container.querySelector('.container').__reactFiber$;
      let handleDrop;
      while (fiber) {
        if (fiber.memoizedProps && typeof fiber.memoizedProps.handleDrop === 'function') {
          handleDrop = fiber.memoizedProps.handleDrop;
          break;
        }
        fiber = fiber.return;
      }

      // Set answers for both questions
      if (handleDrop) {
        act(() => {
          handleDrop('1', 'Answer A');
          handleDrop('2', 'Answer D');
        });
      }

      // Click validate button
      fireEvent.click(screen.getByText('Continue'));

      // Should move to review mode
      await waitFor(() => {
        expect(screen.getByText('Review Your Answers')).toBeInTheDocument();
      });
    });

    it('should not move to review mode when validation fails', async () => {
      renderWithDnd(<MatchingQuestionsQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Click validate button without answering
      fireEvent.click(screen.getByText('Continue'));

      // Should not move to review mode
      expect(screen.queryByText('Review Your Answers')).not.toBeInTheDocument();
      // Should show validation errors instead
      expect(screen.getByText('Please match all questions with answers before continuing.')).toBeInTheDocument();
    });
  });

  describe('handleSubmitAnswers', () => {
    it('should mark quiz as completed and call onComplete - happy path', async () => {
      const { container } = renderWithDnd(<MatchingQuestionsQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Directly call handleDrop to set answers
      let fiber = container.querySelector('.container').__reactFiber$;
      let handleDrop;
      while (fiber) {
        if (fiber.memoizedProps && typeof fiber.memoizedProps.handleDrop === 'function') {
          handleDrop = fiber.memoizedProps.handleDrop;
          break;
        }
        fiber = fiber.return;
      }

      // Set answers for both questions
      if (handleDrop) {
        act(() => {
          handleDrop('1', 'Answer A');
          handleDrop('2', 'Answer D');
        });
      }

      // Click validate button to move to review mode
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText('Review Your Answers')).toBeInTheDocument();
      });

      // Now submit answers
      fireEvent.click(screen.getByText('Submit Answers'));

      // Quiz should be completed
      await waitFor(() => {
        expect(screen.getByText('Quiz completed successfully!')).toBeInTheDocument();
        expect(mockOnComplete).toHaveBeenCalledWith({
          '1': 'Answer A',
          '2': 'Answer D'
        });
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          `matching-quiz-state-${mockTaskId}`,
          expect.any(String)
        );
      });
    });

    it('should handle preview mode submission', async () => {
      const previewQuestions = [
        { id: 'p1', text: 'Preview 1', possible_answers: ['PAnswer A', 'PAnswer B'], order: 0 }
      ];

      const { container } = renderWithDnd(
        <MatchingQuestionsQuiz
          taskId={mockTaskId}
          onComplete={mockOnComplete}
          isPreview={true}
          previewQuestions={previewQuestions}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Preview 1')).toBeInTheDocument();
      });

      // Directly call handleDrop to set answers
      let fiber = container.querySelector('.container').__reactFiber$;
      let handleDrop;
      while (fiber) {
        if (fiber.memoizedProps && typeof fiber.memoizedProps.handleDrop === 'function') {
          handleDrop = fiber.memoizedProps.handleDrop;
          break;
        }
        fiber = fiber.return;
      }

      // Set answer for the preview question
      if (handleDrop) {
        act(() => {
          handleDrop('p1', 'PAnswer A');
        });
      }

      // Click validate button to move to review mode
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText('Review Your Answers')).toBeInTheDocument();
      });

      // Now submit answers in preview mode
      fireEvent.click(screen.getByText('Submit Answers'));

      // Should call onComplete with preview flag
      expect(mockOnComplete).toHaveBeenCalledWith({ preview: true });
    });

    it('should handle localStorage errors during save', async () => {
      const { container } = renderWithDnd(<MatchingQuestionsQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Directly call handleDrop to set answers
      let fiber = container.querySelector('.container').__reactFiber$;
      let handleDrop;
      while (fiber) {
        if (fiber.memoizedProps && typeof fiber.memoizedProps.handleDrop === 'function') {
          handleDrop = fiber.memoizedProps.handleDrop;
          break;
        }
        fiber = fiber.return;
      }

      // Set answers for both questions
      if (handleDrop) {
        act(() => {
          handleDrop('1', 'Answer A');
          handleDrop('2', 'Answer D');
        });
      }

      // Click validate button to move to review mode
      fireEvent.click(screen.getByText('Continue'));

      await waitFor(() => {
        expect(screen.getByText('Review Your Answers')).toBeInTheDocument();
      });

      // Mock localStorage error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('localStorage error');
      });

      // Now submit answers
      fireEvent.click(screen.getByText('Submit Answers'));

      // Should still complete the quiz but log the error
      await waitFor(() => {
        expect(screen.getByText('Quiz completed successfully!')).toBeInTheDocument();
        expect(console.error).toHaveBeenCalledWith('Failed to save quiz state', expect.any(Error));
      });
    });
  });

  describe('resetQuiz', () => {
    it('should reset all quiz state - happy path', async () => {
      // Setup a completed quiz first
      const completedContentIds = new Set([mockTaskId]);
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        submittedAnswers: { '1': 'Answer A', '2': 'Answer D' },
        isCompleted: true
      }));

      renderWithDnd(
        <MatchingQuestionsQuiz
          taskId={mockTaskId}
          onComplete={mockOnComplete}
          completedContentIds={completedContentIds}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Quiz completed successfully!')).toBeInTheDocument();
      });

      // Click the reset button
      fireEvent.click(screen.getByText('Restart Quiz'));

      // Quiz should be back in initial state
      await waitFor(() => {
        expect(screen.getByText('Drag and Drop Question to Answer')).toBeInTheDocument();
        expect(screen.queryByText('Quiz completed successfully!')).not.toBeInTheDocument();
      });
    });
  });

  describe('Component rendering modes', () => {
    it('should show loading indicator when isLoading is true', () => {
      renderWithDnd(<MatchingQuestionsQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should show error message when error state is set', async () => {
      // Mock an error on the API call
      QuizApiUtils.getQuestions.mockRejectedValue(new Error('Some error'));

      renderWithDnd(<MatchingQuestionsQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Error: Failed to load data.')).toBeInTheDocument();
      });
    });

    it('should show completed state when quiz is completed', async () => {
      // Setup a completed quiz
      const completedContentIds = new Set([mockTaskId]);
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        submittedAnswers: { '1': 'Answer A', '2': 'Answer D' },
        isCompleted: true
      }));

      renderWithDnd(
        <MatchingQuestionsQuiz
          taskId={mockTaskId}
          onComplete={mockOnComplete}
          completedContentIds={completedContentIds}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Quiz completed successfully!')).toBeInTheDocument();
        expect(screen.getByText('Your chosen pair below')).toBeInTheDocument();
      });
    });

    it('should show loading during completed state if pairs is empty', async () => {
      // Setup a completed quiz but return empty pairs
      const completedContentIds = new Set([mockTaskId]);
      localStorageMock.getItem.mockReturnValue(JSON.stringify({
        submittedAnswers: { '1': 'Answer A', '2': 'Answer D' },
        isCompleted: true
      }));

      // Make the API return empty array
      QuizApiUtils.getQuestions.mockResolvedValue([]);

      renderWithDnd(
        <MatchingQuestionsQuiz
          taskId={mockTaskId}
          onComplete={mockOnComplete}
          completedContentIds={completedContentIds}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Loading completed quiz data...')).toBeInTheDocument();
      });
    });

    it('should show review mode when review button is clicked with valid answers', async () => {
      const { container } = renderWithDnd(<MatchingQuestionsQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
      });

      // Directly call handleDrop to set answers
      let fiber = container.querySelector('.container').__reactFiber$;
      let handleDrop;
      while (fiber) {
        if (fiber.memoizedProps && typeof fiber.memoizedProps.handleDrop === 'function') {
          handleDrop = fiber.memoizedProps.handleDrop;
          break;
        }
        fiber = fiber.return;
      }

      // Set answers for both questions
      if (handleDrop) {
        act(() => {
          handleDrop('1', 'Answer A');
          handleDrop('2', 'Answer D');
        });
      }

      // Click validate button
      fireEvent.click(screen.getByText('Continue'));

      // Should show review mode
      await waitFor(() => {
        expect(screen.getByText('Review Your Answers')).toBeInTheDocument();
        expect(screen.getByText('Back to Quiz')).toBeInTheDocument();
        expect(screen.getByText('Submit Answers')).toBeInTheDocument();
      });

      // Test going back from review mode
      fireEvent.click(screen.getByText('Back to Quiz'));

      await waitFor(() => {
        expect(screen.getByText('Drag and Drop Question to Answer')).toBeInTheDocument();
        expect(screen.queryByText('Review Your Answers')).not.toBeInTheDocument();
      });
    });
  });

  describe('Question component', () => {
    it('should render with correct text and ID', async () => {
      renderWithDnd(<MatchingQuestionsQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Question 1')).toBeInTheDocument();
        expect(screen.getByText('Question 2')).toBeInTheDocument();
      });
    });
  });

  describe('Answer component', () => {
    it('should render with correct text', async () => {
      renderWithDnd(<MatchingQuestionsQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

      await waitFor(() => {
        expect(screen.getByText('Answer A')).toBeInTheDocument();
        expect(screen.getByText('Answer B')).toBeInTheDocument();
        expect(screen.getByText('Answer C')).toBeInTheDocument();
        expect(screen.getByText('Answer D')).toBeInTheDocument();
        expect(screen.getByText('Answer E')).toBeInTheDocument();
        expect(screen.getByText('Answer F')).toBeInTheDocument();
      });
    });
  });
});

