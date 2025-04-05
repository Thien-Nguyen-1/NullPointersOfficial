import React, { useState, useEffect } from 'react';
import { QuizApiUtils } from "../../services/QuizApiUtils";

const QuestionAndAnswerForm = ({ taskId, onComplete,isPreview = false, previewQuestions = null  }) => {
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [quizCompleted, setQuizCompleted] = useState(false); // New state for tracking quiz completion

    const [validationErrors, setValidationErrors] = useState({});
    const [attemptedSubmit, setAttemptedSubmit] = useState(false);
    
    useEffect(() => {
        fetchQuestions();
    }, [taskId, isPreview, previewQuestions]);

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

    const initializeAnswers = (questions) => {
        const initialAnswers = questions.reduce((acc, question) => {
            acc[question.id] = ''; // Initialize each answer as empty
            return acc;
        }, {});
        setAnswers(initialAnswers);
        setQuizCompleted(false); // Reset quiz completion status
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
        event.preventDefault();

        // Preview mode handling
        if (isPreview) {
            if (onComplete) {
            onComplete({ preview: true });
            }
            return;
        }
        
        const hasEmptyAnswers = Object.values(answers).some(answer => answer === '');
        if (hasEmptyAnswers) {
            alert('Please answer all questions before submitting.');
            return;
        }
        onComplete(answers);
        setQuizCompleted(true); // Set the quiz as completed
    };

    const handleRestart = () => {
        initializeAnswers(questions); // Reset answers and quiz state
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error}</div>;
    }

    return (
        <form className="question-answer-form" onSubmit={handleSubmit}>
            {questions.map((question) => (
                <div key={question.id} className="input-group">
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
                        value={answers[question.id]}
                        onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                        required
                    />
                </div>
            ))}
            {quizCompleted ? (
                <button type="button" className="restart-button" onClick={handleRestart}>Restart Quiz</button>
            ) : (
                <button type="submit" className="save-button">Submit All Answers</button>
            )}
        </form>
    );
};

export default QuestionAndAnswerForm;


