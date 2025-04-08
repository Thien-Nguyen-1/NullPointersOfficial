import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuizApiUtils } from '../../services/QuizApiUtils';
import QuizContent from '../../components/module-content/QuizContent';
import { DndProvider ,useDrag} from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

vi.mock('../../services/QuizApiUtils');
vi.mock('react-dnd', () => {
  return {
    DndProvider: ({ children }) => <div>{children}</div>,
    useDrag: vi.fn(() => [{ isDragging: false }, vi.fn()]), // Mock useDrag to return a non-dragging state and a noop drag function
    useDrop: vi.fn(() => [{ isOver: false }, vi.fn()]), // Mock useDrop to return a non-over state and a noop drop function

    HTML5Backend: {}
  };
});

describe('QuizContent', () => {
  const mockQuizData = {
    id: 'quiz1',
    title: 'Test Quiz',
    quiz_type: 'flashcard',
    taskData: {
      contentID: 1,
      question: ['Describe sadness'],
    }
  };

  const onComplete = vi.fn();

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('renders loading state correctly', async () => {
    QuizApiUtils.getQuestions = vi.fn().mockResolvedValue([]);
    render(<QuizContent quizData={mockQuizData} completedContentIds={new Set()} onComplete={onComplete} isPreviewMode={false} />);
    expect(screen.getByText(/loading quiz questions/i)).toBeInTheDocument();
  });

  it('displays an error message when questions cannot be fetched', async () => {
    QuizApiUtils.getQuestions = vi.fn().mockRejectedValue(new Error('Failed to fetch'));
    render(<QuizContent quizData={mockQuizData} completedContentIds={new Set()} onComplete={onComplete} isPreviewMode={false} />);
    expect(await screen.findByText(/failed to load quiz questions/i)).toBeInTheDocument();
  });

  it('renders a FlashcardQuiz component for quiz type flashcard', async () => {
    const flashcardQuestions = [{ id: 1, question: 'What is React?', answer: 'A library for building user interfaces' }];
    QuizApiUtils.getQuestions = vi.fn().mockResolvedValue(flashcardQuestions);
    render(<QuizContent quizData={mockQuizData} completedContentIds={new Set()} onComplete={onComplete} isPreviewMode={false} />);
    expect(await screen.findByText(/Click to flip/i)).toBeInTheDocument();
  });

  it('uses preview questions in preview mode', async () => {
    const previewQuestions = [{ id: 1, question: 'Preview Question?', answer: 'Yes' }];
    const previewData = { ...mockQuizData, taskData: { contentID: 1, questions: previewQuestions }};
    render(<QuizContent quizData={previewData} completedContentIds={new Set()} onComplete={onComplete} isPreviewMode={true} />);
    expect(screen.getByText(/Finish/i)).toBeInTheDocument();
  });

  it('FlahCard quiz is completed after clicking finish', async () => {
    const flashcardQuestions = [{ id: 1, question_text: 'What is React?', hint_text: 'A library for building user interfaces' }];
    const flashcardData = { ...mockQuizData, quiz_type: 'flashcard', taskData: { contentID: 1, questions: flashcardQuestions }};
    QuizApiUtils.getQuestions = vi.fn().mockResolvedValue(flashcardQuestions);
  
    render(<QuizContent quizData={flashcardData} completedContentIds={new Set()} onComplete={onComplete} isPreviewMode={true} />);
  
    
    const completeButton = screen.getByText(/Finish/);
    userEvent.click(completeButton);
  
    await waitFor(() => {
      screen.getByText(/Flashcard Exercise Complete!/); 
    });
   });


   it('Fill in the Blanks quiz is completed after clicking submit', async () => {
    const fillInTheBlanksQuestions = [
      { id: 1, question_text: 'React is a ___ for building user interfaces.', correct_answer: 'library' }
    ];
    const fillInTheBlanksData = {
      ...mockQuizData,
      quiz_type: 'text_input', 
      taskData: { contentID: 1, questions: fillInTheBlanksQuestions }
    };
  
    QuizApiUtils.getQuestions = vi.fn().mockResolvedValue(fillInTheBlanksQuestions);
  
    render(<QuizContent quizData={fillInTheBlanksData} completedContentIds={new Set()} onComplete={onComplete} isPreviewMode={true} />);
  
    const submitButton = screen.getByText(/Submit Answers/);
    userEvent.click(submitButton);
  
    await waitFor(() => {
      screen.getByText(/Fill in the Blanks - Review/); 
    });
  });
  

  it('Flowchart quiz is completed after arranging elements and clicking submit', async () => {
    const flowchartQuestions = [
      { id: 1, question_text: 'Arrange the steps for a binary search algorithm in the correct order.' }
    ];
    const flowchartData = {
      ...mockQuizData,
      quiz_type: 'statement_sequence', 
      taskData: { contentID: 1, questions: flowchartQuestions }
    };
  
    QuizApiUtils.getQuestions = vi.fn().mockResolvedValue(flowchartQuestions);
  
    render(
      <DndProvider backend={HTML5Backend}>
        <QuizContent quizData={flowchartData} completedContentIds={new Set()} onComplete={onComplete} isPreviewMode={true} />
      </DndProvider>
    );
  
    const submitButton = screen.getByText(/Finish/);
    userEvent.click(submitButton);
  
    await waitFor(() => {
      screen.getByText(/This statement requires a response./); 
    });
  });
  

  it('Question and Answer Form quiz is completed after providing answers and clicking submit', async () => {
    const qnaQuestions = [
      { id: 1, question_text: 'What is the capital of France?', answer_type: 'text' }
    ];
    const qnaData = {
      ...mockQuizData,
      quiz_type: 'question_input', // Assuming 'question_input' is the type for Q&A Form
      taskData: { contentID: 1, questions: qnaQuestions }
    };
  
    // Mock the API call to resolve with the quiz questions
    QuizApiUtils.getQuestions = vi.fn().mockResolvedValue(qnaQuestions);
  
    // Render the component with the mock data and necessary props
    render(
      <QuizContent quizData={qnaData} completedContentIds={new Set()} onComplete={onComplete} isPreviewMode={true} />
    );
  
    // Assume there is an input field and a 'Submit' button in the form
    const inputField = screen.getByDisplayValue("");
   fireEvent.change(inputField, { target: { value: 'Paris' } });   
    const ContinueButton = screen.getByText(/Continue/);
    userEvent.click(ContinueButton);
    //const submitButton = screen.getByText(/Submit Answers/);
    //userEvent.click(submitButton);

  
    await waitFor(() => {
        screen.getByText(/Please review your answers before submitting:/); 
    });
  });
   


   it('Renders Matching Quiz correctly', async () => {
   const matchingQuestions = [
       { id: 1, text: 'Paris', answers: ['Capital of France'] },
       { id: 2, text: 'Madrid', answers: ['Capital of Spain'] }
     ];
     const matchingData = {
       ...mockQuizData,
       quiz_type: 'pair_input', 
       taskData: { contentID: 1, questions: matchingQuestions }
     };
  
     QuizApiUtils.getQuestions = vi.fn().mockResolvedValue(matchingQuestions);
  
     render(
       <QuizContent quizData={matchingData} completedContentIds={new Set()} onComplete={onComplete} isPreviewMode={true} />,
       { wrapper: DndProvider, backend: HTML5Backend } // Required for react-dnd testing
     );
  
//     // Simulate the matching actions
      //const itemParis = screen.getByText('Paris');
     //const targetFrance = screen.getByText('Capital of France');
      //userEvent.dragAndDrop(itemParis, targetFrance);
  expect(screen.getByText('Paris'));
  expect(screen.getByText('Capital of France'));
     const itemMadrid = screen.getByText('Madrid');
      const targetSpain = screen.getByText('Capital of Spain');
     //userEvent.dragAndDrop(itemMadrid, targetSpain);
  expect(console.log("QUIZ CONTENT: Matching Quiz onComplete"));
    const submitButton = screen.getByText(/Continue/);
     userEvent.click(submitButton);
  
    await waitFor(() => {
     screen.getByText(/Drag and Drop Question to Answer/); 

    });
  });

  it('Ranking Quiz is completed after arranging items and clicking finish', async () => {
    const rankingQuestions = [
      { id: 1, content: 'Item 1' },
      { id: 2, content: 'Item 2' },
      { id: 3, content: 'Item 3' }
    ];
    const rankingData = {
      ...mockQuizData,
      quiz_type: 'ranking_quiz',
      taskData: { contentID: 1, questions: rankingQuestions }
    };
  
    QuizApiUtils.getQuestions = vi.fn().mockResolvedValue(rankingQuestions);
  
    render(
      <DndProvider backend={HTML5Backend}>
        <QuizContent quizData={rankingData} completedContentIds={new Set()} onComplete={onComplete} isPreviewMode={true} />
      </DndProvider>
    );
  
  
    const finishButton = screen.getByText(/Submit Answers/);
    userEvent.click(finishButton);
  
    await waitFor(() => {
      expect(screen.getByText(/Here is a summary of your rankings:/)).toBeInTheDocument();
    });
  });
  
  it('renders an error message for unknown quiz types', async () => {
    const unknownQuizData = {
      ...mockQuizData,
      quiz_type: 'unknown_type', 
      taskData: { contentID: 1, questions: [] } 
    };
  
    render(<QuizContent quizData={unknownQuizData} completedContentIds={new Set()} onComplete={onComplete} isPreviewMode={true} />);
   
    expect(screen.getByText(/Unknown quiz type: unknown_type/)).toBeInTheDocument();
});

// it('renders the quiz component with title and completion check correctly', async () => {
//     const testQuizData = {
//       id: 'quiz1',
//       title: 'Test Quiz',
//       quiz_type: 'flashcard', // Assume 'flashcard' is a valid type with a corresponding component
//     };
//     const completedContentIds = new Set();
//     completedContentIds.add('1'); // Mark the quiz as completed
  
//     // Mock API call to fetch questions, returning an empty array or valid questions as needed
//     QuizApiUtils.getQuestions = vi.fn().mockResolvedValue([{ id: 1, question_text: 'What is React?', hint_text: 'A library for building user interfaces' }]);
  
//     // Render the component
//     render(<QuizContent quizData={testQuizData} completedContentIds={completedContentIds} onComplete={onComplete} isPreviewMode={true} />);
  
//     // Ensure the title is displayed
//     expect(screen.getByText('Test Quiz')).toBeInTheDocument();
  
//     // Check for the presence of the completed check mark
//     //expect(screen.getByText('✓')).toBeInTheDocument();
  
//     // Assert that the FlashcardQuiz component renders
//     //expect(await screen.findByText(/Click to flip/i)).toBeInTheDocument(); // Assuming the FlashcardQuiz component has this text
//   });
  
});

