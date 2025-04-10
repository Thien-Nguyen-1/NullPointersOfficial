import React, { useState, useEffect, useRef } from 'react';
import { useDrag, useDrop } from 'react-dnd';
import { QuizApiUtils } from "../../services/QuizApiUtils";
import '../../styles/MatchingQuestionsUserDisplay.css';

const MatchingQuestionsQuiz = ({ taskId, onComplete, isPreview = false, previewQuestions = null, completedContentIds = new Set() }) => {
    const [pairs, setPairs] = useState([]);
    const [userAnswers, setUserAnswers] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [quizCompleted, setQuizCompleted] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [validationAttempted, setValidationAttempted] = useState(false);
    const [reviewMode, setReviewMode] = useState(false);

    // use ref to maintaint state across re-renders
    const completionStateRef = useRef({
        isCompleted: false,
        submittedAnswers: null
    });

    useEffect(() => {
        // check if this quiz is already marked as completed in parent component
        if (completedContentIds && completedContentIds.has(taskId)) {
            console.log("Quiz already marked as completed in parent");
            setQuizCompleted(true);
            completionStateRef.current.isCompleted = true;
            fetchPairs();
            // Try to load saved answers from localStorage if available
            try {
                const savedState = localStorage.getItem(`matching-quiz-state-${taskId}`);
                if (savedState) {
                    const parsed = JSON.parse(savedState);
                    setUserAnswers(parsed.submittedAnswers || {});
                    //completionStateRef.current.submittedAnswers = parsed.submittedAnswers || {};
                }
            } catch (e) {
                console.error("Failed to load saved quiz state", e);
            }
            return;
        } else if (completionStateRef.current.isCompleted) {
            setQuizCompleted(true);
            setUserAnswers(completionStateRef.current.submittedAnswers || {});
            fetchPairs();
        } else {
            fetchPairs();
        }

        async function fetchPairs() {
            setIsLoading(true);
            try {
                // Preview mode handling
                if (isPreview && previewQuestions) {
                console.log("Using preview questions in MatchingQuestionsQuiz:", previewQuestions);
                
                const pairsWithDefaultAnswers = previewQuestions.map(pair => ({
                    id: pair.id,
                    text: pair.text || pair.question_text || "",
                    answers: Array.isArray(pair.answers) ? pair.answers : (pair.possible_answers || []),
                    order: pair.order || 0
                }));
                
                setPairs(pairsWithDefaultAnswers.sort((a, b) => a.order - b.order));
                setIsLoading(false);
                return;
                }

                // Regular fetching
                const fetchedPairs = await QuizApiUtils.getQuestions(taskId);
                if (fetchedPairs && fetchedPairs.length > 0) {
                    const pairsWithDefaultAnswers = fetchedPairs.map(pair => ({
                        ...pair,
                        answers: Array.isArray(pair.answers) ? pair.answers : []
                    }));
                    setPairs(pairsWithDefaultAnswers.sort((a, b) => a.order - b.order));
                } else {
                    setError("No data available.");
                }

                setIsLoading(false);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError("Failed to load data.");
            }
            setIsLoading(false);
        };

        fetchPairs();
    }, [taskId, isPreview, previewQuestions, completedContentIds]);

    // Load saved answers from abckend
    useEffect(() => {
        const loadSavedAnswers = async () => {
        if (!taskId || isPreview) return;
        
        try {
            console.log("Loading saved answers for matching quiz:", taskId);
            const response = await QuizApiUtils.getSavedQuizAnswers(taskId);
            
            if (response && response.answers && Object.keys(response.answers).length > 0) {
            console.log("Retrieved saved answers:", response.answers);
            
            // For matching quiz, answers are direct mappings
            setUserAnswers(response.answers);
            setQuizCompleted(true);
            
            // Update ref for persistence
            completionStateRef.current = {
                isCompleted: true,
                submittedAnswers: {...response.answers}
            };
            }
        } catch (error) {
            console.error("Error loading saved matching quiz answers:", error);
        }
        };
        
        // Only load if not already completed via local storage
        if (!completionStateRef.current.isCompleted) {
        loadSavedAnswers();
        }
    }, [taskId, isPreview]);
    
    const handleDrop = (questionId, answer) => {
        setUserAnswers(prev => ({
            ...prev,
            [questionId]: answer
        }));

        // clear validation error when user provides an answer
        if (validationErrors[questionId]) {
            setValidationErrors(prev => {
                const updated = {...prev};
                delete updated[questionId];
                return updated;
            });
        }
    };

    const validateQuiz = () => {
        const errors = {};
        let hasErrors = false;

        console.log("Pairs to validate:", pairs);
        console.log("Current user answers:", userAnswers);

        pairs.forEach(pair => {
            const answer = userAnswers[pair.id];
            console.log(`Checking pair ${pair.id}:`, {
                pair,
                answer,
                hasAnswer: !!answer
            });

            if (!answer) {
                errors[pair.id] = 'Answer required';
                hasErrors = true;
            }
        });

        setValidationErrors(errors);
        setValidationAttempted(true);

        console.log("Validation result:", {
            hasErrors,
            errors
        });
        return !hasErrors;
    };

    // FIRST STEP: Make sure to validate (when users have answer all questions) and move to review mode
    const handleValidateAnswers = () => {
        console.log("MATCHING QUIZ: Validate Answers Called");
        console.log("MATCHING QUIZ: User Answers:", userAnswers);
        
        if (validateQuiz()) {
            // Move to review mode when validation succeeds
            setReviewMode(true);
        }
    };

    
    const handleSubmitAnswers = () => {
        console.log("MATCHING QUIZ: Submit Answers Called");
        console.log("MATCHING QUIZ: User Answers:", userAnswers);

        // Preview mode handling
        if (isPreview) {
            if (onComplete) {
            onComplete({ preview: true });
            }
            return;
        }

        if (validateQuiz()) {
            setQuizCompleted(true); // Set completion FIRST

            // update the ref with the LATEST answers
            completionStateRef.current = {
                isCompleted: true,
                submittedAnswers: {...userAnswers} // make sure this is a new object
            };

            try {
                localStorage.setItem(`matching-quiz-state-${taskId}`, JSON.stringify({
                    submittedAnswers: userAnswers,
                    isCompleted: true
                }));
            } catch (e) {
                console.error("Failed to save quiz state", e);
            }

            if (onComplete) {
                onComplete(userAnswers);
            }
        } else {
            console.error("Validation failed, not all questions answered.");
        }
    };

    const resetQuiz = () => {
        setUserAnswers({});
        setValidationErrors({});
        setValidationAttempted(false);
        setQuizCompleted(false);
        setReviewMode(false);
        completionStateRef.current = {
            isCompleted: false,
            submittedAnswers: completionStateRef.current.submittedAnswers || {}
        };
    };

    if (isLoading) {
        return <div>Loading...</div>;
    }
    if (error) {
        return <div className="matching-quiz-error">Error: {error}</div>;
    }

    if (quizCompleted) {
        console.log("MATCHING QUIZ: Rendering Completed State");
          // Show loading while we don't have pairs data yet
        if (pairs.length === 0) {
            return <div>Loading completed quiz data...</div>;
        }
        return (
            <div className="container">
                <h2>Quiz completed successfully!</h2>
                <h3>Your chosen pair below</h3>

                <ul>
                    {pairs.map(pair => (
                        <li key={pair.id} className='question-answer-pair'>
                           <div  className='question'>{pair.text}</div>
                            <br />
                            <div  className='answer'>{userAnswers[pair.id] || (completionStateRef.current.submittedAnswers && 
                                completionStateRef.current.submittedAnswers[pair.id]) || "ANSWER NOT AVAILABLE"}</div>
                        </li>
                    ))}
                </ul>
                
                <button onClick={resetQuiz} className="restart-button">Restart Quiz</button>
            </div>
        );
    }

        // Review mode display
        if (reviewMode) {
            return (
                <div className="matching-quiz-review">
                    <h2>Review Your Answers</h2>
                    <p>Please review your matches before submitting:</p>
                    
                    <div className="matching-quiz-review-pairs">
                        {pairs.map(pair => (
                            <div key={pair.id} className="review-pair">
                                <div className="review-question">{pair.text}</div>
                                <div className="review-arrow">→</div>
                                <div className="review-answer">{userAnswers[pair.id]}</div>
                            </div>
                        ))}
                    </div>
                    
                    <div className="matching-quiz-actions">
                        <button 
                            onClick={() => setReviewMode(false)} 
                            className="back-button"
                        >
                            Back to Quiz
                        </button>
                        <button 
                            onClick={handleSubmitAnswers} 
                            className="submit-button"
                        >
                            Submit Answers
                        </button>
                    </div>
                </div>
            );
        }

    return (
        <div className="container">
            <h1>Drag and Drop Question to Answer</h1>

            {validationAttempted && Object.keys(validationErrors).length > 0 && (
                <div className="validation-error-summary">
                    <p>Please match all questions with answers before continuing.</p>
                </div>
            )}
            
            <ul>
                {pairs.map(pair => (
                    <li key={pair.id} className={`question-answer-pair ${validationErrors[pair.id] ? 'error' : ''}`}>
                        <Question text={pair.text} id={pair.id} />
                        <div className="answers">
                            {pair.answers.map((answer, idx) => (
                                    <Answer 
                                        key={idx} 
                                        answer={answer} 
                                        onDrop={handleDrop} 
                                        questionId={pair.id} 
                                        isSelected={userAnswers[pair.id] === answer}
                                    />
                            ))}
                        </div>
                        {validationErrors[pair.id] && (
                                <div className="validation-error">{validationErrors[pair.id]}</div>
                        )}
                    </li>
                ))}
            </ul>
            <button onClick={handleValidateAnswers}>Continue</button>
        </div>
    );
};

const Question = ({ text, id }) => {
    const [{ isDragging }, drag] = useDrag(() => ({
        type: 'question',
        item: { id },
        collect: monitor => ({
            isDragging: !!monitor.isDragging(),
        }),
    }));

    return (
        <div ref={drag} style={{ opacity: isDragging ? 0.5 : 1 }} className={`question ${isDragging ? 'dragging' : ''}`}>
            {text}
        </div>
    );
};

const Answer = ({ answer, onDrop, questionId, isSelected }) => {
    const [{ isOver }, drop] = useDrop({
        accept: 'question',
        drop: (item) => onDrop(questionId, answer),
        collect: monitor => ({
            isOver: !!monitor.isOver(),
        }),
    });

    return (
        <div ref={drop} className={`answer ${isOver ? 'hover' : ''} ${isSelected ? 'selected' : ''}`}>
            {answer}
        </div>
    );
};

export default MatchingQuestionsQuiz;


