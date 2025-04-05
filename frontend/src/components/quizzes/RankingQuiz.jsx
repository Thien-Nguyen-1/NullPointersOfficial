import React, { useState, useEffect } from "react";
import { FaArrowUp, FaArrowDown, FaCheck } from "react-icons/fa";
import { QuizApiUtils } from "../../services/QuizApiUtils";
import "../../styles/Quizzes.css";

const RankingQuiz = ({ taskId, onComplete }) => {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch questions when component mounts
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        console.log("Fetching questions for taskId:", taskId);
        const fetchedQuestions = await QuizApiUtils.getQuestions(taskId);
        console.log("Fetched questions:", fetchedQuestions);

        if (fetchedQuestions && fetchedQuestions.length > 0) {
          // Normalize question data
          const normalizedQuestions = fetchedQuestions.map(q => ({
            id: q.id,
            question_text: q.question_text || q.text || "",
            tiers: q.answers || [] // Tiers are stored in the answers field
          }));

          setQuestions(normalizedQuestions);

          // Initialize userAnswers with the default order of tiers
          const initialAnswers = {};
          normalizedQuestions.forEach(question => {
            initialAnswers[question.id] = [...question.tiers]; // Copy the original order
          });

          setUserAnswers(initialAnswers);
        } else {
          console.warn("No questions returned from API for ranking quiz");
          setError("No questions available for this quiz.");
        }

        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching ranking quiz questions:", err);
        setError("Failed to load questions. Please try again later.");
        setIsLoading(false);
      }
    };

    if (taskId) {
      fetchQuestions();
    } else {
      console.error("No taskId provided to RankingQuiz component");
      setError("Quiz configuration error. Please contact support.");
      setIsLoading(false);
    }
  }, [taskId]);

  // Handle moving a tier up or down
  const handleMoveTier = (questionId, tierIndex, direction) => {
    if (quizSubmitted) return; // Don't allow changes after submit

    const tiers = [...userAnswers[questionId]];

    // Check if movement is valid
    if ((direction === "up" && tierIndex === 0) ||
        (direction === "down" && tierIndex === tiers.length - 1)) {
      return;
    }

    const swapIndex = direction === "up" ? tierIndex - 1 : tierIndex + 1;
    [tiers[tierIndex], tiers[swapIndex]] = [tiers[swapIndex], tiers[tierIndex]];

    setUserAnswers({
      ...userAnswers,
      [questionId]: tiers
    });
  };

  // Submit the quiz
  const submitQuiz = () => {
    console.log("Submitting ranking quiz");
    console.log("Current user answers:", userAnswers);
    console.log("Questions:", questions);
    
    // No validation needed for ranking quiz since the order is always valid
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
    // Reset answers to the original order
    const resetAnswers = {};
    questions.forEach(question => {
      resetAnswers[question.id] = [...question.tiers];
    });

    setUserAnswers(resetAnswers);
    setQuizSubmitted(false);
    setShowReview(false);
    setValidationErrors({});
  };

  // Render a single question with its tiers
  const renderQuestion = (question, index) => {
    const tiers = userAnswers[question.id] || [];

    return (
      <div key={question.id} className="ranking-question quiz-question">
        <h3>Question {index + 1}</h3>
        <p className="question-text">{question.question_text}</p>

        <div className="ranking-tiers">
          {tiers.map((tier, tierIndex) => (
            <div key={`tier-${tierIndex}`} className="ranking-tier">
              <div className="tier-number">{tierIndex + 1}</div>
              <div className="tier-content">{tier}</div>
              <div className="tier-controls">
                <button
                  onClick={() => handleMoveTier(question.id, tierIndex, "up")}
                  disabled={tierIndex === 0 || quizSubmitted}
                  className="tier-button"
                >
                  <FaArrowUp />
                </button>
                <button
                  onClick={() => handleMoveTier(question.id, tierIndex, "down")}
                  disabled={tierIndex === tiers.length - 1 || quizSubmitted}
                  className="tier-button"
                >
                  <FaArrowDown />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render the review screen
  const renderReview = () => {
    return (
      <div className="quiz-review">
        <h3>Ranking Quiz - Review</h3>

        <div className="review-summary">
          <p>You've completed all {questions.length} questions in this exercise.</p>
          <p>Here is a summary of your rankings:</p>
        </div>

        <div className="review-questions">
          {questions.map((question, qIndex) => {
            const userTiers = userAnswers[question.id] || [];

            return (
              <div key={question.id} className="review-question-item">
                <div className="review-question-number">{qIndex + 1}</div>
                <div className="review-question-content">
                  <p className="review-question-text">{question.question_text}</p>
                  <div className="review-tiers">
                    {userTiers.map((tier, tIndex) => (
                      <div key={`review-tier-${tIndex}`} className="review-tier">
                        <span className="review-tier-number">{tIndex + 1}.</span>
                        <span className="review-tier-text">{tier}</span>
                      </div>
                    ))}
                  </div>
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

  return (
    <div className="ranking-quiz-container quiz-container">
      <div className="quiz-instructions">
        <h3>Ranking Quiz</h3>
        <p>Arrange the items in order by using the up and down arrows.</p>
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

export default RankingQuiz;