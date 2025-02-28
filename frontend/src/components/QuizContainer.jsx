import React, { useState, useEffect } from 'react';
import axios from 'axios';
import FlashcardQuiz from './FlashcardQuiz';
import FlowchartSequenceQuiz from './FlowchartSequenceQuiz';
import FillBlankQuiz from './FillBlankQuiz';
import "../styles/MainQuizContainer.css";
import { useParams } from "react-router-dom";

const QuizContainer = () => {
    
  const { taskId } = useParams();  // Get taskId from URL parameters
  const [loading, setLoading] = useState(true);
  const [quizData, setQuizData] = useState(null);
  const [error, setError] = useState(null);

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
        setQuizData(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load quiz data');
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
      return response.data;
    } catch (err) {
      console.error('Error saving response:', err);
      return { status: 'error' };
    }
  };

  if (loading) return <div>Loading quiz...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!quizData) return <div>No quiz data available</div>;

  // Render different quiz types based on quiz_type
  const renderQuiz = () => {
    switch (quizData.quiz_type) {
      case 'flashcard':
        return <FlashcardQuiz quizData={quizData} saveResponse={saveResponse} />;
      case 'statement_sequence':
        return <FlowchartSequenceQuiz quizData={quizData} saveResponse={saveResponse} />;
      case 'text_input':
      default:
        return <FillBlankQuiz quizData={quizData} saveResponse={saveResponse} />;
    }
  };

  return (
    <div className="quiz-container">
      <h1>{quizData.title}</h1>
      {quizData.description && <p className="quiz-description">{quizData.description}</p>}
      {renderQuiz()}
    </div>
  );
};

export default QuizContainer;