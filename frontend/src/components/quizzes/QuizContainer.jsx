// QuizContainer.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FlashcardQuiz from './FlashcardQuiz';
import "../../styles/MainQuizContainer.css";
import { useParams } from "react-router-dom";

const QuizContainer = () => {
  const { taskId } = useParams();
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState(null);

  useEffect(() => {
    const fetchQuizData = async () => {
      // Validate UUID format before making the request
      if (!/^[0-9a-fA-F-]{36}$/.test(taskId)) {
        console.error("Invalid UUID format:", taskId);
        setError('Invalid quiz ID format');
        setLoading(false);
        return;
      }
      
      try {
        const response = await axios.get(`/api/quiz/data/${taskId}/`);
        console.log("Quiz data received:", response.data);
        
        // Validate data structure
        const data = response.data;
        
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid data format received from API');
        }
        
        if (!data.questions || !Array.isArray(data.questions) || data.questions.length === 0) {
          throw new Error('No questions found in quiz data');
        }
        
        // Set the debug info for troubleshooting
        setDebugInfo({
          quizType: data.quiz_type,
          questionCount: data.questions.length,
          firstQuestion: data.questions[0]
        });
        
        setQuizData(data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching quiz data:', err);
        setError(`Failed to load quiz data: ${err.message}`);
        setLoading(false);
      }
    };

    fetchQuizData();
  }, [taskId]);

  const saveResponse = async (questionId, responseText) => {
    try {
      const response = await axios.post('/api/save-response/', {
        question_id: questionId,
        response_text: responseText,
      });
      console.log("Response saved:", response.data);
      return response.data;
    } catch (err) {
      console.error('Error saving response:', err);
      return { status: 'error', message: err.message };
    }
  };

  if (loading) return <div className="loading-container">Loading quiz...</div>;
  
  if (error) return (
    <div className="error-container">
      <h3>Error</h3>
      <p>{error}</p>
      {debugInfo && (
        <details>
          <summary>Debug Info</summary>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </details>
      )}
    </div>
  );
  
  if (!quizData) return <div className="no-data">No quiz data available</div>;

  // Render different quiz types based on quiz_type
  const renderQuiz = () => {
    console.log("Rendering quiz of type:", quizData.quiz_type);
    
    // Normalize quiz type to handle different formats
    const quizType = quizData.quiz_type?.toLowerCase?.() || '';
    
    if (quizType.includes('flash')) {
      return <FlashcardQuiz quizData={quizData} saveResponse={saveResponse} />;
    }
    
    if (quizType.includes('sequence') || quizType.includes('statement')) {
      return <FlowchartSequenceQuiz quizData={quizData} saveResponse={saveResponse} />;
    }
    
    // Default to text input/fill blank quiz
    return <FillBlankQuiz quizData={quizData} saveResponse={saveResponse} />;
  };

  return (
    <div className="quiz-container">
      <h1>{quizData.title || 'Quiz'}</h1>
      {quizData.description && <p className="quiz-description">{quizData.description}</p>}
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <details className="debug-info">
          <summary>Debug Info</summary>
          <p>Quiz Type: {quizData.quiz_type}</p>
          <p>Questions: {quizData.questions?.length || 0}</p>
        </details>
      )}
      
      {renderQuiz()}
    </div>
  );
};

export default QuizContainer;
