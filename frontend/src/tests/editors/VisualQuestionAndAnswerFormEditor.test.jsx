import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import VisualQuestionAndAnswerFormEditor from '../../components/editors/VisualQuestionAndAnswerFormEditor';

describe('VisualQuestionAndAnswerFormEditor', () => {
    console.log = vi.fn();

    let renderComponent;
    const mockProps = {
       moduleId: 'test-module-123',
           quizType: 'question_input',
           initialQuestions: [
             { id: 1, text: 'How are you feeling today?', order: 0 },
             { id: 2, text: 'Describe your confidence.', order: 1 }
           ],
           setSubmittedData: vi.fn()
    };

    renderComponent = () => {
        const ref = React.createRef();
        return render(<VisualQuestionAndAnswerFormEditor ref={ref} {...mockProps} />);
    };

    beforeEach(() => {
        vi.resetAllMocks();
        global.alert = vi.fn();
        global.confirm = vi.fn(() => true);
        QuizApiUtils.deleteQuestion = vi.fn(() => Promise.resolve({ status: 200 }));

    });

    test('renders with initial questions', async () => {
        const { getByText } = renderComponent();
       
        await waitFor(() => {
              expect(getByText('How are you feeling today?')).toBeTruthy();
              expect(getByText('Describe your confidence.')).toBeTruthy();
        });
     });


     test('allows adding a new question and answer pair', async () => {
        const { getByPlaceholderText, getByText ,findByText} = renderComponent();
    
        
        const questionInput = getByPlaceholderText('Enter your question');
        
        fireEvent.change(questionInput, { target: { value: 'What is your favorite feeling?' } });
    
        
        fireEvent.click(getByText('Add Question'));
    
        const displayedQuestion = await findByText('What is your favorite feeling?');
        expect(displayedQuestion).toBeInTheDocument();
    });

    test('allows editing an existing Question', async () => {
        const { getAllByText, getByText } = renderComponent();
        fireEvent.click(getAllByText('Edit')[0]);
        fireEvent.change(screen.getByDisplayValue('How are you feeling today?'), { target: { value: 'What makes you happy?' } });
        fireEvent.click(getByText('Update Question'));

        await waitFor(() => {
            expect(getByText('What makes you happy?')).toBeTruthy();

                  
        });
    });

    test('handles removing a Question', async () => {
        const {queryByText, getAllByText } = renderComponent();
    
        fireEvent.click(getAllByText('Delete')[0]);
        
        await waitFor(() => {
            expect(queryByText('How are you feeling today?')).not.toBeInTheDocument();
        });
        
        expect(QuizApiUtils.deleteQuestion).toHaveBeenCalledWith(1); 
    });


    test('handles errors when removing a question fails', async () => {
        // Setup: Initial questions and mock failure
        const errorMessage = 'Network Error';
        QuizApiUtils.deleteQuestion = vi.fn(() => Promise.reject(new Error(errorMessage)));
    
        // Mock console to check if errors are logged
        global.console.log = vi.fn();
        global.console.error = vi.fn();
    
        const { getAllByText } = renderComponent();
    
        // Trigger the delete action
        fireEvent.click(getAllByText('Delete')[0]);
    
        // Expectations: Error handling
        await waitFor(() => {
          expect(console.log).toHaveBeenCalledWith('Failed to delete question from backend: with ID:', 1);
          expect(console.error).toHaveBeenCalledWith('Failed to delete question from backend:', expect.any(Error));
        });
    
        // Ensure the deleteQuestion was called correctly
        expect(QuizApiUtils.deleteQuestion).toHaveBeenCalledWith(1);
    });
    
      
      

});

describe.skip('VisualQuestionAndAnswerFormEditor', () => {
    test('placeholder', () => {
      // This test is intentionally skipped
    });
  });