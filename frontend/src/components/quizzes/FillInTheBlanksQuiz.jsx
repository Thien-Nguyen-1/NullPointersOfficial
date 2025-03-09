import React, { useState, useEffect } from "react";
import { QuizApiUtils } from "../../services/QuizApiUtils";
import "../../styles/Quizzes.css";

const FillInTheBlanksQuiz = ({ taskId, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);

  // Fetch questions when component mounts
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
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
    
    if (taskId) {
      fetchQuestions();
    } else {
      console.error("No taskId provided to FillInTheBlanksQuiz component");
      setError("Quiz configuration error. Please contact support.");
      setIsLoading(false);
    }
  }, [taskId]);

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
  };

  // Submit the quiz and show review
  const submitQuiz = () => {
    setQuizSubmitted(true);
    setShowReview(true);
  };

  // Continue after review
  const handleContinue = () => {
    if (onComplete) {
      onComplete(userAnswers);
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
    
    return (
      <div key={question.id} className="fill-blanks-question">
        <h3>Question {index + 1}</h3>
        <div className="question-text">
          {parts.map((part, i) => (
            <React.Fragment key={i}>
              {part}
              {i < parts.length - 1 && (
                <input 
                  type="text"
                  className="blank-input"
                  value={answers[i] || ''}
                  onChange={(e) => handleBlankChange(question.id, i, e.target.value)}
                  disabled={quizSubmitted}
                  placeholder="fill in"
                />
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
                          <span className="review-answer-highlight">
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
            Continue
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

  return (
    <div className="fill-blanks-quiz-container">
      <div className="quiz-instructions">
        <h3>Fill in the Blanks</h3>
        <p>Read each sentence and fill in the missing words in the blanks.</p>
      </div>
      
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