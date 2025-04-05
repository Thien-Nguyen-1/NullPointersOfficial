import React from 'react';
import { render, fireEvent, screen, waitFor } from '@testing-library/react';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import VisualMatchingQuestionsQuizEditor from '../../components/editors/VisualMatchingQuestionsQuizEditor';

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

    });

    test('renders with initial questions', async () => {
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

     test('allows adding a new question and answer pair', async () => {
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

    test('allows editing an existing pair', async () => {
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

    test('handles removing a pair', async () => {
        const {queryByText, getAllByText } = renderComponent();
    
        fireEvent.click(getAllByText('Remove')[0]);
        
        await waitFor(() => {
            expect(queryByText('How are you feeling today?')).not.toBeInTheDocument();
        });
        
        expect(QuizApiUtils.deleteQuestion).toHaveBeenCalledWith(1); 
    });


});

describe.skip('VisualFlowChartQuiz', () => {
    test('placeholder', () => {
      // This test is intentionally skipped
    });
  });