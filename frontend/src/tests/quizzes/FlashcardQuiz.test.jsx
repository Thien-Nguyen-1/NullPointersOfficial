import React from 'react';
import { render, fireEvent, waitFor, screen,renderHook } from '@testing-library/react';
import FlashcardQuiz from '../../components/quizzes/FlashcardQuiz'; 
import { QuizApiUtils } from '../../services/QuizApiUtils';

vi.mock('../../services/QuizApiUtils');

describe('FlashcardQuiz Component', () => {
  const taskId = '123';
  const mockQuestions = [
    { id: 1, question_text: 'Question 1', hint_text: 'Hint 1', order: 1 },
    { id: 2, question_text: 'Question 2', hint_text: 'Hint 2', order: 2 }
  ];

  beforeEach(() => {
    QuizApiUtils.getQuestions.mockReset();
  });

  test('renders without crashing and calls getQuestions', async () => {
    QuizApiUtils.getQuestions.mockResolvedValue(mockQuestions);
    render(<FlashcardQuiz taskId={taskId} onComplete={() => {}} />);

    expect(QuizApiUtils.getQuestions).toHaveBeenCalledWith(taskId);
    await waitFor(() => expect(screen.getByText('Question 1')).toBeInTheDocument());
  });

  test('handles API errors by displaying an error message', async () => {
    QuizApiUtils.getQuestions.mockRejectedValue(new Error('API Error'));
    render(<FlashcardQuiz taskId={taskId} onComplete={() => {}} />);

    await waitFor(() => expect(screen.getByText('Failed to load flashcards. Please try again later.')).toBeInTheDocument());
  });

  test('navigates to next question when Next button is clicked', async () => {
    QuizApiUtils.getQuestions.mockResolvedValue(mockQuestions);
    render(<FlashcardQuiz taskId={taskId} onComplete={() => {}} />);

    await waitFor(() => fireEvent.click(screen.getByText('Next')));

    expect(screen.getByText('Question 2')).toBeInTheDocument();
  });

  test('validates that all questions have been answered before completing', async () => {
    QuizApiUtils.getQuestions.mockResolvedValue(mockQuestions);
    const { getByText, getByPlaceholderText } = render(<FlashcardQuiz taskId={taskId} onComplete={() => {}} />);

    await waitFor(() => fireEvent.change(getByPlaceholderText('Write your answer here...'), { target: { value: 'Answer 1' } }));
    fireEvent.click(getByText('Next'));
    fireEvent.click(getByText('Finish'));

    expect(screen.getByText('This question requires an answer.')).toBeInTheDocument();
  });


  test('toggleFlip toggles the flipped state', async () => {
    QuizApiUtils.getQuestions.mockResolvedValue(mockQuestions);

    const { container } = render(<FlashcardQuiz taskId={taskId} onComplete={() => {}} />);
  
    await screen.findByText('Question 1');
  
    const flipCard = container.querySelector('.flashcard');
  
    fireEvent.click(flipCard);
  
    expect(flipCard).toHaveClass('flipped');
  
    fireEvent.click(flipCard);
  
    expect(flipCard).not.toHaveClass('flipped');
  });
  
  
  
  test('handleSubmitAnswers sets errors and does not complete if answers are missing', async () => {
    QuizApiUtils.getQuestions.mockResolvedValue(mockQuestions);

    render(<FlashcardQuiz taskId={taskId} onComplete={() => {}} />);
    await screen.findByText('Question 1');

    const inputFirst = screen.getByPlaceholderText('Write your answer here...').closest('textarea');
    fireEvent.change(inputFirst, { target: { value: '4' } });
    fireEvent.click(screen.getByText('Next')); 

    fireEvent.click(screen.getByText('Finish')); 

    await waitFor(() => {
      const errorMessages = screen.queryAllByText('This question requires an answer.');
      expect(errorMessages.length).toBe(1); 
    });

    expect(screen.queryByText('Quiz Completed')).not.toBeInTheDocument(); 
  });
  
});
  
  
