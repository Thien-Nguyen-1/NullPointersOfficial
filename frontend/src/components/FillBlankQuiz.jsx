import React, { useState } from 'react';
import "../styles/MainQuizContainer.css";

const FillBlankQuiz = ({ quizData, saveResponse }) => {
  const [responses, setResponses] = useState(
    quizData.questions.reduce((acc, q) => {
      acc[q.id] = q.user_response || '';
      return acc;
    }, {})
  );
  const [savingStatus, setSavingStatus] = useState({});

  const handleResponseChange = (questionId, value) => {
    setResponses({
      ...responses,
      [questionId]: value
    });
  };

  const handleSubmitResponse = async (questionId) => {
    setSavingStatus({
      ...savingStatus,
      [questionId]: 'saving'
    });

    const result = await saveResponse(questionId, responses[questionId]);
    
    setSavingStatus({
      ...savingStatus,
      [questionId]: result.status === 'success' ? 'saved' : 'error'
    });

    // Clear status after 3 seconds
    setTimeout(() => {
      setSavingStatus({
        ...savingStatus,
        [questionId]: null
      });
    }, 3000);
  };

  const getStatusIndicator = (questionId) => {
    const status = savingStatus[questionId];
    if (!status) return null;
    
    return (
      <span className={`status-indicator ${status}`}>
        {status === 'saving' && 'Saving...'}
        {status === 'saved' && 'Saved!'}
        {status === 'error' && 'Error saving'}
      </span>
    );
  };

  return (
    <div className="text-input-quiz">
      <h2>Please answer the following questions:</h2>
      
      {quizData.questions.map((question, index) => (
        <div key={question.id} className="question-item">
          <h3>Question {index + 1}</h3>
          <div className="question-text">{question.text}</div>
          
          <div className="answer-container">
            <textarea
              value={responses[question.id]}
              onChange={(e) => handleResponseChange(question.id, e.target.value)}
              onBlur={() => handleSubmitResponse(question.id)}
              placeholder="Enter your answer here..."
              rows={4}
            />
            {getStatusIndicator(question.id)}
          </div>
        </div>
      ))}
      
      <div className="quiz-footer">
        <button className="submit-button">Submit All Answers</button>
      </div>
    </div>
  );
};

export default FillBlankQuiz;