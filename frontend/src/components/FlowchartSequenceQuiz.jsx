import React, { useState } from 'react';
import "../styles/MainQuizContainer.css";

const FlowchartSeqeuenceQuiz = ({ quizData, saveResponse }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [userResponse, setUserResponse] = useState('');
  const [savedResponses, setSavedResponses] = useState({});

  const questions = quizData.questions;
  const currentQuestion = questions[currentStep];

  const handleResponseChange = (e) => {
    setUserResponse(e.target.value);
  };

  const handleNext = async () => {
    if (userResponse.trim()) {
      // Save response
      const result = await saveResponse(currentQuestion.id, userResponse);
      
      if (result.status === 'success') {
        // Store response locally
        setSavedResponses({
          ...savedResponses,
          [currentQuestion.id]: userResponse
        });
        
        // Move to next step
        if (currentStep < questions.length - 1) {
          setCurrentStep(currentStep + 1);
          // Check if we already have a response for the next question
          const nextQuestion = questions[currentStep + 1];
          setUserResponse(savedResponses[nextQuestion.id] || nextQuestion.user_response || '');
        }
      }
    } else {
      alert('Please enter a response before continuing');
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      // Load previously saved response for this step
      const prevQuestion = questions[currentStep - 1];
      setUserResponse(savedResponses[prevQuestion.id] || prevQuestion.user_response || '');
    }
  };

  const isLastStep = currentStep === questions.length - 1;

  return (
    <div className="statement-sequence-quiz">
      <div className="sequence-container">
        {questions.map((question, index) => (
          <div 
            key={question.id}
            className={`sequence-step ${index === currentStep ? 'active' : ''} ${index < currentStep ? 'completed' : ''}`}
          >
            <div className="step-number">{index + 1}</div>
            <div className="step-title">Statement {index + 1}</div>
          </div>
        ))}
      </div>

      <div className="statement-card">
        <div className="statement-content">
          {currentQuestion.text}
        </div>
        
        <div className="response-input">
          <label htmlFor="userResponse">Your thoughts:</label>
          <textarea
            id="userResponse"
            value={userResponse}
            onChange={handleResponseChange}
            placeholder="Share your thoughts about this statement..."
          />
        </div>
      </div>

      <div className="sequence-navigation">
        <button 
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="nav-button previous"
        >
          Previous
        </button>
        
        <button 
          onClick={handleNext}
          className="nav-button next"
        >
          {isLastStep ? 'Finish' : 'Next'}
        </button>
      </div>
    </div>
  );
};

export default FlowchartSeqeuenceQuiz;