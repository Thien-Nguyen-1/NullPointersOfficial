import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import "../styles/MainQuizContainer.css";

const QuizEditor = () => {
  const { moduleId, quizType } = useParams();
  const [moduleData, setModuleData] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState({ text: '', hint: '' });
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First get the module details
        const moduleResponse = await axios.get(`/api/modules/${moduleId}/`);
        setModuleData(moduleResponse.data);
        
        // Then find the task/quiz associated with this module
        const tasksResponse = await axios.get(`/api/tasks/?moduleID=${moduleId}`);
        if (tasksResponse.data.length > 0) {
          // Use the first task found
          const task = tasksResponse.data[0];
          setTaskId(task.contentID);
          
          // Fetch any existing questions for this task
          try {
            const questionsResponse = await axios.get(`/api/quiz/${task.contentID}/`);
            if (questionsResponse.data.questions) {
              setQuestions(questionsResponse.data.questions);
            }
          } catch (err) {
            console.log('No questions found or error fetching them:', err);
            // This might be a new quiz, so we just continue
          }
        } else {
          setError('No quiz found for this module');
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Error loading quiz data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [moduleId]);

  const addQuestion = async () => {
    if (!currentQuestion.text.trim()) {
      setError('Question text is required');
      return;
    }

    try {
      const response = await axios.post('/api/quiz/questions/', {
        task_id: taskId,
        question_text: currentQuestion.text,
        hint_text: currentQuestion.hint || '',
        order: questions.length // Set order based on current number of questions
      });
      
      // Add the new question to the list
      setQuestions([...questions, response.data]);
      // Clear the form
      setCurrentQuestion({ text: '', hint: '' });
      setError('');
    } catch (err) {
      console.error('Error adding question:', err);
      setError('Failed to add question');
    }
  };

  const handleFieldChange = (e) => {
    setCurrentQuestion({
      ...currentQuestion,
      [e.target.name]: e.target.value
    });
  };

  const handleFinish = () => {
    // Navigate back to the courses page
    navigate('/admin/courses');
  };

  const getQuizTypeLabel = () => {
    switch(quizType) {
      case 'flashcard': 
        return 'Flashcard Quiz';
      case 'statement_sequence': 
        return 'Statement Sequence Quiz';
      case 'text_input': 
        return 'Fill in the Blank Quiz';
      default: 
        return 'Quiz';
    }
  };

  if (loading) return <div className="loading">Loading quiz editor...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="quiz-editor-container">
      <h1>Edit {getQuizTypeLabel()}</h1>
      
      {moduleData && (
        <div className="module-info">
          <h2>{moduleData.title}</h2>
          <p>{moduleData.description}</p>
        </div>
      )}
      
      <div className="questions-list">
        <h3>Questions ({questions.length})</h3>
        
        {questions.length === 0 ? (
          <p>No questions added yet. Add your first question below.</p>
        ) : (
          <ul className="questions">
            {questions.map((question, index) => (
              <li key={question.id || index} className="question-item">
                <div className="question-number">Q{index + 1}</div>
                <div className="question-content">
                  <div className="question-text">{question.text}</div>
                  {question.hint && (
                    <div className="question-hint">Hint: {question.hint}</div>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="add-question-form">
        <h3>Add New Question</h3>
        
        <div className="form-group">
          <label htmlFor="questionText">Question Text</label>
          <textarea
            id="questionText"
            name="text"
            value={currentQuestion.text}
            onChange={handleFieldChange}
            rows="3"
            placeholder={`Enter your question ${quizType === 'flashcard' ? 'for the front of the card' : ''}`}
          />
        </div>
        
        {quizType === 'flashcard' && (
          <div className="form-group">
            <label htmlFor="hintText">Hint (Optional)</label>
            <textarea
              id="hintText"
              name="hint"
              value={currentQuestion.hint || ''}
              onChange={handleFieldChange}
              rows="2"
              placeholder="Enter an optional hint to show on the back of the card"
            />
          </div>
        )}
        
        <button 
          className="add-question-btn" 
          onClick={addQuestion}
        >
          Add Question
        </button>
      </div>
      
      <div className="quiz-editor-actions">
        <button className="finish-btn" onClick={handleFinish}>
          Finish
        </button>
      </div>
    </div>
  );
};

export default QuizEditor;