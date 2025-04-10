import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FillInTheBlanksQuiz from '../../../components/quizzes/FillInTheBlanksQuiz';
import { QuizApiUtils } from '../../../services/QuizApiUtils';

// Mock the QuizApiUtils module
vi.mock('../../../services/QuizApiUtils', () => ({
  QuizApiUtils: {
    getQuestions: vi.fn()
  }
}));

describe('FillInTheBlanksQuiz', () => {
  const mockTaskId = 'task-123';
  const mockOnComplete = vi.fn();

  const mockQuestions = [
    {
      id: 1,
      question_text: 'The capital of France is ____ and it is known for ____.',
      hint_text: 'Think about famous landmarks.',
      order: 0
    },
    {
      id: 2,
      question_text: 'React is a ____ library for building user interfaces.',
      hint_text: 'Not Angular or Vue.',
      order: 1
    }
  ];

  let originalConsoleError;
  let originalConsoleLog;

  beforeEach(() => {
    // Mock console methods
    originalConsoleError = console.error;
    originalConsoleLog = console.log;
    console.error = vi.fn();
    console.log = vi.fn();

    // Reset mocks
    vi.clearAllMocks();
    QuizApiUtils.getQuestions.mockResolvedValue(mockQuestions);
  });

  afterEach(() => {
    // Restore console methods
    console.error = originalConsoleError;
    console.log = originalConsoleLog;
  });

  // Test the initial loading state
  it('should show loading state initially', () => {
    render(<FillInTheBlanksQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    expect(screen.getByText('Loading questions...')).toBeInTheDocument();
  });

  // Test successful question fetching
  it('should fetch and display questions', async () => {
    render(<FillInTheBlanksQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    // Verify API was called correctly
    expect(QuizApiUtils.getQuestions).toHaveBeenCalledWith(mockTaskId);

    // Wait for questions to load
    await waitFor(() => {
      expect(screen.queryByText('Loading questions...')).not.toBeInTheDocument();
    });

    // Check if questions are rendered
    expect(screen.getByText('Question 1')).toBeInTheDocument();
    expect(screen.getByText('Question 2')).toBeInTheDocument();
    expect(screen.getByText(/The capital of France is/)).toBeInTheDocument();
    expect(screen.getByText(/React is a/)).toBeInTheDocument();
  });

  // Test error handling when API fails
  it('should handle API errors', async () => {
    QuizApiUtils.getQuestions.mockRejectedValue(new Error('API Error'));

    render(<FillInTheBlanksQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load questions. Please try again later.')).toBeInTheDocument();
    });

    expect(console.error).toHaveBeenCalled();
  });

  // Test handling empty questions array
  it('should handle empty questions array', async () => {
    QuizApiUtils.getQuestions.mockResolvedValue([]);

    render(<FillInTheBlanksQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.getByText('No questions available for this quiz.')).toBeInTheDocument();
    });
  });

  // Test handling no taskId
  it('should handle missing taskId', async () => {
    render(<FillInTheBlanksQuiz onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.getByText('Quiz configuration error. Please contact support.')).toBeInTheDocument();
    });

    expect(console.error).toHaveBeenCalled();
  });

  // Test filling in blanks
  it('should allow filling in blanks', async () => {
    render(<FillInTheBlanksQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading questions...')).not.toBeInTheDocument();
    });

    // Find all inputs
    const inputs = screen.getAllByPlaceholderText('fill in');

    // Fill in the blanks
    fireEvent.change(inputs[0], { target: { value: 'Paris' } });
    fireEvent.change(inputs[1], { target: { value: 'the Eiffel Tower' } });
    fireEvent.change(inputs[2], { target: { value: 'JavaScript' } });

    // Submit the quiz
    fireEvent.click(screen.getByText('Submit Answers'));

    // Check if review mode is shown
    await waitFor(() => {
      expect(screen.getByText('Fill in the Blanks - Review')).toBeInTheDocument();
    });

    // Check answers are displayed in review
    expect(screen.getByText(/Paris/)).toBeInTheDocument();
    expect(screen.getByText(/the Eiffel Tower/)).toBeInTheDocument();
    expect(screen.getByText(/JavaScript/)).toBeInTheDocument();
  });

  // Test validation when submitting with empty blanks
  it('should validate empty blanks on submit', async () => {
    render(<FillInTheBlanksQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading questions...')).not.toBeInTheDocument();
    });

    // Submit without filling in blanks
    fireEvent.click(screen.getByText('Submit Answers'));

    // Check validation message
    await waitFor(() => {
      expect(screen.getByText('Please fill in all blanks before submitting.')).toBeInTheDocument();
    });
  });

  // Test completing the quiz
  it('should call onComplete with answers when done', async () => {
    render(<FillInTheBlanksQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading questions...')).not.toBeInTheDocument();
    });

    // Fill in the blanks
    const inputs = screen.getAllByPlaceholderText('fill in');
    fireEvent.change(inputs[0], { target: { value: 'Paris' } });
    fireEvent.change(inputs[1], { target: { value: 'the Eiffel Tower' } });
    fireEvent.change(inputs[2], { target: { value: 'JavaScript' } });

    // Submit the quiz
    fireEvent.click(screen.getByText('Submit Answers'));

    // Go to review screen
    await waitFor(() => {
      expect(screen.getByText('Fill in the Blanks - Review')).toBeInTheDocument();
    });

    // Complete the quiz
    fireEvent.click(screen.getByText('Done'));

    // Check if onComplete was called with the right answers
    expect(mockOnComplete).toHaveBeenCalled();
    const callArg = mockOnComplete.mock.calls[0][0];
    expect(callArg[1]).toEqual(['Paris', 'the Eiffel Tower']);
    expect(callArg[2]).toEqual(['JavaScript']);
  });

  // Test restarting the quiz
  it('should allow restarting the quiz', async () => {
    render(<FillInTheBlanksQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading questions...')).not.toBeInTheDocument();
    });

    // Fill in the blanks
    const inputs = screen.getAllByPlaceholderText('fill in');
    fireEvent.change(inputs[0], { target: { value: 'Paris' } });
    fireEvent.change(inputs[1], { target: { value: 'the Eiffel Tower' } });
    fireEvent.change(inputs[2], { target: { value: 'JavaScript' } });

    // Submit the quiz
    fireEvent.click(screen.getByText('Submit Answers'));

    // Go to review screen
    await waitFor(() => {
      expect(screen.getByText('Fill in the Blanks - Review')).toBeInTheDocument();
    });

    // Reset the quiz
    fireEvent.click(screen.getByText('Try Again'));

    // Check if quiz is reset
    await waitFor(() => {
      expect(screen.queryByText('Fill in the Blanks - Review')).not.toBeInTheDocument();
    });

    // Check if inputs are cleared
    const newInputs = screen.getAllByPlaceholderText('fill in');
    expect(newInputs[0].value).toBe('');
    expect(newInputs[1].value).toBe('');
    expect(newInputs[2].value).toBe('');
  });

  // Test preview mode functionality
  it('should work in preview mode', async () => {
    const previewQuestions = [
      {
        id: 3,
        text: 'The sky is ____ on a clear day.',
        hint: 'Color of the ocean.',
        order: 0
      }
    ];

    render(
      <FillInTheBlanksQuiz
        isPreview={true}
        previewQuestions={previewQuestions}
        onComplete={mockOnComplete}
      />
    );

    // Check if question is loaded from preview data
    await waitFor(() => {
      expect(screen.getByText(/The sky is/)).toBeInTheDocument();
    });

    // QuizApiUtils should not be called in preview mode
    expect(QuizApiUtils.getQuestions).not.toHaveBeenCalled();

    // Fill in the blank
    const input = screen.getByPlaceholderText('fill in');
    fireEvent.change(input, { target: { value: 'blue' } });

    // Submit and complete in preview mode
    fireEvent.click(screen.getByText('Submit Answers'));

    await waitFor(() => {
      expect(screen.getByText('Fill in the Blanks - Review')).toBeInTheDocument();
    });

    // Complete the quiz in preview mode
    fireEvent.click(screen.getByText('Done'));

    // onComplete should be called with preview flag
    expect(mockOnComplete).toHaveBeenCalledWith({ preview: true });
  });

  // Test handling invalid question format (no blanks)
  it('should handle questions with no blanks', async () => {
    const invalidQuestions = [
      {
        id: 4,
        question_text: 'This question has no blanks to fill.',
        hint_text: 'This is a hint.',
        order: 0
      }
    ];

    QuizApiUtils.getQuestions.mockResolvedValue(invalidQuestions);

    render(<FillInTheBlanksQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.getByText('Error: Invalid question format - no blanks (____) found')).toBeInTheDocument();
    });
  });

  // Test handling completely invalid question (missing text)
  it('should handle invalid question objects', async () => {
    const invalidQuestions = [
      {
        id: 5,
        // Missing question_text
        hint_text: 'This is a hint.',
        order: 0
      }
    ];

    QuizApiUtils.getQuestions.mockResolvedValue(invalidQuestions);

    render(<FillInTheBlanksQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.getByText('Error: Invalid question format')).toBeInTheDocument();
    });
  });
});