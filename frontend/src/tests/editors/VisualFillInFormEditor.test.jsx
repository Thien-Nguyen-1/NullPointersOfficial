import React from 'react';
import { render, fireEvent, screen,getElementError ,act, getByPlaceholderText} from '@testing-library/react';
import VisualFillTheFormEditor from '../../components/editors/VisualFillTheFormEditor';

describe('VisualFillTheFormEditor', () => {
    let mockProps;
    let componentRef;
    
    beforeEach(() => {
        mockProps = {
            moduleId: 'test-module-123',
            quizType: 'text_input',
            initialQuestions: [
                { id: 1, question_text: 'My Mood is (____) today.', order: 0 },
                { id: 2, question_text: 'I am (____).', order: 1 }
            ],
            setQuestion: vi.fn()
        };
        componentRef = React.createRef();
    });

    test('renders with initial questions', () => {
        render(<VisualFillTheFormEditor ref={componentRef} {...mockProps} />);
    
        const moodQuestionTextPart1 = screen.getByText(/My Mood is/);
        const moodQuestionTextPart2 = screen.getByText(/today\./);
    
        expect(moodQuestionTextPart1).toBeInTheDocument();
        expect(moodQuestionTextPart2).toBeInTheDocument();
    
        console.log(moodQuestionTextPart1.closest('.fitb-question-box').innerHTML);
        console.log(moodQuestionTextPart2.closest('.fitb-question-box').innerHTML);
    
        const inputBetween = moodQuestionTextPart1.closest('.fitb-question-box').querySelector('input.fitb-input-field');
        expect(inputBetween).toBeInTheDocument();
    });

    test('renders without initial questions', () => {
        render(<VisualFillTheFormEditor />);
        expect(screen.getByText("No questions added yet. Add a question using the form above.")).toBeInTheDocument();
      });
      
      test('adds a new question when form is submitted', () => {
        const { getByText, getByPlaceholderText } =  render(<VisualFillTheFormEditor ref={componentRef} {...mockProps} />);

        fireEvent.change(getByPlaceholderText(/Enter question with ____ for blanks/), { target: { value: 'Life is (____).' } });
        fireEvent.click(getByText('Add Question', { selector: 'button' }));
        expect(screen.getByText(/Life is/)).toBeInTheDocument();
      });


      test('edits and saves an existing question', async () => {
        const mockQuestions = [{ id: 1, question_text: 'I am (____).', order: 1 }];
        const { container, getByText, getByPlaceholderText } = render(<VisualFillTheFormEditor initialQuestions={mockQuestions} />);
      
        const editIcons = container.querySelectorAll('.fitb-edit-icon');
        fireEvent.click(editIcons[0]); 
      
        const textarea = getByText('I am (____).');
        fireEvent.change(textarea, { target: { value: 'I was sad.' } });
        fireEvent.click(getByText('Save'));
      
        expect(screen.getByText(/I was/)).toBeInTheDocument();
      });
      
      test('deletes a question', () => {
        const mockQuestions = [{ id: 1, question_text: 'I am (____).', order: 1 }];
        const { container } = render(<VisualFillTheFormEditor initialQuestions={mockQuestions} />);
      
        const deleteIcons = container.querySelectorAll('.fitb-delete-icon');
        if (deleteIcons.length > 0) {
          fireEvent.click(deleteIcons[0]); 
        }
      
        expect(screen.queryByText(/I am/)).not.toBeInTheDocument();
      });
      
    test('shows error if blank is incorrect in added question', () => {
        const { getByText, getByPlaceholderText } = render(<VisualFillTheFormEditor />);
        fireEvent.change(getByPlaceholderText(/Enter question with ____ for blanks/), { target: { value: 'It is (_).' } });
        fireEvent.click(getByText('Add Question', { selector: 'button' }));
        expect(screen.getByText(/No questions added yet. Add a question using the form above./)).toBeInTheDocument();
        expect(getElementError(/Each question must contain at least one blank space (____). Please adjust your input./));

      });
      
      test('calls onUpdateQuestions when questions update', () => {
        const onUpdateQuestions = vi.fn();
        const { getByText, getByPlaceholderText } = render(<VisualFillTheFormEditor onUpdateQuestions={onUpdateQuestions} />);
        
        fireEvent.change(getByPlaceholderText(/Enter question with ____ for blanks/), { target: { value: 'Life is (____).' } });
        fireEvent.click(getByText('Add Question', { selector: 'button' }));
      
        expect(onUpdateQuestions).toHaveBeenCalledWith(expect.anything());
      });
      
      it('normalizes and sets new questions correctly', () => {
        const ref = React.createRef();
        render(<VisualFillTheFormEditor ref={ref} />);
        
        const newQuestions = [
          'What is your favorite color?',
          { question_text: 'Your age?', hint_text: 'Enter your age', order: 1 },
          { text: 'New text format', id: 'custom-id' } 
        ];
      
        act(() => {
          ref.current.setQuestions(newQuestions);
        });
      
        const expectedQuestions = [
          { id: expect.any(String), question_text: 'What is your favorite color?', hint_text: '', order: 0 },
          { id: expect.any(String), question_text: 'Your age?', hint_text: 'Enter your age', order: 1 },
          { id: 'custom-id', question_text: 'New text format', hint_text: '', order: 2 } 
        ];
      
        expect(ref.current.getQuestions()).toEqual(expectedQuestions);
      });
    
      
  test('getQuestions returns formatted questions correctly', () => {
    const ref = React.createRef();
        render(<VisualFillTheFormEditor ref={ref} />);
    act(() => {
      ref.current.setQuestions([
        'Question 1',
        { id: '2', question_text: 'Question 2', hint_text: 'Hint 2', order: 1 },
        'Question 3'
      ]);
    });

    let formattedQuestions = ref.current.getQuestions();

    const expectedQuestions = [
      { id: expect.any(String), question_text: 'Question 1', hint_text: "", order: 0 },
      { id: '2', question_text: 'Question 2', hint_text: 'Hint 2', order: 1 },
      { id: expect.any(String), question_text: 'Question 3', hint_text: "", order: 2 }
    ];

    expect(formattedQuestions).toEqual(expectedQuestions);
  });




  test('validates that blanks are exactly four underscores', () => {

    const { getByText, getByPlaceholderText } =  render(<VisualFillTheFormEditor ref={componentRef} {...mockProps} />);

    fireEvent.change(getByPlaceholderText(/Enter question with ____ for blanks/), { target: { value: 'i am (__) today' } });
    fireEvent.click(getByText('Add Question', { selector: 'button' }));
    expect(getElementError('Blanks must be exactly 4 underscores (____) with no more or less.'));
  });




//   test('updates questions correctly using editQuestion', () => {
//     // Set initial questions
//     const componentRef = React.createRef();
//         render(<VisualFillTheFormEditor ref={componentRef} />);
//     act(() => {
//       componentRef.current.setQuestions([
//         { id: '1', question_text: 'Original Question?', hint_text: 'Original Hint', order: 0 },
//         'Simple question text'
//       ]);
//     });

//     // Edit first question object with a new object
//     act(() => {
//       componentRef.current.editQuestion(0, {
//         question_text: 'Updated Question',
//         hint_text: 'Updated Hint',
//         order: 0
//       });
//     });

//     // Edit second question string with a new question object
//     act(() => {
//       componentRef.current.editQuestion(1, {
//         question_text: 'Transformed to full question object',
//         hint_text: 'New hint'
//       });
//     });

//     // Retrieve and test the updated state
//     let updatedQuestions = componentRef.current.getQuestions();

//     expect(updatedQuestions).toEqual([
//       { id: '1', question_text: 'Updated Question', hint_text: 'Updated Hint', order: 0 },
//       { id: expect.any(String), question_text: 'Transformed to full question object', hint_text: 'New hint', order: 1 }
//     ]);
    
//     // Edit an object to a simple string
//     act(() => {
//       componentRef.current.editQuestion(0, 'Now just a string');
//     });

//     // Edit a string to another string
//     act(() => {
//       componentRef.current.editQuestion(1, 'Another simple string');
//     });

//     // Test the string updates
//     updatedQuestions = componentRef.current.getQuestions();
//     expect(updatedQuestions).toEqual([
//       { id: expect.any(String), question_text: 'Now just a string', hint_text: '', order: 0 },
//       { id: expect.any(String), question_text: 'Another simple string', hint_text: '', order: 1 }
//     ]);
//   });
});
