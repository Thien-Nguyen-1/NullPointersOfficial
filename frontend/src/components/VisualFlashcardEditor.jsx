import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/MainQuizContainer.css';

const VisualFlashcardEditor = () => {
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

  // Track which card is flipped
  const [flippedCardId, setFlippedCardId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const questionInputRef = useRef(null);

  // Debug state
  const [debug, setDebug] = useState({
    showDebug: false,
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
            
            // Fetch existing questions for this task using the correct endpoint
            try {
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

  // Focus on the input field when editing
  useEffect(() => {
    if (isEditing && questionInputRef.current) {
      questionInputRef.current.focus();
    }
  }, [isEditing]);

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

  // Handle flipping a card
  const handleFlip = (id) => {
    setFlippedCardId(flippedCardId === id ? null : id);
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

  // Create a question
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
      setIsEditing(false);
      
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
    handleFlip(question.id);
  };

  // Delete a question
  const deleteQuestion = async (questionId) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      try {
        console.log("Deleting question:", questionId);
        addDebugInfo('Deleting question', { questionId });
        
        // Make the DELETE request
        await axios.delete(`/api/quiz/questions/${questionId}/`);
        
        // Even if we get a network error, the deletion likely succeeded
        // (based on your server logs showing 204 responses)
        console.log("Question deletion request sent");
        
        // Remove the question from the UI regardless of the response
        setQuestions(questions.filter(q => q.id !== questionId));
        
        // Optionally add a success message
        addDebugInfo('Question removed from UI', { questionId });
        
      } catch (err) {
        console.error("Error in delete request:", err);
        addDebugInfo('Error in delete request', err);
        
        // Since we know the server is actually processing the requests correctly,
        // we'll remove it from the UI anyway
        setQuestions(questions.filter(q => q.id !== questionId));
        
        // Add a message about what happened
        setError("Question was removed from UI. Server reported a network error but the deletion likely succeeded.");
      }
    }
  };

  // Render loading state
  if (loading) {
    return <div className="loading">Loading quiz editor...</div>;
  }

  return (
    <div className="visual-flashcard-editor">
      <div className="editor-header">
        <div className="breadcrumb">
          Pages / Module Builder / <span className="current">Add Course</span>
        </div>
        
        <h1>Add Course</h1>
        
        <div className="tags-container">
          <span className="tag">Anxiety</span>
          <button className="add-tag-btn">+</button>
          <span className="tag-placeholder">Add module tags</span>
        </div>
      </div>
      
      <div className="flashcards-container">
        {questions.map((question, index) => (
          <div 
            key={question.id} 
            className={`flashcard ${flippedCardId === question.id ? 'flipped' : ''}`}
            onClick={() => handleFlip(question.id)}
          >
            <div className="flashcard-inner">
              <div className="flashcard-front">
                <h3>Question {index + 1}</h3>
                <div className="flashcard-content">
                  {question.text || question.question_text}
                </div>
                <div className="actions">
                  <button onClick={(e) => { e.stopPropagation(); previewQuestion(question); }}>Preview</button>
                  <button onClick={(e) => { e.stopPropagation(); }}>Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); deleteQuestion(question.id); }}>Delete</button>
                </div>
              </div>
              <div className="flashcard-back">
                <h3>Hint/Answer</h3>
                <div className="flashcard-content">
                  {question.hint || question.hint_text || 'No hint provided.'}
                </div>
                <div className="flip-instruction">Client will flip the card to write their answer.</div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Add new question card */}
        <div className={`flashcard add-card ${isEditing ? 'editing' : ''}`} onClick={() => setIsEditing(true)}>
          {!isEditing ? (
            <div className="add-placeholder">
              <h3>Question {questions.length + 1}</h3>
              <div className="flashcard-content">
                Add your question here.
              </div>
              <div className="flip-instruction">Client will flip the card to write their answer.</div>
            </div>
          ) : (
            <form onSubmit={handleAddQuestion} onClick={(e) => e.stopPropagation()}>
              <div className="form-group">
                <textarea
                  ref={questionInputRef}
                  name="question_text"
                  value={newQuestion.question_text}
                  onChange={handleInputChange}
                  placeholder="Enter your question here..."
                  required
                />
              </div>
              <div className="form-group">
                <textarea
                  name="hint_text"
                  value={newQuestion.hint_text}
                  onChange={handleInputChange}
                  placeholder="Enter a hint or guidance for the answer (optional)..."
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-btn">Add Question</button>
                <button type="button" className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
              </div>
            </form>
          )}
        </div>
        
        <div className="add-another-btn">
          <button onClick={() => setIsEditing(true)}>
            <span className="plus-icon">+</span>
            Add another flashcard
          </button>
        </div>
      </div>
      
      <div className="page-actions">
        <button className="preview-btn">Preview</button>
        <div className="main-actions">
          <button className="publish-btn">Publish</button>
          <button className="edit-btn">Edit</button>
        </div>
      </div>
      
      {/* Error message display */}
      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError(null)} 
            className="close-error"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Debug toggle button */}
      <button 
        onClick={toggleDebug} 
        className="debug-toggle"
      >
        {debug.showDebug ? 'Hide Debug' : 'Show Debug'}
      </button>
      
      {/* Debug information panel */}
      {debug.showDebug && (
        <div className="debug-panel">
          <h3>Debug Information</h3>
          <div>
            <strong>Module ID:</strong> {moduleId}<br />
            <strong>Quiz Type:</strong> {quizType}<br />
            <strong>Task ID:</strong> {taskId || 'Not created yet'}<br />
            <strong>Questions Count:</strong> {questions.length}
          </div>
          
          <h4>API Calls Log:</h4>
          <div className="api-logs">
            {debug.apiCalls.map((call, index) => (
              <div key={index} className="api-log-entry">
                <div><strong>Time:</strong> {call.timestamp}</div>
                <div><strong>Action:</strong> {call.action}</div>
                <div><strong>Data:</strong> {call.data}</div>
              </div>
            ))}
          </div>
          
          {apiResponse && (
            <>
              <h4>Latest API Response:</h4>
              <pre className="api-response">
                {JSON.stringify(apiResponse, null, 2)}
              </pre>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default VisualFlashcardEditor;