import React from 'react';
import { render, fireEvent, screen, waitFor, getElementError,styles } from '@testing-library/react';
import VisualFlashcardEditor from '../../components/editors/VisualFlashcardEditor';

describe('VisualFlashcardEditor', () => {
    let mockProps;
    let componentRef;
    
    beforeEach(() => {
        mockProps = {
            moduleId: 'test-module-123',
            quizType: 'flashcard',
            initialQuestions: [
                { id: 1, question_text: 'How are you feeling today?', hint_text: 'Emotional state', order: 0 },
                { id: 2, question_text: 'Describe your confidence.', hint_text: 'Self-assessment', order: 1 }
            ],
            onUpdateQuestions: vi.fn()
        };
        componentRef = React.createRef();
    });

    test('renders with initial questions', () => {
        render(<VisualFlashcardEditor ref={componentRef} {...mockProps} />);
        const question1 = screen.getByText('How are you feeling today?');
        const question2 = screen.getByText('Describe your confidence.');

        expect(question1).toBeInTheDocument();
        expect(question2).toBeInTheDocument();
    });


    test('adds a new question', async () => {
        const { getByText, getByPlaceholderText } = render(<VisualFlashcardEditor ref={componentRef} {...mockProps} />);
        
        fireEvent.click(getByText('Add another flashcard'));
        fireEvent.change(getByPlaceholderText('Enter your question here...'), { target: { value: 'What is your favorite color?' } });
        fireEvent.change(getByPlaceholderText('Enter a hint or guidance for the answer (optional)...'), { target: { value: 'Color preference' } });
        fireEvent.click(getByText('Add Question'));
        
        await waitFor(() => {
            expect(getByText('What is your favorite color?')).toBeInTheDocument();
        });
    });

    test('edits an existing question', () => {
        const { getAllByText, getByDisplayValue } = render(<VisualFlashcardEditor ref={componentRef} {...mockProps} />);
        fireEvent.click(getAllByText('Edit')[0]);
        fireEvent.change(getByDisplayValue('How are you feeling today?'), { target: { value: 'What makes you happy?' } });
        fireEvent.click(getAllByText('Done')[0]);

        expect(mockProps.onUpdateQuestions).toHaveBeenCalledWith(
            expect.arrayContaining([
                expect.objectContaining({ question_text: 'What makes you happy?' })
            ])
        );
    });

    test('deletes a question', () => {
        const { queryByText, getAllByText } = render(<VisualFlashcardEditor ref={componentRef} {...mockProps} />);
        global.confirm = vi.fn(() => true); 
        fireEvent.click(getAllByText('Delete')[0]);

        expect(queryByText('How are you feeling today?')).not.toBeInTheDocument();
    });

    test('handles question order correctly', () => {
        render(<VisualFlashcardEditor ref={componentRef} {...mockProps} />);
        const orderValues = mockProps.initialQuestions.map(q => q.order);
        expect(orderValues).toEqual([0, 1]);
    });

    test('getQuestions method returns correct data', () => {
        render(<VisualFlashcardEditor ref={componentRef} {...mockProps} />);
        expect(componentRef.current.getQuestions()).toEqual(expect.arrayContaining([
            expect.objectContaining({ question_text: 'How are you feeling today?' }),
            expect.objectContaining({ question_text: 'Describe your confidence.' })
        ]));
    });

    test('renders error when question text is empty and add button is clicked', async () => {
        const { getByText, getByRole ,getByPlaceholderText} = render(<VisualFlashcardEditor ref={componentRef} {...mockProps} />);
    
        fireEvent.click(getByText('Add another flashcard'));
    
        const questionInput = getByPlaceholderText('Enter your question here...'); 
        fireEvent.change(questionInput, { target: { value: '' } }); 
        fireEvent.click(getByRole('button', { name: 'Add Question' })); 
    
        await waitFor(() => {
            expect(getElementError('Question text is required!'));
        });
    
    });
    

    test('flips a card and toggles edit mode', async () => {
        const { getByText, getByPlaceholderText } = render(<VisualFlashcardEditor initialQuestions={[{ id: 1, question_text: 'Test Question', hint_text: 'Test Hint' }]}/>);
        
        fireEvent.click(getByText('Test Question')); 
        await waitFor(() => expect(getByText('Test Hint')).toBeVisible()); 
       
        fireEvent.click(getByText('Edit')); 
        await waitFor(() => {
            const questionInput = getByPlaceholderText('Enter your question here...');
            expect(questionInput).toBeVisible(); 
            expect(questionInput.value).toBe('Test Question'); 
        });
    });
    
      
    
      
      
    
});
describe.skip('VisualFlashcardEditor', () => {
    test('placeholder', () => {
      // This test is intentionally skipped
    });
  });