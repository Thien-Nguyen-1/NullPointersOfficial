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
      setUserAnswers({
        ...userAnswers,
        [currentQuestion.id]: e.target.value
      });
    }
  };

  // Move to the next statement
  const nextStep = () => {
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Complete the quiz
      setQuizCompleted(true);
      if (onComplete) {
        onComplete(userAnswers);
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
    
    // Reset answers
    const resetAnswers = {};
    questions.forEach(q => {
      resetAnswers[q.id] = '';
    });
    setUserAnswers(resetAnswers);
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
        <div className="flowchart-summary">
          <h4>Your Flowchart Responses:</h4>
          
          <div className="flowchart-visual-container">
            {questions.map((question, index) => (
              <div key={question.id} className="flowchart-visual">
                <div className="flowchart-box">
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
                
                <div className="flowchart-response-box">
                  <div className="flowchart-response-header">Your Answer:</div>
                  <div className="flowchart-response-content">
                    {userAnswers[question.id] || "No answer provided"}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
        </div>
        <button className="restart-button" onClick={restartQuiz}>
          Restart Flowchart
        </button>
      </div>
    );
  }

  const currentQuestion = questions[currentStep];
  
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
            
            return (
              <React.Fragment key={question.id}>
                <div className={`flowchart-box ${stepState}`}>
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
        <div className="current-statement">
          <div className="statement-number">{currentStep + 1}</div>
          <div className="statement-content">{currentQuestion.question_text}</div>
          
          {currentQuestion.hint_text && (
            <div className="statement-question">
              <strong>Question:</strong> {currentQuestion.hint_text}
            </div>
          )}
          
          <div className="statement-answer">
            <textarea
              value={userAnswers[currentQuestion.id] || ''}
              onChange={handleAnswerChange}
              placeholder="Write your answer here..."
              rows={3}
            ></textarea>
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