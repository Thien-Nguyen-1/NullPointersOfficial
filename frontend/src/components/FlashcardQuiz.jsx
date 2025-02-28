import React, { useState } from 'react';
import "../styles/MainQuizContainer.css";

const FlashcardQuiz = ({ quizData, saveResponse }) => {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [userAnswers, setUserAnswers] = useState(
    quizData.questions.reduce((acc, q) => {
      acc[q.id] = q.user_response || '';
      return acc;
    }, {})
  );

  const cards = quizData.questions;
  const currentCard = cards[currentCardIndex];

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
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setFlipped(false);
    }
  };

  const handleAnswerChange = (e) => {
    const updatedAnswers = {
      ...userAnswers,
      [currentCard.id]: e.target.value,
    };
    setUserAnswers(updatedAnswers);
  };

  const handleSaveAnswer = async () => {
    await saveResponse(currentCard.id, userAnswers[currentCard.id]);
  };

  return (
    <div className="flashcard-quiz">
      <div className="progress-bar">
        <div className="progress-indicator">
          Card {currentCardIndex + 1} of {cards.length}
        </div>
      </div>

      <div className={`flashcard ${flipped ? 'flipped' : ''}`} onClick={handleFlip}>
        <div className="card-front">
          <h3>Question {currentCardIndex + 1}</h3>
          <div className="card-content">{currentCard.text}</div>
        </div>
        <div className="card-back">
          <h3>Your Answer</h3>
          <textarea
            value={userAnswers[currentCard.id]}
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
          Flip Card
        </button>
        <button
          onClick={handleNextCard}
          disabled={currentCardIndex === cards.length - 1}
          className="nav-button next"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default FlashcardQuiz;