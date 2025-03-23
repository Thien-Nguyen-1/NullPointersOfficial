import React, { useState, useEffect } from "react";
import { QuizApiUtils } from "../../services/QuizApiUtils";
import "../../styles/Quizzes.css";

const FlowchartQuiz = ({ taskId, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [currentStep, setCurrentStep] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [validationAttempted, setValidationAttempted] = useState(false);

  // Fetch questions when component mounts
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching questions for taskId:", taskId);
        const fetchedQuestions = await QuizApiUtils.getQuestions(taskId);
        console.log("Fetched questions for flowchart:", fetchedQuestions);
        
        if (fetchedQuestions && fetchedQuestions.length > 0) {
          // Normalize question data to handle API inconsistencies
          const normalizedQuestions = fetchedQuestions.map(q => ({
            id: q.id,
            // Handle both data structures (text or question_text)
            question_text: q.question_text || q.text || "",
            hint_text: q.hint_text || q.hint || "",
            order: q.order || 0
          }));
          
          // Sort questions by order to ensure proper sequence
          const sortedQuestions = normalizedQuestions.sort((a, b) => a.order - b.order);
          setQuestions(sortedQuestions);
          
          // Initialize userAnswers
          const initialAnswers = {};
          sortedQuestions.forEach(q => {
            initialAnswers[q.id] = '';
          });
          setUserAnswers(initialAnswers);
        } else {
          console.warn("No questions returned from API for flowchart");
          setError("No statements available for this flowchart.");
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching flowchart questions:", err);
        setError("Failed to load questions. Please try again later.");
        setIsLoading(false);
      }
    };
    
    if (taskId) {
      fetchQuestions();
    } else {
      console.error("No taskId provided to FlowchartQuiz component");
      setError("Quiz configuration error. Please contact support.");
      setIsLoading(false);
    }
  }, [taskId]);

  // Handle answer for current statement
  const handleAnswerChange = (e) => {
    if (currentStep < questions.length) {
      const currentQuestion = questions[currentStep];
      const newValue = e.target.value;
      
      setUserAnswers({
        ...userAnswers,
        [currentQuestion.id]: newValue
      });
      
      // Clear validation error when user types
      if (newValue.trim() !== '' && validationErrors[currentQuestion.id]) {
        const updatedErrors = { ...validationErrors };
        delete updatedErrors[currentQuestion.id];
        setValidationErrors(updatedErrors);
      }
    }
  };

  // Validate the current step before proceeding
  const validateCurrentStep = () => {
    const currentQuestion = questions[currentStep];
    const answer = userAnswers[currentQuestion.id];
    
    if (!answer || answer.trim() === '') {
      setValidationErrors({
        ...validationErrors,
        [currentQuestion.id]: 'Please provide a response before continuing.'
      });
      setValidationAttempted(true);
      return false;
    }
    
    return true;
  };

  // Validate all answers before completing
  const validateAllAnswers = () => {
    const errors = {};
    let hasErrors = false;
    
    questions.forEach(question => {
      const answer = userAnswers[question.id];
      if (!answer || answer.trim() === '') {
        errors[question.id] = 'This statement requires a response.';
        hasErrors = true;
      }
    });
    
    setValidationErrors(errors);
    setValidationAttempted(true);
    
    return !hasErrors;
  };

  // Move to the next statement
  const nextStep = () => {
    // If at the last step, validate everything before completing
    if (currentStep === questions.length - 1) {
      if (validateAllAnswers()) {
        setQuizCompleted(true);
      }
    } else {
      // If not the last step, just validate the current step
      if (validateCurrentStep()) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // Move to the previous statement
  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Restart the quiz
  const restartQuiz = () => {
    setCurrentStep(0);
    setQuizCompleted(false);
    setValidationAttempted(false);
    setValidationErrors({});
    
    // Reset answers
    const resetAnswers = {};
    questions.forEach(q => {
      resetAnswers[q.id] = '';
    });
    setUserAnswers(resetAnswers);
  };

  // Handle final submission - validate one more time
  const handleFinalSubmit = () => {
    if (validateAllAnswers()) {
      if (onComplete) {
        onComplete(userAnswers);// Answers are passed to the ModuleView
      }
    } else {
      // Find the first unanswered question
      const firstEmptyQuestionId = Object.keys(validationErrors)[0];
      const questionIndex = questions.findIndex(q => q.id === parseInt(firstEmptyQuestionId));
      
      if (questionIndex !== -1) {
        // Go back to editing mode and jump to the first empty question
        setQuizCompleted(false);
        setCurrentStep(questionIndex);
      }
    }
  };

  if (isLoading) {
    return <div className="quiz-loading">Loading flowchart quiz...</div>;
  }

  if (error) {
    return <div className="quiz-error">{error}</div>;
  }

  if (!questions || questions.length === 0) {
    return <div className="quiz-empty">No statements available for this flowchart.</div>;
  }

  // Handle completed quiz display
  if (quizCompleted) {
    return (
      <div className="flowchart-completed">
        <h3>Flowchart Exercise Complete!</h3>
        
        {Object.keys(validationErrors).length > 0 && (
          <div className="validation-error-summary">
            <p>Some steps are missing responses. Please go back and complete all steps.</p>
          </div>
        )}
        
        <div className="flowchart-summary">
          <h4>Your Flowchart Responses:</h4>
          
          <div className="flowchart-visual-container">
            {questions.map((question, index) => (
              <div key={question.id} className="flowchart-visual">
                <div className={`flowchart-box ${validationErrors[question.id] ? 'error' : ''}`}>
                  <div className="flowchart-box-number">{index + 1}</div>
                  <div className="flowchart-box-content">
                    <p>{question.question_text}</p>
                  </div>
                </div>
                
                {index < questions.length - 1 && (
                  <div className="flowchart-connector">
                    <div className="flowchart-arrow"></div>
                  </div>
                )}
                
                <div className={`flowchart-response-box ${validationErrors[question.id] ? 'error' : ''}`}>
                  <div className="flowchart-response-header">Your Answer:</div>
                  <div className="flowchart-response-content">
                    {userAnswers[question.id] || (
                      <span className="empty-response">No answer provided</span>
                    )}
                  </div>
                  {validationErrors[question.id] && (
                    <div className="validation-error">{validationErrors[question.id]}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="quiz-actions">
          <button className="restart-button" onClick={restartQuiz}>
            Try Again
          </button>
          <button
            className="continue-button"
            onClick={handleFinalSubmit}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  const currentError = validationErrors[currentQuestion?.id];
  
  // Make sure we have a valid question before rendering
  if (!currentQuestion) {
    return <div className="quiz-error">Error loading current statement.</div>;
  }

  return (
    <div className="flowchart-quiz-container">
      <div className="quiz-progress">
        <span>{currentStep + 1} of {questions.length}</span>
        <progress value={currentStep + 1} max={questions.length}></progress>
      </div>
      
      
      <div className="flowchart-content">
        {/* Visual Flowchart Representation */}
        <div className="flowchart-visual-container">
          {questions.map((question, index) => {
            // Determine the display state of this step
            const stepState = 
              index < currentStep ? "completed" :
              index === currentStep ? "current" : 
              "upcoming";
            
            // Check if this step has a validation error
            const hasError = validationErrors[question.id] && validationAttempted;
            
            return (
              <React.Fragment key={question.id}>
                <div className={`flowchart-box ${stepState} ${hasError ? 'error' : ''}`}>
                  <div className="flowchart-box-number">{index + 1}</div>
                  <div className="flowchart-box-content">
                    <p>{question.question_text}</p>
                  </div>
                </div>
                
                {/* Add connector arrows between boxes except after the last one */}
                {index < questions.length - 1 && (
                  <div className={`flowchart-connector ${stepState}`}>
                    <div className="flowchart-arrow"></div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
        
        {/* Current Question Interaction Area */}
        <div className={`current-statement ${currentError && validationAttempted ? 'error' : ''}`}>
          <div className="statement-number">{currentStep + 1}</div>
          <div className="statement-content">{currentQuestion.question_text}</div>
          
          {currentQuestion.hint_text && (
            <div className="statement-question">
              <strong>Question:</strong> {currentQuestion.hint_text}
            </div>
          )}
          
          <div className="statement-answer">
            <textarea
              className={currentError && validationAttempted ? 'error' : ''}
              value={userAnswers[currentQuestion.id] || ''}
              onChange={handleAnswerChange}
              placeholder="Write your answer here..."
              rows={3}
            ></textarea>
            
            {currentError && validationAttempted && (
              <div className="validation-error">{currentError}</div>
            )}
          </div>
        </div>
      </div>
      
      <div className="quiz-navigation">
        <button 
          className="prev-button" 
          onClick={prevStep}
          disabled={currentStep === 0}
        >
          Previous
        </button>
        <button 
          className="next-button" 
          onClick={nextStep}
        >
          {currentStep < questions.length - 1 ? "Next" : "Finish"}
        </button>
      </div>
    </div>
  );
};

export default FlowchartQuiz;