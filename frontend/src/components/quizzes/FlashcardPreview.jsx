import React, { useState } from 'react';

const FlashcardPreview = ({ question, hint }) => {
  const [flipped, setFlipped] = useState(false);
  
  const handleFlip = () => {
    setFlipped(!flipped);
  };
  
  return (
    <div className="flashcard-preview-container">
      <h3>Flashcard Preview</h3>
      
      <div 
        className={`flashcard-preview ${flipped ? 'flipped' : ''}`} 
        onClick={handleFlip}
      >
        <div className="card-front">
          <div className="card-content">{question}</div>
          <div className="flip-instruction">Click to flip</div>
        </div>
        
        <div className="card-back">
          <h4>Hint/Answer Guidance:</h4>
          <div className="hint-content">{hint || 'No hint provided'}</div>
          <div className="flip-instruction">Click to see question</div>
        </div>
      </div>
      
      <div className="preview-note">
        Note: This is how users will see your flashcard. The front shows the question, 
        and when they click, they'll see the back to write their answer.
      </div>
    </div>
  );
};

export default FlashcardPreview;