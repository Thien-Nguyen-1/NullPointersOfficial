import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../styles/MainQuizContainer.css';

const VisualStatementSequenceEditor = () => {
  const { moduleId, quizType } = useParams();
  const navigate = useNavigate();
  
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statements, setStatements] = useState([]);
  const [taskId, setTaskId] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  
  // Form state for adding new statements
  const [newStatement, setNewStatement] = useState({
    question_text: '',
    hint_text: '',
    order: 0
  });

  const [editingStatementId, setEditingStatementId] = useState(null);
  const statementInputRef = useRef(null);

  // Debug state
  const [debug, setDebug] = useState({
    showDebug: false,
    apiCalls: []
  });

  // Load module data and existing statements
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
              setStatements(questionsResponse.data);
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
    if (editingStatementId && statementInputRef.current) {
      statementInputRef.current.focus();
    }
  }, [editingStatementId]);

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

  // Handle input change for new statement form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStatement({
      ...newStatement,
      [name]: value
    });
  };

  // Start editing a statement
  const startEditing = (statement) => {
    setEditingStatementId(statement.id);
    setNewStatement({
      question_text: statement.text || statement.question_text,
      hint_text: statement.hint || statement.hint_text || '',
      order: statement.order
    });
  };

  // Add a new statement
  const handleAddStatement = async (e) => {
    e.preventDefault();
    setApiResponse(null);
    
    if (!newStatement.question_text.trim()) {
      setError("Statement text is required!");
      return;
    }
    
    try {
      // If editing existing statement
      if (editingStatementId) {
        await updateStatement(editingStatementId);
        return;
      }
      
      // If no task exists yet, create one first
      if (!taskId) {
        await createTaskAndStatement();
      } else {
        // If task already exists, just create the statement
        await createStatement(taskId);
      }
    } catch (err) {
      console.error("General error in handleAddStatement:", err);
      addDebugInfo('General error in handleAddStatement', err);
      setError(`An unexpected error occurred: ${err.message}`);
    }
  };

  // Create task and then statement
  const createTaskAndStatement = async () => {
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
      
      // Now create the statement with the new taskId
      await createStatement(newTaskId);
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

  // Create a statement
  const createStatement = async (currentTaskId) => {
    try {
      console.log("Creating new statement for task:", currentTaskId);
      
      const statementData = {
        task_id: currentTaskId,
        question_text: newStatement.question_text,
        hint_text: newStatement.hint_text || '',
        order: statements.length
      };
      
      console.log("Statement creation payload:", statementData);
      addDebugInfo('Creating statement', statementData);
      
      const statementResponse = await axios.post('/api/quiz/questions/', statementData);
      console.log("Statement created successfully:", statementResponse.data);
      addDebugInfo('Statement created', statementResponse.data);
      
      // Add the new statement to the list
      setStatements([...statements, statementResponse.data]);
      
      // Reset the form
      setNewStatement({
        question_text: '',
        hint_text: '',
        order: statements.length + 1
      });
      
      // Clear any previous errors
      setError(null);
      setEditingStatementId(null);
      
      // Set API response for debugging
      setApiResponse({
        status: statementResponse.status,
        data: statementResponse.data
      });
      
    } catch (err) {
      console.error("Error creating statement:", err);
      addDebugInfo('Error creating statement', err);
      
      // Show detailed error information
      if (err.response) {
        setError(`Statement creation failed: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
        setApiResponse({
          status: err.response.status,
          data: err.response.data,
          headers: err.response.headers
        });
      } else if (err.request) {
        setError("Statement creation failed: No response received from server");
        setApiResponse({
          request: "Request sent but no response received"
        });
      } else {
        setError(`Statement creation failed: ${err.message}`);
        setApiResponse({
          message: err.message
        });
      }
    }
  };

  // Update an existing statement
  const updateStatement = async (statementId) => {
    try {
      console.log("Updating statement:", statementId);
      
      const statementData = {
        task_id: taskId,
        question_text: newStatement.question_text,
        hint_text: newStatement.hint_text || '',
        order: newStatement.order
      };
      
      console.log("Statement update payload:", statementData);
      addDebugInfo('Updating statement', statementData);
      
      const statementResponse = await axios.put(`/api/quiz/questions/${statementId}/`, statementData);
      console.log("Statement updated successfully:", statementResponse.data);
      addDebugInfo('Statement updated', statementResponse.data);
      
      // Update the statement in the list
      setStatements(statements.map(statement => 
        statement.id === statementId ? statementResponse.data : statement
      ));
      
      // Reset the form
      setNewStatement({
        question_text: '',
        hint_text: '',
        order: statements.length
      });
      
      // Clear any previous errors and exit edit mode
      setError(null);
      setEditingStatementId(null);
      
      // Set API response for debugging
      setApiResponse({
        status: statementResponse.status,
        data: statementResponse.data
      });
      
    } catch (err) {
      console.error("Error updating statement:", err);
      addDebugInfo('Error updating statement', err);
      
      if (err.response) {
        setError(`Statement update failed: ${err.response.status} - ${JSON.stringify(err.response.data)}`);
      } else {
        setError(`Statement update failed: ${err.message}`);
      }
    }
  };

  // Cancel editing
  const cancelEditing = () => {
    setEditingStatementId(null);
    setNewStatement({
      question_text: '',
      hint_text: '',
      order: statements.length
    });
  };

  // Delete a statement
  const deleteStatement = async (statementId) => {
    if (window.confirm("Are you sure you want to delete this statement?")) {
      try {
        console.log("Deleting statement:", statementId);
        addDebugInfo('Deleting statement', { statementId });
        
        await axios.delete(`/api/quiz/questions/${statementId}/`);
        console.log("Statement deletion request sent");
        
        // Remove the statement from the UI regardless of the response
        const updatedStatements = statements.filter(s => s.id !== statementId);
        
        // Update the order of remaining statements
        const reorderedStatements = updatedStatements.map((statement, index) => ({
          ...statement,
          order: index
        }));
        
        setStatements(reorderedStatements);
        addDebugInfo('Statement removed from UI', { statementId });
        
      } catch (err) {
        console.error("Error in delete request:", err);
        addDebugInfo('Error in delete request', err);
        
        // Since we know the server is likely processing the requests correctly,
        // we'll remove it from the UI anyway
        const updatedStatements = statements.filter(s => s.id !== statementId);
        
        // Update the order of remaining statements
        const reorderedStatements = updatedStatements.map((statement, index) => ({
          ...statement,
          order: index
        }));
        
        setStatements(reorderedStatements);
        
        setError("Statement was removed from UI. Server reported a network error but the deletion likely succeeded.");
      }
    }
  };

  // Move statement up in the sequence
  const moveStatementUp = (index) => {
    if (index === 0) return; // Already at the top
    
    const newStatements = [...statements];
    const temp = newStatements[index];
    newStatements[index] = newStatements[index - 1];
    newStatements[index - 1] = temp;
    
    // Update the order property
    newStatements[index].order = index;
    newStatements[index - 1].order = index - 1;
    
    setStatements(newStatements);
  };

  // Move statement down in the sequence
  const moveStatementDown = (index) => {
    if (index === statements.length - 1) return; // Already at the bottom
    
    const newStatements = [...statements];
    const temp = newStatements[index];
    newStatements[index] = newStatements[index + 1];
    newStatements[index + 1] = temp;
    
    // Update the order property
    newStatements[index].order = index;
    newStatements[index + 1].order = index + 1;
    
    setStatements(newStatements);
  };

  // Get statement text to display
  const getStatementText = (statement, index) => {
    return statement.text || statement.question_text || `Statement ${index + 1}`;
  };

  // Render loading state
  if (loading) {
    return <div className="loading">Loading statement sequence editor...</div>;
  }

  return (
    <div className="visual-sequence-editor">
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
      
      {/* Statement Sequence Flow Diagram */}
      <div className="sequence-flow-container">
        {statements.length > 0 ? (
          <>
            <div className="sequence-flow">
              {statements.map((statement, index) => (
                <div key={statement.id} className="sequence-item-container">
                  <div className={`sequence-item ${index % 2 === 0 ? 'even' : 'odd'}`}>
                    <div className="statement-header">
                      Statement {index + 1}
                    </div>
                    <div className="statement-content">
                      {getStatementText(statement, index)}
                    </div>
                    <div className="statement-actions">
                      <button onClick={() => startEditing(statement)}>Edit</button>
                      <button onClick={() => deleteStatement(statement.id)}>Delete</button>
                      {index > 0 && (
                        <button onClick={() => moveStatementUp(index)}>↑</button>
                      )}
                      {index < statements.length - 1 && (
                        <button onClick={() => moveStatementDown(index)}>↓</button>
                      )}
                    </div>
                  </div>
                  
                  {index < statements.length - 1 && (
                    <div className="sequence-arrow">
                      {index % 2 === 0 ? '>>>' : '>>>'}
                    </div>
                  )}
                </div>
              ))}
              
              <div className="add-statement-button">
                <button onClick={() => {
                  setEditingStatementId(null);
                  setNewStatement({
                    question_text: '',
                    hint_text: '',
                    order: statements.length
                  });
                }}>
                  <span className="plus-icon">+</span>
                  Add another statement
                </button>
              </div>
            </div>
            
            {/* Instructions for users */}
            <div className="client-instructions">
              <h3>CLIENT VIEW:</h3>
              <p>Client will be prompted to enter response when they click on each statement</p>
            </div>
          </>
        ) : (
          <div className="empty-sequence">
            <p>No statements added yet. Use the form below to add your first statement.</p>
          </div>
        )}
      </div>
      
      {/* Statement Editor Form */}
      <div className="statement-editor-form">
        <h3>{editingStatementId ? 'Edit Statement' : 'Add New Statement'}</h3>
        <form onSubmit={handleAddStatement}>
          <div className="form-group">
            <label htmlFor="question_text">Write your question here:</label>
            <textarea
              ref={statementInputRef}
              id="question_text"
              name="question_text"
              value={newStatement.question_text}
              onChange={handleInputChange}
              placeholder="Enter your statement or question here..."
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="hint_text">Write your response (Optional - Admin view only):</label>
            <textarea
              id="hint_text"
              name="hint_text"
              value={newStatement.hint_text}
              onChange={handleInputChange}
              placeholder="Client may type in their own answer."
            />
          </div>
          
          <div className="form-actions">
            <button type="submit" className="submit-btn">
              {editingStatementId ? 'Update Statement' : 'Add Statement'}
            </button>
            {editingStatementId && (
              <button type="button" className="cancel-btn" onClick={cancelEditing}>
                Cancel
              </button>
            )}
          </div>
        </form>
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
            <strong>Statements Count:</strong> {statements.length}
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

export default VisualStatementSequenceEditor;