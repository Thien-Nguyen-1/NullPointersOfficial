
// FlashcardQuiz.jsx
import React, { useState, useEffect } from 'react';
import "../styles/MainQuizContainer.css";

const FlashcardQuiz = ({ quizData, saveResponse }) => {
  console.log("FlashcardQuiz rendering with data:", quizData);
  
  // Ensure questions array exists and has items
  const questions = quizData.questions || [];
  
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [userAnswers, setUserAnswers] = useState({});
  const [saveStatus, setSaveStatus] = useState({});

  // Initialize user answers from existing data
  useEffect(() => {
    if (questions.length > 0) {
      const initialAnswers = questions.reduce((acc, q) => {
        acc[q.id] = q.user_response || '';
        return acc;
      }, {});
      setUserAnswers(initialAnswers);
    }
  }, [questions]);

  // Safely get current card
  const currentCard = questions.length > 0 ? questions[currentCardIndex] : null;

  if (!currentCard) {
    return <div className="error-message">No flashcard questions available</div>;
  }

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const handlePrevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setFlipped(false);
    }
  };

  const handleNextCard = () => {
    if (currentCardIndex < questions.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setFlipped(false);
    }
  };

  const handleAnswerChange = (e) => {
    setUserAnswers({
      ...userAnswers,
      [currentCard.id]: e.target.value,
    });
  };

  const handleSaveAnswer = async () => {
    if (!currentCard) return;
    
    setSaveStatus({
      ...saveStatus,
      [currentCard.id]: 'saving'
    });
    
    try {
      const result = await saveResponse(currentCard.id, userAnswers[currentCard.id] || '');
      
      setSaveStatus({
        ...saveStatus,
        [currentCard.id]: result.status === 'success' ? 'saved' : 'error'
      });
      
      // Clear status after 2 seconds
      setTimeout(() => {
        setSaveStatus(prev => ({
          ...prev,
          [currentCard.id]: null
        }));
      }, 2000);
    } catch (err) {
      console.error("Error saving answer:", err);
      setSaveStatus({
        ...saveStatus,
        [currentCard.id]: 'error'
      });
    }
  };

  // Generate status message
  const getStatusMessage = () => {
    if (!currentCard) return null;
    const status = saveStatus[currentCard.id];
    
    if (status === 'saving') return 'Saving...';
    if (status === 'saved') return 'Saved!';
    if (status === 'error') return 'Error saving';
    return null;
  };
  
  return (
    <div className="flashcard-quiz">
      <div className="progress-bar">
        <div className="progress-indicator">
          Card {currentCardIndex + 1} of {questions.length}
        </div>
      </div>

      <div 
        className={`flashcard ${flipped ? 'flipped' : ''}`} 
        onClick={handleFlip}
      >
        <div className="card-front">
          <h3>Question {currentCardIndex + 1}</h3>
          <div className="card-content">{currentCard.text}</div>
          <div className="flip-instruction">Click to flip</div>
        </div>
        
        <div className="card-back">
          <h3>Your Answer</h3>
          <textarea
            value={userAnswers[currentCard.id] || ''}
            onChange={handleAnswerChange}
            onBlur={handleSaveAnswer}
            placeholder="Write your answer here..."
            onClick={(e) => e.stopPropagation()}
          />
          {currentCard.hint && (
            <div className="hint">
              <h4>Hint:</h4>
              <p>{currentCard.hint}</p>
            </div>
          )}
          <div className={`save-status ${saveStatus[currentCard.id] || ''}`}>
            {getStatusMessage()}
          </div>
        </div>
      </div>

      <div className="card-nav">
        <button
          onClick={handlePrevCard}
          disabled={currentCardIndex === 0}
          className="nav-button prev"
        >
          Previous
        </button>
        <button
          onClick={handleFlip}
          className="nav-button flip"
        >
          {flipped ? 'Show Question' : 'Show Answer'}
        </button>
        <button
          onClick={handleNextCard}
          disabled={currentCardIndex === questions.length - 1}
          className="nav-button next"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default FlashcardQuiz;

