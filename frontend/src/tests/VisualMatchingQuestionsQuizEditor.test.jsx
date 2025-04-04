import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import VisualMatchingQuestionsQuizEditor from '../components/editors/VisualMatchingQuestionsQuizEditor';

describe('VisualMatchingQuestionsQuizEditor', () => {
    let initialQuestions;

    beforeEach(() => {
        initialQuestions = [
            { id: 1, text: 'Question 1', answers: ['Answer1, Answer2'], order: 1 },
            { id: 2, text: 'Question 2', answers: ['Answer3, Answer4'], order: 2 }
        ];
    });

    test('renders without crashing', () => {
        render(<VisualMatchingQuestionsQuizEditor initialQuestions={initialQuestions} />);
        expect(screen.getByText('Create Matching Question and Answer Pairs')).toBeInTheDocument();
    });

    test('displays initial questions', () => {
        render(<VisualMatchingQuestionsQuizEditor initialQuestions={initialQuestions} />);
        expect(screen.getByText('Question 1')).toBeInTheDocument();
        expect(screen.getByText('Answer1, Answer2')).toBeInTheDocument();
     });

    // test('allows adding a new question and answer pair', () => {
    //     render(<VisualMatchingQuestionsQuizEditor initialQuestions={[]} />);
    //     fireEvent.change(screen.getByPlaceholderText('Enter question'), { target: { value: 'New Question' } });
    //     fireEvent.change(screen.getByPlaceholderText('Enter answers separated by commas'), { target: { value: 'New Answer86, New Answer82' } });
    //     fireEvent.click(screen.getByText('Add Pair'));
    //     expect(screen.getByText('New Question')).toBeInTheDocument();
        
    //     // Check for the exact text as it appears in the DOM
    //     const expectedAnswerText = "New Answer1, New Answer2"; // Adjust this based on the exact text format
    //     expect(screen.getByText(expectedAnswerText)).toBeInTheDocument();
    // });
    
    // test('allows editing an existing question and answer pair', () => {
    //     render(<VisualMatchingQuestionsQuizEditor initialQuestions={initialQuestions} />);
    //     fireEvent.click(screen.getAllByText('Edit')[0]); // Click on edit for the first pair
    //     fireEvent.change(screen.getByPlaceholderText('Enter question'), { target: { value: 'Updated Question' } });
    //     fireEvent.change(screen.getByPlaceholderText('Enter answers separated by commas'), { target: { value: 'Updated Answer1, Updated Answer2' } });
    //     fireEvent.click(screen.getByText('Update Pair'));
    //     expect(screen.getByText('Updated Question')).toBeInTheDocument();
    //     expect(screen.getByText('Updated Answer1, Updated Answer2')).toBeInTheDocument();
    // });

    // test('allows deleting a question and answer pair', async () => {
    //     render(<VisualMatchingQuestionsQuizEditor initialQuestions={initialQuestions} />);
    //     const deleteButtons = screen.getAllByText('Remove');
    //     fireEvent.click(deleteButtons[0]); // Click on remove for the first pair
    //     expect(await screen.findByText('Question 1')).not.toBeInTheDocument();
    // });

    // Test to handle error display on validation failure
    // test('displays error when trying to submit empty inputs', () => {
    //     render(<VisualMatchingQuestionsQuizEditor initialQuestions={[]} />);
    //     fireEvent.click(screen.getByText('Add Pair'));
    //     expect(screen.getByText('Both question and at least one answer must be filled.')).toBeInTheDocument();
    // });
});
