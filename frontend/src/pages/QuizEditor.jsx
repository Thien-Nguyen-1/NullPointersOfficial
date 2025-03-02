import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/MainQuizContainer.css';

const QuizEditor = () => {
  const { moduleId, quizType } = useParams();
  const navigate = useNavigate();
  
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [taskId, setTaskId] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  
  // Form state for adding new questions
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    hint_text: '',
    order: 0
  });

  // Debug state
  const [debug, setDebug] = useState({
    showDebug: true, // Set to true by default for testing
    apiCalls: []
  });

  // Load module data and existing questions
  useEffect(() => {
    const fetchModuleData = async () => {
      try {
        console.log(`Fetching data for module ID: ${moduleId} and quiz type: ${quizType}`);
        
        // Fetch module details
        const moduleResponse = await axios.get(`/api/modules/${moduleId}/`);
        console.log("Module data response:", moduleResponse.data);
        setModule(moduleResponse.data);
        
        // Check if a task/quiz already exists for this module
        try {
          const tasksResponse = await axios.get(`/api/tasks/?moduleID=${moduleId}`);
          console.log("Tasks response:", tasksResponse.data);
          
          const existingTask = tasksResponse.data.find(task => task.quiz_type === quizType);
          
          if (existingTask) {
            console.log("Found existing task:", existingTask);
            setTaskId(existingTask.contentID);
            
            // Fetch existing questions for this task using the CORRECT endpoint
            try {
              // UPDATED URL from /api/quiz-questions/ to /api/quiz/questions/
              const questionsResponse = await axios.get(`/api/quiz/questions/?task_id=${existingTask.contentID}`);
              console.log("Questions response:", questionsResponse.data);
              setQuestions(questionsResponse.data);
            } catch (questionsErr) {
              console.error("Error fetching questions:", questionsErr);
              addDebugInfo('Error fetching questions', questionsErr);
            }
          } else {
            console.log("No existing task found for this module and quiz type");
          }
        } catch (err) {
          console.error("Error fetching tasks:", err);
          addDebugInfo('Error fetching tasks', err);
        }
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching module data:", err);
        setError(`Failed to load module data: ${err.message}`);
        addDebugInfo('Error fetching module data', err);
        setLoading(false);
      }
    };
    
    fetchModuleData();
  }, [moduleId, quizType]);

  // Add debug information
  const addDebugInfo = (action, data) => {
    setDebug(prev => ({
      ...prev,
      apiCalls: [...prev.apiCalls, {
        timestamp: new Date().toISOString(),
        action,
        data: typeof data === 'object' ? JSON.stringify(data) : data
      }]
    }));
  };

  // Toggle debug panel
  const toggleDebug = () => {
    setDebug(prev => ({
      ...prev,
      showDebug: !prev.showDebug
    }));
  };

  // Handle input change for new question form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewQuestion({
      ...newQuestion,
      [name]: value
    });
  };

  // Add a new question
  const handleAddQuestion = async (e) => {
    e.preventDefault();
    setApiResponse(null);
    
    if (!newQuestion.question_text.trim()) {
      setError("Question text is required!");
      return;
    }
    
    try {
      // If no task exists yet, create one first
      if (!taskId) {
        await createTaskAndQuestion();
      } else {
        // If task already exists, just create the question
        await createQuestion(taskId);
      }
    } catch (err) {
      console.error("General error in handleAddQuestion:", err);
      addDebugInfo('General error in handleAddQuestion', err);
      setError(`An unexpected error occurred: ${err.message}`);
    }
  };

  // Create task and then question
  const createTaskAndQuestion = async () => {
    console.log("Creating new task for module:", moduleId);
    addDebugInfo('Creating new task', { moduleId, quizType });
    
    // Make sure to include all required fields from your Task model
    const taskData = {
      title: `${quizType.charAt(0).toUpperCase() + quizType.slice(1)} Quiz for ${module?.title || 'Module'}`,
      moduleID: moduleId,
      description: `Quiz for module: ${module?.title || 'Module'}`,
      quiz_type: quizType,
      text_content: `Quiz content for module: ${module?.title || 'Module'}`,
      author: 1, // Replace with actual user ID from authentication
      is_published: false
    };
    
    console.log("Task creation payload:", taskData);
    
    try {
      const taskResponse = await axios.post('/api/tasks/', taskData);
      console.log("Task created successfully:", taskResponse.data);
      addDebugInfo('Task created', taskResponse.data);
      
      // Get the contentID from the response
      const newTaskId = taskResponse.data.contentID;
      setTaskId(newTaskId);
      
      // Now create the question with the new taskId
      await createQuestion(newTaskId);
    } catch (taskErr) {
      console.error("Error creating task:", taskErr);
      addDebugInfo('Error creating task', taskErr);
      
      // Show detailed error information
      if (taskErr.response) {
        setError(`Task creation failed: ${taskErr.response.status} - ${JSON.stringify(taskErr.response.data)}`);
        setApiResponse({
          status: taskErr.response.status,
          data: taskErr.response.data,
          headers: taskErr.response.headers
        });
      } else if (taskErr.request) {
        setError("Task creation failed: No response received from server");
        setApiResponse({
          request: "Request sent but no response received"
        });
      } else {
        setError(`Task creation failed: ${taskErr.message}`);
        setApiResponse({
          message: taskErr.message
        });
      }
    }
  };

  // Separate function to create a question
  const createQuestion = async (currentTaskId) => {
    try {
      console.log("Creating new question for task:", currentTaskId);
      
      const questionData = {
        task_id: currentTaskId,
        question_text: newQuestion.question_text,
        hint_text: newQuestion.hint_text || '',
        order: questions.length
      };
      
      console.log("Question creation payload:", questionData);
      addDebugInfo('Creating question', questionData);
      
      // UPDATED URL from /api/quiz-questions/ to /api/quiz/questions/
      const questionResponse = await axios.post('/api/quiz/questions/', questionData);
      console.log("Question created successfully:", questionResponse.data);
      addDebugInfo('Question created', questionResponse.data);
      
      // Add the new question to the list
      setQuestions([...questions, questionResponse.data]);
      
      // Reset the form
      setNewQuestion({
        question_text: '',
        hint_text: '',
        order: questions.length + 1
      });
      
      // Clear any previous errors
      setError(null);
      
      // Set API response for debugging
      setApiResponse({
        status: questionResponse.status,
        data: questionResponse.data
      });
      
    } catch (err) {
      console.error("Error creating question:", err);
      addDebugInfo('Error creating question', err);
      
      // Show detailed error information
      if (err.response) {
        setError(`Question creation failed: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
        setApiResponse({
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
      } else if (err.request) {
        setError("Question creation failed: No response received from server");
        setApiResponse({
          request: "Request sent but no response received"
        });
      } else {
        setError(`Question creation failed: ${err.message}`);
        setApiResponse({
          message: err.message
        });
      }
    }
  };

  // Preview a question
  const previewQuestion = (question) => {
    console.log("Preview question:", question);
    // Implementation for preview would go here
  };

  // Edit a question
  const editQuestion = (questionId) => {
    console.log("Edit question:", questionId);
    // Implementation for editing would go here
  };

  // Delete a question
  const deleteQuestion = async (questionId) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        console.log("Deleting question:", questionId);
        addDebugInfo('Deleting question', { questionId });
        
        // UPDATED URL from /api/quiz-questions/ to /api/quiz/questions/
        await axios.delete(`/api/quiz/questions/${questionId}/`);
        console.log("Question deleted successfully");
        addDebugInfo('Question deleted', { questionId });
        
        setQuestions(questions.filter(q => q.id !== questionId));
      } catch (err) {
        console.error("Error deleting question:", err);
        addDebugInfo('Error deleting question', err);
        
        if (err.response) {
          setError(`Failed to delete question: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
        } else {
          setError(`Failed to delete question: ${err.message}`);
        }
      }
    }
  };

  // Render loading state
  if (loading) {
    return <div className="loading">Loading quiz editor...</div>;
  }

  // Determine quiz type display name
  const getQuizTypeDisplayName = () => {
    switch (quizType) {
      case 'flashcard':
        return 'Flashcard Quiz';
      case 'statement_sequence':
        return 'Statement Sequence Quiz';
      case 'text_input':
        return 'Text Input Quiz';
      default:
        return 'Quiz';
    }
  };

  return (
    <div className="quiz-editor-container">
      <h1>Edit {getQuizTypeDisplayName()}</h1>
      
      {/* Debug toggle button */}
      <button 
        onClick={toggleDebug} 
        style={{ 
          position: 'absolute', 
          top: '10px', 
          right: '10px',
          background: '#f8f9fa',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '5px 10px',
          cursor: 'pointer'
        }}
      >
        {debug.showDebug ? 'Hide Debug' : 'Show Debug'}
      </button>
      
      {/* Debug information panel */}
      {debug.showDebug && (
        <div className="debug-panel" style={{
          background: '#f8f9fa',
          border: '1px solid #ddd',
          borderRadius: '4px',
          padding: '15px',
          marginBottom: '20px',
          fontSize: '14px',
          fontFamily: 'monospace',
          whiteSpace: 'pre-wrap'
        }}>
          <h3>Debug Information</h3>
          <div>
            <strong>Module ID:</strong> {moduleId}<br />
            <strong>Quiz Type:</strong> {quizType}<br />
            <strong>Task ID:</strong> {taskId || 'Not created yet'}<br />
            <strong>Questions Count:</strong> {questions.length}
          </div>
          
          <h4>API Calls Log:</h4>
          <div style={{ maxHeight: '200px', overflow: 'auto' }}>
            {debug.apiCalls.map((call, index) => (
              <div key={index} style={{ marginBottom: '10px', borderBottom: '1px solid #eee', paddingBottom: '5px' }}>
                <div><strong>Time:</strong> {call.timestamp}</div>
                <div><strong>Action:</strong> {call.action}</div>
                <div><strong>Data:</strong> {call.data}</div>
              </div>
            ))}
          </div>
          
          {apiResponse && (
            <>
              <h4>Latest API Response:</h4>
              <pre style={{ maxHeight: '200px', overflow: 'auto' }}>
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
      
      {module && (
        <div className="module-info">
          <h2>{module.title}</h2>
          <p>{module.description}</p>
        </div>
      )}
      
      {/* Error message display */}
      {error && (
        <div className="error-message" style={{
          padding: '10px 15px',
          marginBottom: '20px',
          backgroundColor: '#f8d7da',
          color: '#721c24',
          borderRadius: '4px',
          borderLeft: '4px solid #dc3545'
        }}>
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError(null)} 
            style={{
              float: 'right',
              background: 'none',
              border: 'none',
              color: '#721c24',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </div>
      )}
      
      <div className="questions-list">
        <h3>Questions ({questions.length})</h3>
        
        {questions.length > 0 ? (
          <ul className="questions">
            {questions.map((question, index) => (
              <li key={question.id || index} className="question-item">
                <div className="question-number">{index + 1}</div>
                <div className="question-content">
                  <div className="question-text">{question.text || question.question_text}</div>
                  {(question.hint || question.hint_text) && (
                    <div className="question-hint">Hint: {question.hint || question.hint_text}</div>
                  )}
                </div>
                <div className="question-actions">
                  <button onClick={() => previewQuestion(question)} className="action-btn preview">
                    Preview
                  </button>
                  <button onClick={() => editQuestion(question.id)} className="action-btn edit">
                    Edit
                  </button>
                  <button onClick={() => deleteQuestion(question.id)} className="action-btn delete">
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>No questions added yet. Use the form below to add your first question.</p>
        )}
      </div>
      
      <div className="add-question-form">
        <h3>Add New Question</h3>
        <form onSubmit={handleAddQuestion}>
          <div className="form-group">
            <label htmlFor="question_text">Question Text <span className="required">*</span></label>
            <textarea
              id="question_text"
              name="question_text"
              value={newQuestion.question_text}
              onChange={handleInputChange}
              placeholder="Enter your question here..."
              required
            />
          </div>
          
          {quizType === 'flashcard' && (
            <div className="form-group">
              <label htmlFor="hint_text">Hint/Answer Help (Optional)</label>
              <textarea
                id="hint_text"
                name="hint_text"
                value={newQuestion.hint_text}
                onChange={handleInputChange}
                placeholder="Enter a hint or guidance for the answer..."
              />
            </div>
          )}
          
          <button type="submit" className="add-question-btn">
            Add Question
          </button>
        </form>
      </div>
      
      <div className="quiz-editor-actions">
        <button 
          onClick={() => navigate('/admin/courses')}
          className="finish-btn"
        >
          Finish Editing
        </button>
      </div>
    </div>
  );
};

export default QuizEditor;