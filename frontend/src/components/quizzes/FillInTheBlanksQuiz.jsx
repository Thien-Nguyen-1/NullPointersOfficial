import React, { useState, useEffect } from "react";
import { QuizApiUtils } from "../../services/QuizApiUtils";
import "../../styles/Quizzes.css";

const FillInTheBlanksQuiz = ({ taskId, onComplete, isPreview = false, previewQuestions = null }) => {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [validationAttempted, setValidationAttempted] = useState(false);

  // Fetch questions when component mounts
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);

        // If in preview mode and preview questions are provided, use them
        if (isPreview && previewQuestions) {
          console.log("Using preview questions in FillInTheBlanksQuiz:", previewQuestions);
          
          // Normalize question data
          const normalizedQuestions = previewQuestions.map(q => ({
            id: q.id,
            // Handle both data structures (text or question_text)
            question_text: q.question_text || q.text || "",
            hint_text: q.hint_text || q.hint || "",
            order: q.order || 0
          }));
          
          setQuestions(normalizedQuestions);
          
          // Initialize userAnswers for each blank in each question
          const initialAnswers = {};
          normalizedQuestions.forEach(question => {
            const questionText = question.question_text || '';
            // Make sure we only match exact '____' patterns
            const blankMatches = questionText.match(/\b____\b/g);
            const blankCount = blankMatches ? blankMatches.length : 0;
            
            initialAnswers[question.id] = Array(blankCount).fill('');
          });
          
          setUserAnswers(initialAnswers);
          setIsLoading(false);
          return;
        }

        // Regular API when in not preview mode
        console.log("Fetching questions for taskId:", taskId);
        const fetchedQuestions = await QuizApiUtils.getQuestions(taskId);
        console.log("Fetched questions:", fetchedQuestions);
        
        if (fetchedQuestions && fetchedQuestions.length > 0) {
          // Normalize question data to handle both API data structures
          const normalizedQuestions = fetchedQuestions.map(q => ({
            id: q.id,
            // Handle both data structures (text or question_text)
            question_text: q.question_text || q.text || "",
            hint_text: q.hint_text || q.hint || "",
            order: q.order || 0
          }));
          
          setQuestions(normalizedQuestions);
          
          // Initialize userAnswers for each blank in each question
          const initialAnswers = {};
          normalizedQuestions.forEach(question => {
            const questionText = question.question_text || '';
            // Make sure we only match exact '____' patterns
            const blankMatches = questionText.match(/\b____\b/g);
            const blankCount = blankMatches ? blankMatches.length : 0;
            
            initialAnswers[question.id] = Array(blankCount).fill('');
          });
          
          setUserAnswers(initialAnswers);
        } else {
          console.warn("No questions returned from API for fill-in-the-blanks");
          setError("No questions available for this quiz.");
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching fill-in-the-blanks questions:", err);
        setError("Failed to load questions. Please try again later.");
        setIsLoading(false);
      }
    };
    
    if (isPreview && previewQuestions) {
      fetchQuestions();
    } else if (taskId) {
      fetchQuestions();
    } else {
      console.error("No taskId provided to FillInTheBlanksQuiz component");
      setError("Quiz configuration error. Please contact support.");
      setIsLoading(false);
    }
  }, [taskId, isPreview, previewQuestions]);

  // Load saved answers from backend
  useEffect(() => {
    const loadSavedAnswers = async () => {
      if (!taskId || isPreview) return;
      
      try {
        console.log("Loading saved answers for fill-in-the-blanks quiz:", taskId);
        const response = await QuizApiUtils.getSavedQuizAnswers(taskId);
        
        if (response && response.answers && Object.keys(response.answers).length > 0) {
          console.log("Retrieved saved answers:", response.answers);
          
          // Process answers for fill-in-the-blanks quiz
          const processedAnswers = {};
          
          for (const [questionId, answerText] of Object.entries(response.answers)) {
            try {
              // Try to parse as JSON first (for array answers)
              const parsed = JSON.parse(answerText);
              processedAnswers[questionId] = Array.isArray(parsed) ? parsed : [answerText];
            } catch (e) {
              // If it's a simple string with delimiter
              if (typeof answerText === 'string' && answerText.includes(' | ')) {
                processedAnswers[questionId] = answerText.split(' | ');
              } else {
                // Fallback - create array with single value
                processedAnswers[questionId] = [answerText];
              }
            }
          }
          
          console.log("Processed fill-in-the-blanks answers:", processedAnswers);
          setUserAnswers(processedAnswers);
          setQuizSubmitted(true);
          setShowReview(true);
        }
      } catch (error) {
        console.error("Error loading saved fill-in-the-blanks answers:", error);
      }
    };
    
    loadSavedAnswers();
  }, [taskId, isPreview, questions]);

  // Handle user input for a specific blank in a question
  const handleBlankChange = (questionId, blankIndex, value) => {
    setUserAnswers(prevAnswers => ({
      ...prevAnswers,
      [questionId]: [
        ...(prevAnswers[questionId] || []).slice(0, blankIndex),
        value,
        ...(prevAnswers[questionId] || []).slice(blankIndex + 1)
      ]
    }));
    
    // Clear validation error when user types in previously empty blank
    if (value.trim() !== '' && validationErrors[questionId]?.[blankIndex]) {
      const updatedErrors = { ...validationErrors };
      if (updatedErrors[questionId]) {
        const questionErrors = [...updatedErrors[questionId]];
        questionErrors[blankIndex] = null;
        // If all blanks for this question are now valid, remove the question entry
        if (questionErrors.every(error => !error)) {
          delete updatedErrors[questionId];
        } else {
          updatedErrors[questionId] = questionErrors;
        }
        setValidationErrors(updatedErrors);
      }
    }
  };

  // Validate all answers before submitting
  const validateQuiz = () => {
    const errors = {};
    let hasErrors = false;
    
    questions.forEach(question => {
      const questionText = question.question_text || '';
      const blankMatches = questionText.match(/\b____\b/g);
      const blankCount = blankMatches ? blankMatches.length : 0;
      const answers = userAnswers[question.id] || [];
      
      const questionErrors = [];
      let questionHasError = false;
      
      for (let i = 0; i < blankCount; i++) {
        const answer = answers[i] || '';
        if (!answer.trim()) {
          questionErrors[i] = 'This blank must be filled.';
          questionHasError = true;
          hasErrors = true;
        } else {
          questionErrors[i] = null;
        }
      }
      
      if (questionHasError) {
        errors[question.id] = questionErrors;
      }
    });
    
    setValidationErrors(errors);
    setValidationAttempted(true);
    
    return !hasErrors;
  };

  // Submit the quiz and show review
  const submitQuiz = () => {
    // Skip validation in preview mode
    if (isPreview) {
      setQuizSubmitted(true);
      setShowReview(true);
      return;
    }
    
    if (validateQuiz()) {
      setQuizSubmitted(true);
      setShowReview(true);
    } else {
      // Scroll to the first error
      const firstErrorQuestion = Object.keys(validationErrors)[0];
      if (firstErrorQuestion) {
        const element = document.getElementById(`question-${firstErrorQuestion}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }
  };

  // Continue after review - final validation before completing
  const handleContinue = () => {
    // Skip validation in preview mode
    if (isPreview) {
      if (onComplete) {
        onComplete({ preview: true });
      }
      return;
    }

    // Double-check validation before sending to parent component
    if (validateQuiz()) {
      if (onComplete) {
        onComplete(userAnswers); // Answers are passed to handleContentComplete
        //setShowReview(true);
      }
    } else {
      // Return to quiz mode to complete missing answers
      setShowReview(false);
      setQuizSubmitted(false);
    }
  };

  

  // Reset the quiz
  const resetQuiz = () => {
    // Reset all answers to empty strings
    const resetAnswers = {};
    questions.forEach(question => {
      const questionText = question.question_text || '';
      const blankMatches = questionText.match(/\b____\b/g);
      const blankCount = blankMatches ? blankMatches.length : 0;
      
      resetAnswers[question.id] = Array(blankCount).fill('');
    });
    
    setUserAnswers(resetAnswers);
    setQuizSubmitted(false);
    setShowReview(false);
    setValidationErrors({});
    setValidationAttempted(false);
  };

  // Render a question with interactive blanks
  const renderQuestion = (question, index) => {
    if (!question || !question.question_text) {
      return (
        <div key={`error-${index}`} className="fill-blanks-question error">
          <h3>Question {index + 1}</h3>
          <p>Error: Invalid question format</p>
        </div>
      );
    }
    
    const questionText = question.question_text;
    // Check if the question has the required blanks
    const blankMatches = questionText.match(/\b____\b/g);
    if (!blankMatches || blankMatches.length === 0) {
      return (
        <div key={`error-${index}`} className="fill-blanks-question error">
          <h3>Question {index + 1}</h3>
          <p>Error: Invalid question format - no blanks (____) found</p>
          <p className="error-detail">{questionText}</p>
        </div>
      );
    }
    
    const parts = questionText.split(/\b____\b/);
    const answers = userAnswers[question.id] || [];
    const questionErrors = validationErrors[question.id] || [];
    
    return (
      <div 
        id={`question-${question.id}`} 
        key={question.id} 
        className={`fill-blanks-question ${questionErrors.length > 0 ? 'has-errors' : ''}`}
      >
        <h3>Question {index + 1}</h3>
        <div className="question-text">
          {parts.map((part, i) => (
            <React.Fragment key={i}>
              {part}
              {i < parts.length - 1 && (
                <div className="blank-input-container">
                  <input 
                    type="text"
                    className={`blank-input ${questionErrors[i] && validationAttempted ? 'error' : ''}`}
                    value={answers[i] || ''}
                    onChange={(e) => handleBlankChange(question.id, i, e.target.value)}
                    disabled={quizSubmitted}
                    placeholder="fill in"
                  />
                  {questionErrors[i] && validationAttempted && (
                    <div className="validation-error">{questionErrors[i]}</div>
                  )}
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
        {question.hint_text && (
          <div className="hint-text">
            <strong>Hint:</strong> {question.hint_text}
          </div>
        )}
      </div>
    );
  };

  // Render the review screen
  const renderReview = () => {
    return (
      <div className="quiz-review">
        <h3>Fill in the Blanks - Review</h3>
        
        <div className="review-summary">
          <p>You've completed all {questions.length} questions in this exercise.</p>
        </div>
        
        {Object.keys(validationErrors).length > 0 && (
          <div className="validation-error-summary">
            <p className="error-message">There are still blanks that need to be filled. Please go back and complete all answers.</p>
          </div>
        )}
        
        <div className="review-questions">
          {questions.map((question, index) => {
            const parts = question.question_text.split(/\b____\b/);
            const answers = userAnswers[question.id] || [];
            
            return (
              <div key={question.id} className="review-question-item">
                <div className="review-question-number">{index + 1}</div>
                <div className="review-question-content">
                  <p className="review-question-text">
                    {parts.map((part, i) => (
                      <React.Fragment key={i}>
                        {part}
                        {i < parts.length - 1 && (
                          <span className={`review-answer-highlight ${!answers[i] ? 'error' : ''}`}>
                            {answers[i] || "(no answer)"}
                          </span>
                        )}
                      </React.Fragment>
                    ))}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        
        <div className="quiz-actions">
          <button 
            className="restart-button"
            onClick={resetQuiz}
          >
            Try Again
          </button>
          <button 
            className="continue-button"
            onClick={handleContinue}
          >
            Done
          </button>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="quiz-loading">Loading questions...</div>;
  }

  if (error) {
    return <div className="quiz-error">{error}</div>;
  }

  if (!questions || questions.length === 0) {
    return <div className="quiz-empty">No questions available for this quiz.</div>;
  }

  // Show review screen if quiz is submitted
  if (showReview) {
    return renderReview();
  }

  // Calculate if there are any validation errors
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return (
    <div className="fill-blanks-quiz-container">
      <div className="quiz-instructions">
        <h3>Fill in the Blanks / Title</h3>
        <p>Read each sentence and fill in the missing words in the blanks.</p>
      </div>
      
      {validationAttempted && hasValidationErrors && (
        <div className="validation-summary">
          <p>Please fill in all blanks before submitting.</p>
        </div>
      )}
      
      <div className="questions-container">
        {questions.map((question, index) => renderQuestion(question, index))}
      </div>
      
      <div className="quiz-actions">
        {quizSubmitted ? (
          <button 
            className="retry-button"
            onClick={resetQuiz}
          >
            Try Again
          </button>
        ) : (
          <button 
            className="submit-button"
            onClick={submitQuiz}
          >
            Submit Answers
          </button>
        )}
      </div>
    </div>
  );
};

export default FillInTheBlanksQuiz;