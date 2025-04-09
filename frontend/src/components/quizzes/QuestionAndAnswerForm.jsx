import React, { useState, useEffect, useRef } from 'react';
import { QuizApiUtils } from "../../services/QuizApiUtils";
import "../../styles/Quizzes/QuestionAndAnswerForm.css";

const QuestionAndAnswerForm = ({ taskId, onComplete,isPreview = false, previewQuestions = null, completedContentIds = new Set()  }) => {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [quizCompleted, setQuizCompleted] = useState(false); // New state for tracking quiz completion
    const [validationErrors, setValidationErrors] = useState({});
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    const [showReview, setShowReview] = useState(false);

    // Use ref to maintain state across re-renders
    const completionStateRef = useRef({
        isCompleted: false,
        submittedAnswers: null
    });
    
    useEffect(() => {
        // Check if this quiz is already marked as completed in parent component
        if (completedContentIds && completedContentIds.has(taskId)) {
            console.log("Quiz already marked as completed in parent");
            setQuizCompleted(true);
            completionStateRef.current.isCompleted = true;
            
            // Try to load saved answers from localStorage if available
            try {
                const savedState = localStorage.getItem(`qa-quiz-state-${taskId}`);
                if (savedState) {
                    const parsed = JSON.parse(savedState);
                    setAnswers(parsed.submittedAnswers || {});
                    completionStateRef.current.submittedAnswers = parsed.submittedAnswers || {};
                }
            } catch (e) {
                console.error("Failed to load saved quiz state", e);
            }
        } else if (completionStateRef.current.isCompleted) {
            setQuizCompleted(true);
            setAnswers(completionStateRef.current.submittedAnswers || {});
        }

        fetchQuestions();
    }, [taskId, isPreview, previewQuestions, completedContentIds]);

    // Load saved answeers from backend
    useEffect(() => {
        const loadSavedAnswers = async () => {
        if (!taskId || isPreview) return;
        
        try {
            console.log("Loading saved answers for Q&A form:", taskId);
            const response = await QuizApiUtils.getSavedQuizAnswers(taskId);
            
            if (response && response.answers) {
            console.log("Retrieved saved answers:", response.answers);
            
            // For Q&A form, answers are simple strings per question
            setAnswers(response.answers);
            setQuizCompleted(true);
            
            // Update ref for persistence
            completionStateRef.current = {
                isCompleted: true,
                submittedAnswers: {...response.answers}
            };
            }
        } catch (error) {
            console.error("Error loading saved Q&A form answers:", error);
        }
        };
        
        // Only load if not already completed via local storage
        if (!completionStateRef.current.isCompleted) {
        loadSavedAnswers();
        }
    }, [taskId, isPreview]);
    

    const fetchQuestions = async () => {
        setIsLoading(true);
        try {
            // Preview mode handling
            if (isPreview && previewQuestions) {
                console.log("Using preview questions in QuestionAndAnswerForm:", previewQuestions);
                
                const normalizedQuestions = previewQuestions.map(q => ({
                id: q.id,
                text: q.text || q.question_text || "",
                order: q.order || 0
                }));
                
                setQuestions(normalizedQuestions);
                initializeAnswers(normalizedQuestions);
                setIsLoading(false);
                return;
            }

            // Regular fetching
            const fetchedQuestions = await QuizApiUtils.getQuestions(taskId);
            if (fetchedQuestions && fetchedQuestions.length > 0) {
                setQuestions(fetchedQuestions);
                initializeAnswers(fetchedQuestions);
            } else {
                setError("No questions available.");
            }
        } catch (err) {
            setError("Failed to load questions: " + err.message);
        }
        setIsLoading(false);
    };

    // const initializeAnswers = (questions) => {
    //     const initialAnswers = questions.reduce((acc, question) => {
    //         acc[question.id] = ''; // Initialize each answer as empty
    //         return acc;
    //     }, {});
    //     setAnswers(initialAnswers);
    //     setQuizCompleted(false); // Reset quiz completion status
    // };
    const initializeAnswers = (questions) => {
        // Only initialize if we don't have saved answers
        if (!completionStateRef.current.isCompleted) {
            const initialAnswers = questions.reduce((acc, question) => {
                acc[question.id] = ''; // Initialize each answer as empty
                return acc;
            }, {});
            setAnswers(initialAnswers);
        }
    };

    React.useEffect(() => {
        // Add method to the component instance
        const componentInstance = {
            getQuestions: () => questions,
            setQuestions: (newQuestions) => {
                console.log("Setting questions in QuestionAndAnswerForm:", newQuestions);
                
                // Normalize the questions
                const normalizedQuestions = newQuestions.map(q => ({
                    id: q.id,
                    text: q.text || q.question_text || "",
                    order: q.order || 0
                }));
                
                setQuestions(normalizedQuestions);
                
                // Reinitialize answers
                const initialAnswers = {};
                normalizedQuestions.forEach(q => {
                    initialAnswers[q.id] = '';
                });
                setAnswers(initialAnswers);
            }
        };

        // Assign to the function's static method
        QuestionAndAnswerForm.componentInstance = componentInstance;

        // Cleanup
        return () => {
            delete QuestionAndAnswerForm.componentInstance;
        };
    }, [questions]);

    const handleAnswerChange = (questionId, value) => {
        setAnswers(prev => ({
            ...prev,
            [questionId]: value
        }));

        if (validationErrors[questionId]) {
            const updatedErrors = { ...validationErrors };
            delete updatedErrors[questionId];
            setValidationErrors(updatedErrors);
        }
    };

    const validateQuiz = () => {
        const errors = {};
        let hasErrors = false;
        
        // Check each answer
        questions.forEach(question => {
            const answer = answers[question.id];
            if (!answer || answer.trim() === '') {
                errors[question.id] = 'This question requires an answer.';
                hasErrors = true;
            }
        });
        
        setValidationErrors(errors);
        setAttemptedSubmit(true);
        
        return !hasErrors;
    };

    
    const handleSubmit = (event) => {
        if (event) event.preventDefault();

        if (validateQuiz()) {
            // Move to review mode first
            setShowReview(true);
        } else {
            // Show validation errors
            setAttemptedSubmit(true);
        }
    };
    const handleFinalSubmit = (event) => {
        event.preventDefault();

        // Preview mode handling
        if (isPreview) {
            if (onComplete) {
            onComplete({ preview: true });
            }
            return;
        }
        
        // const hasEmptyAnswers = Object.values(answers).some(answer => answer === '');
        // if (hasEmptyAnswers) {
        //     alert('Please answer all questions before submitting.');
        //     return;
        // }
        if (validateQuiz()) {
            setQuizCompleted(true); // Set completion FIRST
            
            // Update the ref with the LATEST answers
            completionStateRef.current = {
                isCompleted: true,
                submittedAnswers: {...answers} // make sure this is a new object
            };

            // Save state to localStorage
            try {
                localStorage.setItem(`qa-quiz-state-${taskId}`, JSON.stringify({
                    submittedAnswers: answers,
                    isCompleted: true
                }));
            } catch (e) {
                console.error("Failed to save quiz state", e);
            }
            
            if (onComplete) {
                onComplete(answers);
            }
        }
    };

    const handleRestart = () => {
        //initializeAnswers(questions); 
        // Reset answers and quiz state
        const resetAnswers = {};
        questions.forEach(q => {
            resetAnswers[q.id] = '';
        });
        
        setAnswers(resetAnswers);
        setQuizCompleted(false);
        setShowReview(false);
        setValidationErrors({});
        setAttemptedSubmit(false);
        
        // Update ref state
        completionStateRef.current = {
            isCompleted: false,
            submittedAnswers: completionStateRef.current.submittedAnswers
        };

    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div className="quiz-error">Error: {error}</div>;
    }

    if (quizCompleted) {
        return (
            <div className="qa-completed-container">
                <h2 className="qa-completed-header">Quiz completed successfully!</h2>
                <h3 className="qa-completed-subheader">Your Answers</h3>

                <div className="qa-completed-answers">
                    {questions.map(question => (
                        <div key={question.id} className="qa-completed-answer-item">
                            <div className="qa-completed-question">{question.text}</div>
                            <div className="qa-completed-answer">{answers[question.id] || (
                                completionStateRef.current.submittedAnswers && 
                                completionStateRef.current.submittedAnswers[question.id]) || 
                                "ANSWER NOT AVAILABLE"}
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="qa-buttons-container">
                    <button onClick={handleRestart} className="qa-button secondary">
                        Restart Quiz
                    </button>
                </div>
            </div>
        );
    }

    // Review mode
    if (showReview) {
        return (
            <div className="qa-review-container">
                <div className="qa-review-header">
                    <h2>Review Your Answers</h2>
                    <p>Please review your answers before submitting:</p>
                </div>
                
                <div className="qa-review-items">
                    {questions.map(question => (
                        <div key={question.id} className="qa-review-item">
                            <div className="qa-review-question">{question.text}</div>
                            <div className="qa-review-answer">{answers[question.id]}</div>
                        </div>
                    ))}
                </div>
                
                <div className="qa-buttons-container">
                    <button 
                        onClick={() => setShowReview(false)} 
                        className="qa-button secondary"
                    >
                        Back to Quiz
                    </button>
                    <button 
                        onClick={handleFinalSubmit} 
                        className="qa-button"
                    >
                        Submit Answers
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form className="question-answer-form" onSubmit={handleSubmit}>
            {questions.map((question) => (
                <div key={question.id} className={`input-group ${validationErrors[question.id] && attemptedSubmit ? 'error' : ''}`}>
                    <label htmlFor={`question-${question.id}`}>Question:</label>
                    <input
                        id={`question-${question.id}`}
                        type="text"
                        value={question.text}
                        readOnly
                        required
                    />
                    <input
                        id={`answer-${question.id}`}
                        type="text"
                        value={answers[question.id] || ''}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        placeholder="Write your answer here..."
                        className={validationErrors[question.id] && attemptedSubmit ? 'error' : ''}
                        required
                    />
                    {validationErrors[question.id] && attemptedSubmit && (
                        <div className="validation-error">{validationErrors[question.id]}</div>
                    )}
                </div>
            ))}
            
            {attemptedSubmit && Object.keys(validationErrors).length > 0 && (
                <div className="validation-error-summary">
                    <p>Please answer all questions before continuing.</p>
                </div>
            )}
            
            <button type="submit" className="continue-button">
                Continue
            </button>
        </form>
    );
};

export default QuestionAndAnswerForm;