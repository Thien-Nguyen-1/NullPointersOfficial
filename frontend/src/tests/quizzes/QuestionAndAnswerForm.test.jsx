import React from 'react';
import { render, screen, waitFor,act ,fireEvent} from '@testing-library/react';
import QuestionAndAnswerForm from '../../components/quizzes/QuestionAndAnswerForm';
import { QuizApiUtils } from "../../services/QuizApiUtils";

vi.mock("../../services/QuizApiUtils"); 

describe('QuestionAndAnswerForm', async () => {
    beforeEach(() => {
        QuizApiUtils.getQuestions = vi.fn();
    });

    
    test('renders loading state initially', async () => {
        QuizApiUtils.getQuestions.mockReturnValue(new Promise(resolve => setTimeout(() => resolve([]), 100)));

        const { rerender } = render(<QuestionAndAnswerForm taskId={1} onComplete={() => {}} />);

        expect(screen.getByText(/loading/i)).toBeInTheDocument();

        await waitFor(() => {
            rerender(<QuestionAndAnswerForm taskId={1} onComplete={() => {}} />);
        });

    });
    test('fetches questions and renders them', async () => {
        QuizApiUtils.getQuestions.mockResolvedValue([
            { id: 1, text: 'What is your name?' },
            { id: 2, text: 'What is your quest?' }
        ]);

        render(<QuestionAndAnswerForm taskId={1} onComplete={() => {}} />);

        const question1 = await screen.findByDisplayValue('What is your name?', {}, { timeout: 1000 });
        const question2 = await screen.findByDisplayValue('What is your quest?', {}, { timeout: 1000 });

        expect(question1).toBeInTheDocument();
        expect(question2).toBeInTheDocument();
    });

    test('displays error when fetching questions fails', async () => {
        QuizApiUtils.getQuestions.mockRejectedValue(new Error('Failed to fetch'));
        render(<QuestionAndAnswerForm taskId={1} onComplete={() => {}} />);
        const errorText = await screen.findByText(/failed to load questions/i);
        expect(errorText).toBeInTheDocument();
    });

    test('handles answer changes correctly', async () => {
        QuizApiUtils.getQuestions.mockResolvedValue([{ id: 1, text: 'What is your name?' }]);
    
        render(<QuestionAndAnswerForm taskId={1} onComplete={() => {}} />);
        await waitFor(() => screen.findByDisplayValue('What is your name?'));
    
        const input = screen.getByDisplayValue('');
        fireEvent.change(input, { target: { value: 'Alice' } });
        expect(input.value).toBe('Alice');
    });

    test('submits the form when all answers are provided', async () => {
        QuizApiUtils.getQuestions.mockResolvedValue([{ id: 1, text: 'What is your name?' }]);
        const onComplete = vi.fn();
    
        render(<QuestionAndAnswerForm taskId={1} onComplete={onComplete} />);
        await waitFor(() => screen.findByDisplayValue('What is your name?'));
    
        const input = screen.getByDisplayValue('');
        fireEvent.change(input, { target: { value: 'Alice' } });
    
        const submitButton = screen.getByRole('button', { name: /submit all answers/i });
        fireEvent.click(submitButton);
    
        await waitFor(() => {
            expect(onComplete).toHaveBeenCalledWith({ "1": "Alice" });

            expect(screen.getByText(/restart quiz/i)).toBeInTheDocument();
        });
    });

    test('restarts the quiz when restart button is clicked', async () => {
        QuizApiUtils.getQuestions.mockResolvedValue([{ id: 1, text: 'What is your name?' }]);
        render(<QuestionAndAnswerForm taskId={1} onComplete={() => {}} />);
        await waitFor(() => screen.findByDisplayValue('What is your name?'));
    
        const input = screen.getByDisplayValue('');
        fireEvent.change(input, { target: { value: 'Alice' } });
    
        const submitButton = screen.getByRole('button', { name: /submit all answers/i });
        fireEvent.click(submitButton);
    
        fireEvent.click(screen.getByText(/restart quiz/i));
    
        expect(screen.queryByText(/submit all answers/i)).toBeInTheDocument();
    });
    
    
    
});

