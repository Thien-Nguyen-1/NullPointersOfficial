import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent, waitFor, screen } from '@testing-library/react';
import FillInTheBlanksQuiz from '../../components/quizzes/FillInTheBlanksQuiz';
import { QuizApiUtils } from '../../services/QuizApiUtils';

vi.mock('../../services/QuizApiUtils');

describe('FillInTheBlanksQuiz', () => {
    let onCompleteMock;

  const taskId = '123';
  const mockQuestions = [
    { id: '1', question_text: 'Fill ____ the blanks.', hint_text: 'Use appropriate words.', order: 1 },
    { id: '2', question_text: '____ is the capital of France.', hint_text: 'Starts with P', order: 2 }
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    //QuizApiUtils.getQuestions.mockResolvedValue(mockQuestions);
        QuizApiUtils.getQuestions.mockReset();
        onCompleteMock = vi.fn();


  });

  test('renders without crashing and calls getQuestions', async () => {
    QuizApiUtils.getQuestions.mockResolvedValue(mockQuestions);

    render(<FillInTheBlanksQuiz taskId={taskId} onComplete={() => {}} />);
    expect(QuizApiUtils.getQuestions).toHaveBeenCalledWith(taskId);
    await waitFor(() => expect(screen.getByText('is the capital of France.')).toBeInTheDocument());
  });

  test('handles API errors by displaying an error message', async () => {
    QuizApiUtils.getQuestions.mockRejectedValue(new Error('API Error'));
    render(<FillInTheBlanksQuiz taskId={taskId} onComplete={vi.fn()} />);
    await waitFor(() => expect(screen.getByText('Failed to load questions. Please try again later.')).toBeInTheDocument());
  });

  test('updates user answers and validates them', async () => {
    QuizApiUtils.getQuestions.mockResolvedValue(mockQuestions);

    render(<FillInTheBlanksQuiz taskId={taskId} onComplete={() => {}} />);  
      await waitFor(() => {
      const inputs = screen.getAllByPlaceholderText('fill in');
      fireEvent.change(inputs[0], { target: { value: 'in' } });
      fireEvent.click(screen.getByText('Submit Answers'));
     // expect(screen.queryByText('This blank must be filled.')).not.toBeInTheDocument();
    });
  });

  test('shows validation message when blanks are not filled', async () => {
    QuizApiUtils.getQuestions.mockResolvedValue(mockQuestions);

    render(<FillInTheBlanksQuiz taskId={taskId} onComplete={() => {}} />);      await waitFor(() => fireEvent.click(screen.getByText('Submit Answers')));
    expect(screen.getByText('Please fill in all blanks before submitting.')).toBeInTheDocument();
  });

  test('allows navigation between questions', async () => {
    QuizApiUtils.getQuestions.mockResolvedValue(mockQuestions);
    render(<FillInTheBlanksQuiz taskId={taskId} onComplete={() => {}} />);    
      await screen.findByText('Read each sentence and fill in the missing words in the blanks.');
    fireEvent.change(screen.getAllByPlaceholderText('fill in')[0], { target: { value: 'into' } });
    fireEvent.click(screen.getByText('Submit Answers'));
    await screen.findByText('is the capital of France.');
  });
  
  test('submits answers correctly after all fields are validated', async () => {
    QuizApiUtils.getQuestions.mockResolvedValue(mockQuestions);
    render(<FillInTheBlanksQuiz taskId={taskId} onComplete={() => {}} />); 
        await screen.findByText('Read each sentence and fill in the missing words in the blanks.');
    fireEvent.change(screen.getAllByPlaceholderText('fill in')[0], { target: { value: 'into' } });
    fireEvent.click(screen.getByText('Submit Answers'));
   await screen.findByText('is the capital of France.');
   fireEvent.change(screen.getAllByPlaceholderText('fill in')[0], { target: { value: 'Paris' } });
   //fireEvent.click(screen.getByText('Submit Answers'));
    //await waitFor(() => expect(screen.queryByText('Please fill in all blanks before submitting.')).not.toBeInTheDocument());
  });
  it('resets the quiz correctly', async () => {
    QuizApiUtils.getQuestions.mockResolvedValue(mockQuestions);
    const { getByText, getAllByPlaceholderText } = render(<FillInTheBlanksQuiz taskId={taskId} onComplete={() => {}} />);    // Wait for questions to be loaded and displayed
    await screen.findByText('Read each sentence and fill in the missing words in the blanks.');

    await screen.findByText('is the capital of France.');
    fireEvent.change(screen.getAllByPlaceholderText('fill in')[0], { target: { value: 'Paris is the capital of France.' } });
    fireEvent.click(screen.getByText('Submit Answers'));
    await screen.findByText('is the capital of France.');
    fireEvent.change(screen.getAllByPlaceholderText('fill in')[1], { target: { value: 'Paris is the capital of France.' } });
    fireEvent.click(screen.getByText('Submit Answers'));
    // Now reset the quiz
    await screen.findByText('Try Again');

   fireEvent.click(getByText('Try Again'));

    expect(screen.getByText('Read each sentence and fill in the missing words in the blanks.')).toBeInTheDocument(); // Ensuring the quiz is ready to be taken again
  });

  it('completes with preview flag in preview mode', async () => {

    QuizApiUtils.getQuestions.mockResolvedValue(mockQuestions);
    render(<FillInTheBlanksQuiz taskId={taskId} onComplete={() => {}} isPreview={true} />);   
      await screen.findByText('Fill in the Blanks / Title');

    fireEvent.click(screen.getByText('Submit Answers'));

    //expect(onComplete).toHaveBeenCalledWith({ preview: true });
  });
});
