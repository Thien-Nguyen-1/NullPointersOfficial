import React, { useState, useEffect } from "react";
import { QuizApiUtils } from "../../services/QuizApiUtils";
import "../../styles/Quizzes.css";

const FlashcardQuiz = ({ taskId, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userAnswers, setUserAnswers] = useState({});
  const [quizCompleted, setQuizCompleted] = useState(false);
  

  // Fetch questions when component mounts
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching questions for taskId:", taskId);
        const fetchedQuestions = await QuizApiUtils.getQuestions(taskId);
        console.log("Fetched questions:", fetchedQuestions);
        
        if (fetchedQuestions && fetchedQuestions.length > 0) {
          // Normalize question data to handle API inconsistencies
          const normalizedQuestions = fetchedQuestions.map(q => ({
            id: q.id,
            // Handle both data structures (text or question_text)
            question_text: q.question_text || q.text || "",
            hint_text: q.hint_text || q.hint || "",
            order: q.order || 0
          }));
          
          setQuestions(normalizedQuestions);
          
          // Initialize userAnswers with empty strings
          const initialAnswers = {};
          normalizedQuestions.forEach(q => {
            initialAnswers[q.id] = '';
          });
          setUserAnswers(initialAnswers);
        } else {
          console.warn("No questions returned from API");
          setError("No questions available for this quiz.");
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching flashcard questions:", err);
        setError("Failed to load flashcards. Please try again later.");
        setIsLoading(false);
      }
    };
    
    if (taskId) {
      fetchQuestions();
    } else {
      console.error("No taskId provided to FlashcardQuiz component");
      setError("Quiz configuration error. Please contact support.");
      setIsLoading(false);
    }
  }, [taskId]);

  // Move to the next question
  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setFlipped(false);
    } else {
      completeQuiz();
    }
  };

  // Move to the previous question
  const prevQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setFlipped(false);
    }
  };

  // Complete the quiz
  const completeQuiz = () => {
    setQuizCompleted(true);

    // setTimeout(() => {
    //   if (onComplete) {
    //     onComplete(userAnswers);
    //   }
    // }, 3000) // 3 seconds delay

  };

  // Handle user answer input
  const handleAnswerChange = (e) => {
    const currentQuestion = questions[currentQuestionIndex];
    setUserAnswers({
      ...userAnswers,
      [currentQuestion.id]: e.target.value
    });
  };

  // Toggle card flip
  const toggleFlip = () => {
    setFlipped(!flipped);
  };

  if (isLoading) {
    return <div className="quiz-loading">Loading flashcards...</div>;
  }

  if (error) {
    return <div className="quiz-error">{error}</div>;
  }

  if (!questions || questions.length === 0) {
    return <div className="quiz-empty">No flashcards available for this quiz.</div>;
  }

  if (quizCompleted) {
    return (
      <div className="quiz-completed">
        <h3>Flashcard Review Complete!</h3>
        <p>You've gone through all the flashcards in this section.</p>
        <div className="quiz-actions">
          <button 
            className="restart-button"
            onClick={() => {
              setCurrentQuestionIndex(0);
              setFlipped(false);
              setQuizCompleted(false);
            }}
          >
            Review Again
          </button>

          <button 
            className="continue-button"
            onClick={() => { 
              if (onComplete) {
              onComplete(userAnswers);
            }
            }}
          >
            Continue
          </button>
        </div>
        
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  
  // Make sure we have a valid question before rendering
  if (!currentQuestion) {
    return <div className="quiz-error">Error loading current question.</div>;
  }

  return (
    <div className="flashcard-quiz-container">
      <div className="quiz-progress">
        <span>{currentQuestionIndex + 1} of {questions.length}</span>
        <progress value={currentQuestionIndex + 1} max={questions.length}></progress>
      </div>
      
      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={toggleFlip}>
        <div className="flashcard-inner">
          <div className="flashcard-front">
            <h3>Question</h3>
            <p className="flashcard-content">
              {currentQuestion.question_text}
            </p>
            <div className="flip-instruction">Click to flip</div>
          </div>
          <div className="flashcard-back">
            <h3>Hint/Answer</h3>
            <p>{currentQuestion.hint_text || "No hint provided."}</p>
            <textarea
              className="user-answer"
              placeholder="Write your answer here..."
              value={userAnswers[currentQuestion.id] || ''}
              onChange={handleAnswerChange}
              onClick={(e) => e.stopPropagation()} // Prevent flip when typing
            ></textarea>
          </div>
        </div>
      </div>
      
      <div className="quiz-navigation">
        <button 
          className="prev-button" 
          onClick={prevQuestion}
          disabled={currentQuestionIndex === 0}
        >
          Previous
        </button>
        <button 
          className="next-button" 
          onClick={nextQuestion}
        >
          {currentQuestionIndex < questions.length - 1 ? "Next" : "Finish"}
        </button>
      </div>
    </div>
  );
};

export default FlashcardQuiz;