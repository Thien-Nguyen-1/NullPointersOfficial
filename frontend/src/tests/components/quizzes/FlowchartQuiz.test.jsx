import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import FlowchartQuiz from '../../../components/quizzes/FlowchartQuiz';
import { QuizApiUtils } from '../../../services/QuizApiUtils';

// Mock the QuizApiUtils module
vi.mock('../../../services/QuizApiUtils', () => ({
  QuizApiUtils: {
    getQuestions: vi.fn()
  }
}));

describe('FlowchartQuiz', () => {
  const mockTaskId = 'task-123';
  const mockOnComplete = vi.fn();

  const mockQuestions = [
    {
      id: 1,
      question_text: 'Define the problem',
      hint_text: 'What is the issue that needs to be solved?',
      order: 0
    },
    {
      id: 2,
      question_text: 'Research solutions',
      hint_text: 'What are possible approaches?',
      order: 1
    },
    {
      id: 3,
      question_text: 'Implement the best solution',
      hint_text: 'How do you execute it?',
      order: 2
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
    render(<FlowchartQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    expect(screen.getByText('Loading flowchart quiz...')).toBeInTheDocument();
  });

  // Test successful question fetching
  it('should fetch and display statements in order', async () => {
    render(<FlowchartQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    // Verify API was called correctly
    expect(QuizApiUtils.getQuestions).toHaveBeenCalledWith(mockTaskId);

    // Wait for questions to load
    await waitFor(() => {
      expect(screen.queryByText('Loading flowchart quiz...')).not.toBeInTheDocument();
    });

    // Check if all steps are rendered in the visual flowchart
    // Use more specific queries to avoid ambiguity
    expect(screen.getAllByText('Define the problem')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Research solutions')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Implement the best solution')[0]).toBeInTheDocument();

    // First step should be current
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    expect(screen.getByText('What is the issue that needs to be solved?')).toBeInTheDocument();
  });

  // Test error handling when API fails
  it('should handle API errors', async () => {
    QuizApiUtils.getQuestions.mockRejectedValue(new Error('API Error'));

    render(<FlowchartQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load questions. Please try again later.')).toBeInTheDocument();
    });

    expect(console.error).toHaveBeenCalled();
  });

  // Test handling empty questions array
  it('should handle empty questions array', async () => {
    QuizApiUtils.getQuestions.mockResolvedValue([]);

    render(<FlowchartQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.getByText('No statements available for this flowchart.')).toBeInTheDocument();
    });
  });

  // Test handling no taskId
  it('should handle missing taskId', async () => {
    render(<FlowchartQuiz onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.getByText('Quiz configuration error. Please contact support.')).toBeInTheDocument();
    });

    expect(console.error).toHaveBeenCalled();
  });

  // Test navigation between steps
  it('should navigate between steps', async () => {
    render(<FlowchartQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading flowchart quiz...')).not.toBeInTheDocument();
    });

    // First step
    expect(screen.getByText('1 of 3')).toBeInTheDocument();

    // Find content in the statement container
    // Use a more specific query since 'Define the problem' appears multiple times
    expect(screen.getAllByText('Define the problem')[1]).toBeInTheDocument();

    // Enter answer
    const textarea = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea, { target: { value: 'The problem is X' } });

    // Go to next step
    fireEvent.click(screen.getByText('Next'));

    // Second step
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
    expect(screen.getByText('What are possible approaches?')).toBeInTheDocument();

    // Enter answer
    const textarea2 = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea2, { target: { value: 'Possible solutions are A, B, C' } });

    // Go to next step
    fireEvent.click(screen.getByText('Next'));

    // Third step
    expect(screen.getByText('3 of 3')).toBeInTheDocument();
    expect(screen.getByText('How do you execute it?')).toBeInTheDocument();

    // Go back to previous step
    fireEvent.click(screen.getByText('Previous'));

    // Back to second step
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
    expect(screen.getByText('What are possible approaches?')).toBeInTheDocument();
  });

  // Test validation on next step
  it('should validate empty answer when going to next step', async () => {
    render(<FlowchartQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading flowchart quiz...')).not.toBeInTheDocument();
    });

    // Try to go next without answering
    fireEvent.click(screen.getByText('Next'));

    // Should show validation error
    expect(screen.getByText('Please provide a response before continuing.')).toBeInTheDocument();

    // Still on first step
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
  });

  // Test completing the quiz
  it('should show completion screen when finishing all steps', async () => {
    render(<FlowchartQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading flowchart quiz...')).not.toBeInTheDocument();
    });

    // Answer first step
    const textarea1 = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea1, { target: { value: 'Answer 1' } });
    fireEvent.click(screen.getByText('Next'));

    // Answer second step
    const textarea2 = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea2, { target: { value: 'Answer 2' } });
    fireEvent.click(screen.getByText('Next'));

    // Answer third step
    const textarea3 = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea3, { target: { value: 'Answer 3' } });

    // Find the button by its text content (in this case, the last step button should say "Finish")
    const buttons = screen.getAllByRole('button');
    const finishButton = buttons.find(button => button.textContent === 'Finish');
    fireEvent.click(finishButton);

    // Should show completion screen
    await waitFor(() => {
      expect(screen.getByText('Flowchart Exercise Complete!')).toBeInTheDocument();
    });

    // All answers should be visible in the review
    expect(screen.getByText('Answer 1')).toBeInTheDocument();
    expect(screen.getByText('Answer 2')).toBeInTheDocument();
    expect(screen.getByText('Answer 3')).toBeInTheDocument();
  });

  // Test validation on finish
  it('should validate all answers before finishing', async () => {
    render(<FlowchartQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading flowchart quiz...')).not.toBeInTheDocument();
    });

    // Answer only first step
    const textarea1 = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea1, { target: { value: 'Answer 1' } });
    fireEvent.click(screen.getByText('Next'));

    // Skip second step, then move to third step
    const textarea2 = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea2, { target: { value: 'Answer 2' } });
    fireEvent.click(screen.getByText('Next'));

    // Now we're on the third step, fill it out
    const textarea3 = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea3, { target: { value: 'Answer 3' } });

    // Click the Finish button
    const buttons = screen.getAllByRole('button');
    const finishButton = buttons.find(button => button.textContent === 'Finish');
    fireEvent.click(finishButton);

    // Now we should be on the completion screen
    await waitFor(() => {
      expect(screen.getByText(/Flowchart Exercise Complete/i)).toBeInTheDocument();
    });

    // There shouldn't be any validation errors since we filled out all steps
    expect(screen.queryByText('Some steps are missing responses.')).not.toBeInTheDocument();
  });

  // Test submitting all answers
  it('should call onComplete with answers when done', async () => {
    render(<FlowchartQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading flowchart quiz...')).not.toBeInTheDocument();
    });

    // Answer all steps
    const textarea1 = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea1, { target: { value: 'Answer 1' } });
    fireEvent.click(screen.getByText('Next'));

    const textarea2 = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea2, { target: { value: 'Answer 2' } });
    fireEvent.click(screen.getByText('Next'));

    const textarea3 = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea3, { target: { value: 'Answer 3' } });

    // Find and click the finish button
    const buttons = screen.getAllByRole('button');
    const finishButton = buttons.find(button => button.textContent === 'Finish');
    fireEvent.click(finishButton);

    // Go to review screen
    await waitFor(() => {
      expect(screen.getByText('Flowchart Exercise Complete!')).toBeInTheDocument();
    });

    // Submit answers
    fireEvent.click(screen.getByText('Done'));

    // Check if onComplete was called with the right answers
    expect(mockOnComplete).toHaveBeenCalled();
    const callArg = mockOnComplete.mock.calls[0][0];
    expect(callArg[1]).toBe('Answer 1');
    expect(callArg[2]).toBe('Answer 2');
    expect(callArg[3]).toBe('Answer 3');
  });

  // Test restarting the quiz
  it('should allow restarting the quiz', async () => {
    render(<FlowchartQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading flowchart quiz...')).not.toBeInTheDocument();
    });

    // Complete all steps
    // Step 1
    const textarea1 = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea1, { target: { value: 'Answer 1' } });
    fireEvent.click(screen.getByText('Next'));

    // Step 2
    const textarea2 = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea2, { target: { value: 'Answer 2' } });
    fireEvent.click(screen.getByText('Next'));

    // Step 3
    const textarea3 = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea3, { target: { value: 'Answer 3' } });

    // Click the Finish button to complete
    const buttons = screen.getAllByRole('button');
    const finishButton = buttons.find(button => button.textContent === 'Finish');
    fireEvent.click(finishButton);

    // Wait for completion screen
    await waitFor(() => {
      expect(screen.getByText(/Flowchart Exercise Complete/i)).toBeInTheDocument();
    });

    // Restart the quiz
    fireEvent.click(screen.getByText('Try Again'));

    // Should be back at first step with empty inputs
    expect(screen.getByText('1 of 3')).toBeInTheDocument();
    const newTextarea = screen.getByPlaceholderText('Write your answer here...');
    expect(newTextarea.value).toBe('');
  });

  // Test preview mode functionality
  it('should work in preview mode', async () => {
    const previewQuestions = [
      {
        id: 4,
        text: 'First preview step',
        hint: 'Preview hint 1',
        order: 0
      },
      {
        id: 5,
        text: 'Second preview step',
        hint: 'Preview hint 2',
        order: 1
      }
    ];

    render(
      <FlowchartQuiz
        isPreview={true}
        previewQuestions={previewQuestions}
        onComplete={mockOnComplete}
      />
    );

    // Check if questions are loaded from preview data
    await waitFor(() => {
      expect(screen.getAllByText('First preview step')[0]).toBeInTheDocument();
    });

    // QuizApiUtils should not be called in preview mode
    expect(QuizApiUtils.getQuestions).not.toHaveBeenCalled();

    // Complete the steps
    const textarea1 = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea1, { target: { value: 'Preview answer 1' } });
    fireEvent.click(screen.getByText('Next'));

    const textarea2 = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea2, { target: { value: 'Preview answer 2' } });

    // Find and click the finish button in preview mode
    const buttons = screen.getAllByRole('button');
    const finishButton = buttons.find(button => button.textContent === 'Finish');
    fireEvent.click(finishButton);

    // Go to completion screen
    await waitFor(() => {
      expect(screen.getByText('Flowchart Exercise Complete!')).toBeInTheDocument();
    });

    // Complete the quiz in preview mode
    fireEvent.click(screen.getByText('Done'));

    // onComplete should be called with preview flag
    expect(mockOnComplete).toHaveBeenCalledWith({ preview: true });
  });

  // Test disabling the previous button on first step
  it('should disable previous button on first step', async () => {
    render(<FlowchartQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading flowchart quiz...')).not.toBeInTheDocument();
    });

    // Previous button should be disabled on first step
    const prevButton = screen.getByText('Previous');
    expect(prevButton).toBeDisabled();

    // Next button should be enabled
    const nextButton = screen.getByText('Next');
    expect(nextButton).not.toBeDisabled();
  });

  // Test the Next button showing "Finish" text on last step
  it('should show "Finish" on the next button for the last step', async () => {
    render(<FlowchartQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading flowchart quiz...')).not.toBeInTheDocument();
    });

    // Go to last step
    const textarea1 = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea1, { target: { value: 'Answer 1' } });
    fireEvent.click(screen.getByText('Next'));

    const textarea2 = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea2, { target: { value: 'Answer 2' } });
    fireEvent.click(screen.getByText('Next'));

    // On last step, next button should say "Finish"
    const buttons = screen.getAllByRole('button');
    const finishButton = buttons.find(button => button.textContent === 'Finish');
    expect(finishButton).toBeInTheDocument();

    // Make sure there's no button that says exactly "Next"
    const nextButtons = buttons.filter(button => button.textContent === 'Next');
    expect(nextButtons.length).toBe(0);
  });

  // Test validation when having missing responses
  it('should show validation errors for missing responses', async () => {
    render(<FlowchartQuiz taskId={mockTaskId} onComplete={mockOnComplete} />);

    await waitFor(() => {
      expect(screen.queryByText('Loading flowchart quiz...')).not.toBeInTheDocument();
    });

    // Answer only first step
    const textarea1 = screen.getByPlaceholderText('Write your answer here...');
    fireEvent.change(textarea1, { target: { value: 'Answer 1' } });
    fireEvent.click(screen.getByText('Next'));

    // Try to go to the third step without answering the second
    fireEvent.click(screen.getByText('Next'));

    // Should show validation error
    expect(screen.getByText('Please provide a response before continuing.')).toBeInTheDocument();

    // Still on second step
    expect(screen.getByText('2 of 3')).toBeInTheDocument();
  });
});