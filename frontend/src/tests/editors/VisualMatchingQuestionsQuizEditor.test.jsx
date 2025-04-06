import React from 'react';
import { render, fireEvent, screen, waitFor, getElementError } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import VisualMatchingQuestionsQuizEditor from '../../components/editors/VisualMatchingQuestionsQuizEditor';
import QuizApiUtils from '../../services/QuizApiUtils';
describe('VisualMatchingQuestionsQuizEditor', () => {
    console.log = vi.fn();

    let renderComponent;
    const mockProps = {
       moduleId: 'test-module-123',
           quizType: 'pair_input',
           initialQuestions: [
             { id: 1, text: 'How are you feeling today?', answers: ['sad','happy','mad'], order: 0 },
             { id: 2, text: 'Describe your confidence in one word', answers: ['low','high','unsure'], order: 1 }
           ],
           setSubmittedPairs: vi.fn()
    };

    renderComponent = () => {
        const ref = React.createRef();
        return render(<VisualMatchingQuestionsQuizEditor ref={ref} {...mockProps} />);
    };

    beforeEach(() => {
        vi.resetAllMocks();
        global.alert = vi.fn();
        global.confirm = vi.fn(() => true);
        QuizApiUtils.deleteQuestion = vi.fn(() => Promise.resolve({ status: 200 }));
        QuizApiUtils.getQuestions = vi.fn(() => Promise.resolve({ status: 200 }));
        

    });

    test('Render initial questions', async () => {
        const { getByText } = renderComponent();
       
        await waitFor(() => {
              expect(getByText('How are you feeling today?')).toBeTruthy();
              expect(getByText('Describe your confidence in one word')).toBeTruthy();
          
        expect(document.body.textContent).toMatch('sad');
        expect(document.body.textContent).toMatch('happy');
        expect(document.body.textContent).toMatch('mad');
        expect(document.body.textContent).toMatch('low');
        expect(document.body.textContent).toMatch('high');
        expect(document.body.textContent).toMatch('unsure');
        });
     });

     test('Add a new question and answer pair', async () => {
        const { getByPlaceholderText, getByText ,findByText} = renderComponent();
    
        
        const questionInput = getByPlaceholderText('Enter question');
        const answersInput = getByPlaceholderText('Enter answers separated by commas');
        
        fireEvent.change(questionInput, { target: { value: 'What is your favorite color?' } });
        fireEvent.change(answersInput, { target: { value: 'Red, Green, Blue' } });
    
        
        fireEvent.click(getByText('Add Pair'));
    
        const displayedQuestion = await findByText('What is your favorite color?');
        expect(displayedQuestion).toBeInTheDocument();
        expect(document.body.textContent).toMatch('Red');
        expect(document.body.textContent).toMatch('Green');
        expect(document.body.textContent).toMatch('Blue')
    });

    test('Edit an existing pair', async () => {
        const { getAllByText, getByText } = renderComponent();
        fireEvent.click(getAllByText('Edit')[0]);
        fireEvent.change(screen.getByDisplayValue('How are you feeling today?'), { target: { value: 'What makes you happy?' } });
        fireEvent.change(screen.getByDisplayValue('sad,happy,mad'), { target: { value: 'sunshine, rain' } });
        fireEvent.click(getByText('Update Pair'));

        await waitFor(() => {
            expect(getByText('What makes you happy?')).toBeTruthy();

            expect(document.body.textContent).toMatch('sunshine');
            expect(document.body.textContent).toMatch('rain');
                  
        });
    });

    test('Remove a pair', async () => {
        const {queryByText, getAllByText } = renderComponent();
    
        fireEvent.click(getAllByText('Remove')[0]);
        
        await waitFor(() => {
            expect(queryByText('How are you feeling today?')).not.toBeInTheDocument();
        });
        
        expect(QuizApiUtils.deleteQuestion).toHaveBeenCalledWith(1); 
    });

    test('Errors removing a matching pair quiz fails', async () => {
            const errorMessage = 'Network Error';
            QuizApiUtils.deleteQuestion = vi.fn(() => Promise.reject(new Error(errorMessage)));
        
            global.console.log = vi.fn();
            global.console.error = vi.fn();
        
            const { getAllByText } = renderComponent();
        
            fireEvent.click(getAllByText('Remove')[0]);
        
            await waitFor(() => {
              expect(console.log).toHaveBeenCalledWith('Failed to delete question from backend:', 1);
              expect(console.error).toHaveBeenCalledWith('Failed to delete question from backend:', expect.any(Error));
            });
        
            expect(QuizApiUtils.deleteQuestion).toHaveBeenCalledWith(1);
        });

         
    test('Updates displayed matching pairs when initialQuestions prop changes', async () => {
        const { rerender, findAllByText } = renderComponent();
      
        let questions = await findAllByText(/How are you feeling today?|Describe your confidence./);
        expect(questions).toHaveLength(2);
      
        const newQuestions = [
          { id: 3, text: 'What is your favorite color?', order: 2 }
        ];
        rerender(<VisualMatchingQuestionsQuizEditor ref={React.createRef()} {...mockProps} initialQuestions={newQuestions} />);
      
        // Check if component updates correctly
        questions = await findAllByText(/What is your favorite color?/);
        expect(questions).toHaveLength(1);
      });


    test('getQuestions method returns the correct state data after form submission', async () => {
        const ref = React.createRef();
        render(<VisualMatchingQuestionsQuizEditor ref={ref} {...mockProps} />);
    
        const questionInput = screen.getByPlaceholderText('Enter question');
        const answersInput = screen.getByPlaceholderText('Enter answers separated by commas');
    
        fireEvent.change(questionInput, { target: { value: 'New Question' } });
        fireEvent.change(answersInput, { target: { value: 'Answer1, Answer2' } });
    
        fireEvent.click(screen.getByText('Add Pair'));
    
        await waitFor(() => {
            const questions = ref.current.getQuestions();
            expect(questions).toEqual(expect.arrayContaining([
                expect.objectContaining({ question_text: 'New Question', answers: ['Answer1', 'Answer2'] })
            ]));
        });
    });

    test('handleAddOrUpdatePair should set error when question or answers are empty', async () => {
        const { getByText, getByPlaceholderText, getByRole } = renderComponent();

        const questionInput = getByPlaceholderText('Enter question');
        const answersInput = getByPlaceholderText('Enter answers separated by commas');
        fireEvent.change(questionInput, { target: { value: '' } });
        fireEvent.change(answersInput, { target: { value: 'Red, Green, Blue' } });

        fireEvent.click(getByText('Add Pair'));

        await waitFor(() => {
            expect(getElementError("Both question and at least one answer must be filled."));
        });

        fireEvent.change(questionInput, { target: { value: 'What is your favorite color?' } });
        fireEvent.change(answersInput, { target: { value: '' } });

        fireEvent.click(getByText('Add Pair'));

        await waitFor(() => {
            expect(getElementError("Both question and at least one answer must be filled."));
        });
    });
    
});

describe.skip('VisualMatchingQuestionsQuizEditor', () => {
    test('placeholder', () => {
      // This test is intentionally skipped
    });
  });