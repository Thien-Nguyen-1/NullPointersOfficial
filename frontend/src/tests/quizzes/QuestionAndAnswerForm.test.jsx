import React from 'react';
import { render, screen, waitFor,act } from '@testing-library/react';
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

        // Using findByText to wait for the elements to appear
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
});

