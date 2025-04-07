// import React from 'react';
// import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
// import QuestionAndAnswerForm from '../../components/quizzes/QuestionAndAnswerForm';
// import { QuizApiUtils } from "../../services/QuizApiUtils";
// import { vi } from 'vitest';


// // Mock localStorage
// const localStorageMock = (function() {
//   let store = {};
//   return {
//     getItem: vi.fn(key => store[key] || null),
//     setItem: vi.fn((key, value) => {
//       store[key] = value.toString();
//     }),
//     clear: function() {
//       store = {};
//     }
//   };
// })();

// Object.defineProperty(window, 'localStorage', {
//   value: localStorageMock
// });

// vi.mock("../../services/QuizApiUtils"); 

// describe('QuestionAndAnswerForm', () => {
//     const sampleQuestions = [
//         { id: 1, text: 'What is your name?' },
//         { id: 2, text: 'What is your quest?' }
//     ];
    
//     beforeEach(() => {
//         QuizApiUtils.getQuestions = vi.fn();
//         vi.clearAllMocks();
//         window.localStorage.clear();
//         vi.restoreAllMocks();
//     });

//     test('renders loading state initially', async () => {
//         QuizApiUtils.getQuestions.mockReturnValue(new Promise(resolve => setTimeout(() => resolve([]), 100)));

//         render(<QuestionAndAnswerForm taskId={1} onComplete={() => {}} />);
//         expect(screen.getByText(/loading/i)).toBeInTheDocument();

//         await waitFor(() => {
//             expect(QuizApiUtils.getQuestions).toHaveBeenCalledWith(1);
//         });
//     });
    
//     test('fetches questions and renders them', async () => {
//         QuizApiUtils.getQuestions.mockResolvedValue(sampleQuestions);

//         render(<QuestionAndAnswerForm taskId={1} onComplete={() => {}} />);

//         const question1 = await screen.findByDisplayValue('What is your name?');
//         const question2 = await screen.findByDisplayValue('What is your quest?');

//         expect(question1).toBeInTheDocument();
//         expect(question2).toBeInTheDocument();
//     });

//     test('displays error when fetching questions fails', async () => {
//         QuizApiUtils.getQuestions.mockRejectedValue(new Error('Failed to fetch'));
        
//         render(<QuestionAndAnswerForm taskId={1} onComplete={() => {}} />);
        
//         const errorText = await screen.findByText(/failed to load questions/i);
//         expect(errorText).toBeInTheDocument();
//     });

//     test('handles answer changes correctly', async () => {
//         QuizApiUtils.getQuestions.mockResolvedValue([{ id: 1, text: 'What is your name?' }]);
    
//         render(<QuestionAndAnswerForm taskId={1} onComplete={() => {}} />);
        
//         await waitFor(() => screen.getByDisplayValue('What is your name?'));
    
//         const answerInput = screen.getByPlaceholderText('Write your answer here...');
//         fireEvent.change(answerInput, { target: { value: 'Alice' } });
        
//         expect(answerInput.value).toBe('Alice');
//     });

//     test('shows validation errors when submitting without answers', async () => {
//         QuizApiUtils.getQuestions.mockResolvedValue(sampleQuestions);
    
//         render(<QuestionAndAnswerForm taskId={1} onComplete={() => {}} />);
        
//         await waitFor(() => screen.getAllByPlaceholderText('Write your answer here...'));
        
//         // Submit the form without entering any answers
//         const continueButton = screen.getByRole('button', { name: /continue/i });
//         fireEvent.click(continueButton);
        
//         // Check if validation errors appear
//         expect(screen.getByText(/please answer all questions before continuing/i)).toBeInTheDocument();
//         expect(screen.getAllByText(/this question requires an answer/i).length).toBe(2);
//     });

//     test('enters review mode when submitting with valid answers', async () => {
//         QuizApiUtils.getQuestions.mockResolvedValue(sampleQuestions);
    
//         render(<QuestionAndAnswerForm taskId={1} onComplete={() => {}} />);
        
//         const answerInputs = await waitFor(() => screen.getAllByPlaceholderText('Write your answer here...'));
        
//         // Fill in all answers
//         fireEvent.change(answerInputs[0], { target: { value: 'Alice' } });
//         fireEvent.change(answerInputs[1], { target: { value: 'To find the Holy Grail' } });
        
//         // Submit the form
//         const continueButton = screen.getByRole('button', { name: /continue/i });
//         fireEvent.click(continueButton);
        
//         // Check if we're in review mode
//         expect(screen.getByText(/review your answers/i)).toBeInTheDocument();
//         expect(screen.getByText(/alice/i)).toBeInTheDocument();
//         expect(screen.getByText(/to find the holy grail/i)).toBeInTheDocument();
//         expect(screen.getByRole('button', { name: /back to quiz/i })).toBeInTheDocument();
//         expect(screen.getByRole('button', { name: /submit answers/i })).toBeInTheDocument();
//     });

//     test('can navigate back from review mode to edit answers', async () => {
//         QuizApiUtils.getQuestions.mockResolvedValue(sampleQuestions);
    
//         render(<QuestionAndAnswerForm taskId={1} onComplete={() => {}} />);
        
//         const answerInputs = await waitFor(() => screen.getAllByPlaceholderText('Write your answer here...'));
        
//         // Fill in all answers
//         fireEvent.change(answerInputs[0], { target: { value: 'Alice' } });
//         fireEvent.change(answerInputs[1], { target: { value: 'To find the Holy Grail' } });
        
//         // Submit to enter review mode
//         const continueButton = screen.getByRole('button', { name: /continue/i });
//         fireEvent.click(continueButton);
        
//         // Go back to edit mode
//         const backButton = screen.getByRole('button', { name: /back to quiz/i });
//         fireEvent.click(backButton);
        
//         // We should be back in the form
//         expect(screen.getByDisplayValue('Alice')).toBeInTheDocument();
//         expect(screen.getByDisplayValue('To find the Holy Grail')).toBeInTheDocument();
//         expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
//     });

//     // test('submits the form and shows completion screen when all answers are provided', async () => {
//     //     // Setup a mock that resolves immediately
//     //     QuizApiUtils.getQuestions.mockImplementation(() => {
//     //         return Promise.resolve(sampleQuestions);
//     //     });
        
//     //     const onComplete = vi.fn();
        
//     //     render(<QuestionAndAnswerForm taskId={1} onComplete={onComplete} />);
        
//     //     // Debug the current state
//     //     console.log('Initial render state:', screen.getByText(/loading/i).textContent);
        
//     //     // Force the promise to resolve
//     //     await act(async () => {
//     //         await Promise.resolve();
//     //         await new Promise(resolve => setTimeout(resolve, 0));
//     //     });
        
//     //     // Debug output to see what's in the DOM after waiting
//     //     screen.debug();
        
//     //     // Look for question inputs first to confirm loading is complete
//     //     const questionInputs = await screen.findAllByDisplayValue((content, element) => {
//     //         return content.includes('What is your');
//     //     }, { timeout: 3000 });
        
//     //     console.log('Found question inputs:', questionInputs.length);
        
//     //     // Now look for answer inputs
//     //     const answerInputs = await screen.findAllByPlaceholderText('Write your answer here...');
        
//     //     // Fill in all answers
//     //     fireEvent.change(answerInputs[0], { target: { value: 'Alice' } });
//     //     fireEvent.change(answerInputs[1], { target: { value: 'To find the Holy Grail' } });
        
//     //     // Click the continue button
//     //     const continueButton = screen.getByText('Continue');
//     //     fireEvent.click(continueButton);
        
//     //     // Wait for review mode
//     //     await screen.findByText(/review your answers/i);
        
//     //     // Click submit
//     //     const submitButton = screen.getByText('Submit Answers');
//     //     fireEvent.click(submitButton);
        
//     //     // Check completion
//     //     await screen.findByText(/quiz completed successfully/i);
//     //     expect(onComplete).toHaveBeenCalled();
//     // });

//     test('restarts the quiz when restart button is clicked', async () => {
//         QuizApiUtils.getQuestions.mockResolvedValue(sampleQuestions);
//         const onComplete = vi.fn();
    
//         render(<QuestionAndAnswerForm taskId={1} onComplete={onComplete} />);
        
//         const answerInputs = await waitFor(() => screen.getAllByPlaceholderText('Write your answer here...'));
        
//         // Fill in all answers
//         fireEvent.change(answerInputs[0], { target: { value: 'Alice' } });
//         fireEvent.change(answerInputs[1], { target: { value: 'To find the Holy Grail' } });
        
//         // Submit to enter review mode
//         const continueButton = screen.getByRole('button', { name: /continue/i });
//         fireEvent.click(continueButton);
        
//         // Submit final answers
//         const submitButton = screen.getByRole('button', { name: /submit answers/i });
//         fireEvent.click(submitButton);
    
//         // Now restart the quiz
//         const restartButton = screen.getByRole('button', { name: /restart quiz/i });
//         fireEvent.click(restartButton);
        
//         // We should be back in the form
//         expect(screen.getByRole('button', { name: /continue/i })).toBeInTheDocument();
//         expect(screen.getAllByPlaceholderText('Write your answer here...').length).toBe(2);
//     });

//     test('works in preview mode with provided questions', async () => {
//         const previewQuestions = [
//             { id: 101, text: 'Preview question 1?' },
//             { id: 102, text: 'Preview question 2?' }
//         ];
        
//         const onComplete = vi.fn();
        
//         render(
//             <QuestionAndAnswerForm 
//                 taskId={1} 
//                 onComplete={onComplete} 
//                 isPreview={true} 
//                 previewQuestions={previewQuestions} 
//             />
//         );
        
//         // Should not call API in preview mode
//         expect(QuizApiUtils.getQuestions).not.toHaveBeenCalled();
        
//         // Should render preview questions
//         const question1 = await screen.findByDisplayValue('Preview question 1?');
//         const question2 = await screen.findByDisplayValue('Preview question 2?');
//         expect(question1).toBeInTheDocument();
//         expect(question2).toBeInTheDocument();
        
//         // Complete the preview quiz
//         const answerInputs = screen.getAllByPlaceholderText('Write your answer here...');
//         fireEvent.change(answerInputs[0], { target: { value: 'Preview answer 1' } });
//         fireEvent.change(answerInputs[1], { target: { value: 'Preview answer 2' } });
        
//         // Submit to enter review mode
//         const continueButton = screen.getByRole('button', { name: /continue/i });
//         fireEvent.click(continueButton);
        
//         // Submit final answers in preview mode
//         const submitButton = screen.getByRole('button', { name: /submit answers/i });
//         fireEvent.click(submitButton);
        
//         // Should call onComplete with preview flag
//         expect(onComplete).toHaveBeenCalledWith({ preview: true });
//     });

//     test('loads completed quiz from localStorage', async () => {
//         // Setup localStorage with completed quiz data
//         const storedAnswers = { "1": "Stored answer 1", "2": "Stored answer 2" };
//         window.localStorage.setItem(
//             'qa-quiz-state-1', 
//             JSON.stringify({
//                 submittedAnswers: storedAnswers,
//                 isCompleted: true
//             })
//         );
        
//         // Create a Set with the taskId to simulate completedContentIds
//         const completedContentIds = new Set([1]);
        
//         QuizApiUtils.getQuestions.mockResolvedValue(sampleQuestions);
        
//         render(
//             <QuestionAndAnswerForm 
//                 taskId={1} 
//                 onComplete={() => {}} 
//                 completedContentIds={completedContentIds} 
//             />
//         );
        
//         // Should show completed screen with stored answers
//         expect(await screen.findByText(/quiz completed successfully/i)).toBeInTheDocument();
//         expect(screen.getByText(/stored answer 1/i)).toBeInTheDocument();
//         expect(screen.getByText(/stored answer 2/i)).toBeInTheDocument();
        
//         // Verify localStorage was checked
//         expect(window.localStorage.getItem).toHaveBeenCalledWith('qa-quiz-state-1');
//     });

//     // test('saves quiz state to localStorage when completing quiz', async () => {
//     //     QuizApiUtils.getQuestions.mockResolvedValue(sampleQuestions);
        
//     //     render(<QuestionAndAnswerForm taskId={1} onComplete={() => {}} />);
        
//     //     const answerInputs = await waitFor(() => screen.getAllByPlaceholderText('Write your answer here...'));
        
//     //     // Fill in all answers
//     //     fireEvent.change(answerInputs[0], { target: { value: 'Alice' } });
//     //     fireEvent.change(answerInputs[1], { target: { value: 'To find the Holy Grail' } });
        
//     //     // Submit to enter review mode
//     //     const continueButton = screen.getByRole('button', { name: /continue/i });
//     //     fireEvent.click(continueButton);
        
//     //     // Submit final answers
//     //     const submitButton = screen.getByRole('button', { name: /submit answers/i });
//     //     fireEvent.click(submitButton);
        
//     //     // Verify localStorage was updated
//     //     expect(window.localStorage.setItem).toHaveBeenCalledWith(
//     //         'qa-quiz-state-1',
//     //         expect.stringContaining('Alice')
//     //     );
        
//     //     // Parse the saved JSON to verify structure
//     //     const setItemCall = window.localStorage.setItem.mock.calls.find(
//     //         call => call[0] === 'qa-quiz-state-1'
//     //     );
        
//     //     const savedData = JSON.parse(setItemCall[1]);
//     //     expect(savedData.isCompleted).toBe(true);
//     //     expect(savedData.submittedAnswers).toEqual({ "1": "Alice", "2": "To find the Holy Grail" });
//     // });

//     test('handles the component instance methods', async () => {
//         QuizApiUtils.getQuestions.mockResolvedValue(sampleQuestions);
        
//         render(<QuestionAndAnswerForm taskId={1} onComplete={() => {}} />);
        
//         await waitFor(() => screen.getAllByPlaceholderText('Write your answer here...'));
        
//         // Test the component instance methods
//         expect(QuestionAndAnswerForm.componentInstance).toBeDefined();
        
//         // Test getQuestions
//         expect(QuestionAndAnswerForm.componentInstance.getQuestions()).toEqual(sampleQuestions);
        
//         // Test setQuestions
//         const newQuestions = [
//             { id: 3, text: 'What is your favorite color?' }
//         ];
        
//         act(() => {
//             QuestionAndAnswerForm.componentInstance.setQuestions(newQuestions);
//         });
        
//         // Verify the new questions are displayed
//         await waitFor(() => screen.getByDisplayValue('What is your favorite color?'));
//         expect(screen.queryByDisplayValue('What is your name?')).not.toBeInTheDocument();
//     });

//     test('handles missing questions by showing error message', async () => {
//         // Mock the API to return an empty array
//         QuizApiUtils.getQuestions.mockResolvedValue([]);
        
//         render(<QuestionAndAnswerForm taskId={1} onComplete={() => {}} />);
        
//         // Should show error message for no questions
//         expect(await screen.findByText(/no questions available/i)).toBeInTheDocument();
//     });
// });