import React from 'react';
import { render, screen, waitFor,fireEvent, getAllByTitle, getAllByDisplayValue, getAllByAltText, getByPlaceholderText } from '@testing-library/react';
import { DndProvider } from 'react-dnd';
import { TestBackend } from 'react-dnd-test-backend';
import { QuizApiUtils } from '../../services/QuizApiUtils';
import MatchingQuestionsQuiz from '../../components/quizzes/MatchingQuestionsQuiz';

vi.mock('../../services/QuizApiUtils');

// Helper function to wrap components in DndProvider with TestBackend for testing
const renderWithDnd = (component) => {
    return render(
        <DndProvider backend={TestBackend}>
            {component}
        </DndProvider>
    );
};

describe('MatchingQuestionsQuiz', () => {
    beforeEach(() => {
        QuizApiUtils.getQuestions.mockReset();
    });

    test('renders loading state initially', async () => {
        QuizApiUtils.getQuestions.mockReturnValue(new Promise(() => {}));
        renderWithDnd(<MatchingQuestionsQuiz taskId="1" onComplete={vi.fn()} />);
        expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    test('displays error when fetching questions fails', async () => {
        QuizApiUtils.getQuestions.mockRejectedValue(new Error('Failed to fetch'));
        renderWithDnd(<MatchingQuestionsQuiz taskId="1" onComplete={vi.fn()} />);
        await waitFor(() => expect(screen.getByText(/failed to load data/i)).toBeInTheDocument());
    });

    test('renders questions and answers after successful fetch', async () => {
        QuizApiUtils.getQuestions.mockResolvedValue([
            { id: 1, text: 'What is the capital?', answers: ['Paris', 'London'], order: 1 }
        ]);
        renderWithDnd(<MatchingQuestionsQuiz taskId="1" onComplete={vi.fn()} />);
        await waitFor(() => screen.getAllByText('What is the capital?'));
        expect(screen.getByText('Paris')).toBeInTheDocument();
        expect(screen.getByText('London')).toBeInTheDocument();
    });

    test('handles submission of answers correctly', async () => {
        QuizApiUtils.getQuestions.mockResolvedValue([
            { id: 1, text: 'What is the capital?', answers: ['Paris'], order: 1 }
        ]);
        const { getByText } = renderWithDnd(<MatchingQuestionsQuiz taskId="1" onComplete={vi.fn()} />);
        await waitFor(() => screen.getAllByText('What is the capital?'));
        
        fireEvent.click(getByText('Submit Answers'));
        expect(getByText('Restart Quiz')).toBeInTheDocument();
    });


   
    
});
