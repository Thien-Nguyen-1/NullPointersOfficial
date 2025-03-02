import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/MainQuizContainer.css';

const VisualStatementSequenceEditor = () => {
  console.log("VisualStatementSequenceEditor component loading");

  const { moduleId, quizType } = useParams();
  const navigate = useNavigate();
  
  const [module, setModule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statements, setStatements] = useState([]);
  const [taskId, setTaskId] = useState(null);
  const [apiResponse, setApiResponse] = useState(null);
  
  // State for currently selected statement (to show its question)
  const [selectedStatement, setSelectedStatement] = useState(null);

  // New state to track whether we're in "add new statement" mode
  const [isAddingNewStatement, setIsAddingNewStatement] = useState(false);
  
  // Form state for adding/editing statements
  const [newStatement, setNewStatement] = useState({
    statement_text: '',
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
        console.log("🔍 Debugging Module Data Fetch");
        console.log("Module ID:", moduleId);
        console.log("Quiz Type:", quizType);
        
        // Fetch module details
        const moduleResponse = await axios.get(`/api/modules/${moduleId}/`);
        console.log("📦 Module Details:", moduleResponse.data);
        setModule(moduleResponse.data);
        
        // Fetch tasks for this module
        const tasksResponse = await axios.get(`/api/tasks/?moduleID=${moduleId}`);
        console.log("📋 Tasks Response:", tasksResponse.data);
        
        // Find task matching quiz type
        const existingTask = tasksResponse.data.find(task => task.quiz_type === quizType);
        console.log("🎯 Existing Task:", existingTask);
        
        if (existingTask) {
          setTaskId(existingTask.contentID);
          
          // Fetch questions for this task
          const questionsResponse = await axios.get(`/api/quiz/questions/?task_id=${existingTask.contentID}`);
          console.log("❓ Questions Response:", questionsResponse.data);
          
          // Transform questions
          const transformedData = questionsResponse.data.map(item => ({
            ...item,
            statement_text: item.hint_text || "No statement available",
            question_text: item.question_text || "No question available"
          }));
          
          console.log("🔄 Transformed Statements:", transformedData);
          setStatements(transformedData);
        } else {
          console.warn("⚠️ No existing task found for this module and quiz type");
        }
        
      } catch (err) {
        console.error("🚨 Full Error Details:", err);
        console.error("Error Response:", err.response ? err.response.data : "No response");
        setError(`Failed to load data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    
    fetchModuleData();
  }, [moduleId, quizType]);

  useEffect(() => {
    if (statements.length > 0 && !selectedStatement) {
      setSelectedStatement(statements[0].id);
    }
  }, [statements]);
  

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

  // Handle input change for new statement/question form
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStatement({
      ...newStatement,
      [name]: value
    });
  };

  // Select a statement to view/edit its question
  const selectStatement = (statementId) => {
    setSelectedStatement(statementId);
    // Clear the form when selecting a different statement
    if (!editingStatementId) {
      setNewStatement({
        statement_text: '',
        question_text: '',
        hint_text: '',
        order: statements.length
      });
    }
  };

  // Start editing a statement
  const startEditing = (statement) => {
    setEditingStatementId(statement.id);
    setSelectedStatement(statement.id);
    setNewStatement({
      statement_text: statement.statement_text || statement.question_text,
      question_text: statement.question_text || statement.hint_text || '',
      hint_text: statement.hint_text || '',
      order: statement.order
    });
  };

  // Add a new statement
  const prepareAddNewStatement = () => {
    // Explicitly set to add new statement mode
    setIsAddingNewStatement(true);
    
    // Deselect any current statement
    setSelectedStatement(null);
    setEditingStatementId(null);
    
    // Reset the new statement form
    setNewStatement({
      statement_text: '',
      question_text: '',
      hint_text: '',
      order: statements.length
    });
    
    // Focus on the statement input if possible
    setTimeout(() => {
      if (statementInputRef.current) {
        statementInputRef.current.focus();
      }
    }, 100);
  };

  const handleAddStatement = async (e) => {
    e.preventDefault();
    setApiResponse(null);
    
    if (!newStatement.statement_text.trim()) {
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
      
      // Reset add new statement mode after successful addition
      setIsAddingNewStatement(false);
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
      title: `${quizType.charAt(0).toUpperCase() + quizType.slice(1)} for ${module?.title || 'Module'}`,
      moduleID: moduleId,
      description: `Sequence statements for module: ${module?.title || 'Module'}`,
      quiz_type: quizType,
      text_content: `Sequence content for module: ${module?.title || 'Module'}`,
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
        hint_text: newStatement.statement_text,
        order: statements.length
      };

      console.log("Statement creation payload:", statementData);
      addDebugInfo('Creating statement', statementData);

      const statementResponse = await axios.post('/api/quiz/questions/', statementData);
      
      console.log("Statement created successfully:", statementResponse.data);
      addDebugInfo('Statement created', statementResponse.data);

      // Ensure the new statement is immediately reflected in UI
      const createdStatement = {
        ...statementResponse.data,
        statement_text: statementResponse.data.question_text,  // Ensure correct mapping
        question_text: statementResponse.data.hint_text || ''
      };

      setStatements(prevStatements => [...prevStatements, createdStatement]);

      setSelectedStatement(createdStatement.id); // Select the new statement

      setNewStatement({
        statement_text: '',
        question_text: '',
        hint_text: '',
        order: statements.length + 1
      });

      setError(null);
      setEditingStatementId(null);

      setApiResponse({
        status: statementResponse.status,
        data: statementResponse.data
      });

    } catch (err) {
      console.error("Error creating statement:", err);
      addDebugInfo('Error creating statement', err);
      setError(`Statement creation failed: ${err.message}`);
    }
  };
    

    // Update an existing statement
  const updateStatement = async (statementId) => {
    try {
      console.log("Updating statement:", statementId);
      
      const statementData = {
        task_id: taskId,
        question_text: newStatement.statement_text, // The statement goes in question_text
        hint_text: newStatement.question_text,      // The question goes in hint_text
        order: newStatement.order
      };
      
      console.log("Statement update payload:", statementData);
      addDebugInfo('Updating statement', statementData);
      
      // Try using POST instead of PUT
      const statementResponse = await axios.post(`/api/quiz/questions/${statementId}/`, statementData);
      console.log("Statement updated successfully:", statementResponse.data);
      addDebugInfo('Statement updated', statementResponse.data);
      
      // Transform the response to include statement_text
      const updatedStatement = {
        ...statementResponse.data,
        statement_text: statementResponse.data.question_text,
        question_text: statementResponse.data.hint_text || ''
      };
      
      // Update the statement in the list
      setStatements(statements.map(statement => 
        statement.id === statementId ? updatedStatement : statement
      ));
      
      // Reset the form
      setNewStatement({
        statement_text: '',
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
    setIsAddingNewStatement(false);
    setNewStatement({
      statement_text: '',
      question_text: '',
      hint_text: '',
      order: statements.length
    });
    
    // Optionally reselect the last selected statement
    if (statements.length > 0) {
      setSelectedStatement(statements[0].id);
    }
  };

  // Delete a statement
const deleteStatement = async (statementId) => {
  if (window.confirm("Are you sure you want to delete this statement?")) {
    try {
      console.log("Deleting statement:", statementId);
      addDebugInfo('Deleting statement', { statementId });
      
      // Update UI immediately
      const updatedStatements = statements.filter(s => s.id !== statementId);
      const reorderedStatements = updatedStatements.map((statement, index) => ({
        ...statement,
        order: index
      }));
      
      setStatements(reorderedStatements);
      
      // If the deleted statement was selected, select another one
      if (selectedStatement === statementId) {
        setSelectedStatement(reorderedStatements.length > 0 ? reorderedStatements[0].id : null);
      }
      
      // Send delete request to API (without awaiting)
      axios.delete(`/api/quiz/questions/${statementId}/`)
        .then(() => {
          console.log("Statement deleted successfully on server");
          addDebugInfo('Statement deleted on server', { statementId });
        })
        .catch(err => {
          console.error("Error in delete request (UI already updated):", err);
          addDebugInfo('Error in delete request (UI already updated)', err);
        });
      
    } catch (err) {
      console.error("Error in frontend processing:", err);
      addDebugInfo('Error in frontend processing', err);
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


  // Render loading state
  if (loading) {
    return <div className="loading">Loading statement sequence editor...</div>;
  }

  // Get the selected statement
  const getSelectedStatement = () => {
    return statements.find(s => s.id === selectedStatement) || null;
  };
  const currentStatement = getSelectedStatement();

  return (
    <div className="visual-sequence-editor">
      {/* ... [Previous header content remains the same] */}
      
      {/* Statement Sequence Flow Diagram */}
      <div className="sequence-flow-container">
        {statements.length > 0 || isAddingNewStatement ? (
          <>
            <div className="sequence-flow">
              {statements.map((statement, index) => (
                <div key={statement.id} className="sequence-item-container">
                  <div 
                    className={`sequence-item ${index % 2 === 0 ? 'even' : 'odd'} ${selectedStatement === statement.id ? 'selected' : ''}`}
                    onClick={() => {
                      selectStatement(statement.id);
                      setIsAddingNewStatement(false);
                    }}
                  >
                    {/* ... [Previous statement item content remains the same] */}
                  </div>
                  
                  {index < statements.length - 1 && (
                    <div className="sequence-arrow">
                      {index % 2 === 0 ? '>>>' : '>>>'}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Add Statement Button - Always visible */}
              <div className="add-statement-button">
                <button onClick={prepareAddNewStatement}>
                  <span className="plus-icon">+</span>
                  Add another statement
                </button>
              </div>
              
              {/* Optional: Add a clear visual indicator when adding a new statement */}
              {isAddingNewStatement && (
                <div className="adding-new-statement-indicator">
                  <p>Creating a new statement...</p>
                </div>
              )}
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
            <button onClick={prepareAddNewStatement} className="add-first-statement-btn">
              <span className="plus-icon">+</span>
              Add First Statement
            </button>
          </div>
        )}
      </div>
      
      {/* Statement Editor Form */}
      <div className="statement-editor-form">
        <h3>
          {editingStatementId 
            ? 'Edit Statement & Question' 
            : isAddingNewStatement
              ? 'Add New Statement & Question'
              : currentStatement 
                ? `Edit Question for "${currentStatement.statement_text}"` 
                : 'Add New Statement & Question'}
        </h3>
        
        <form onSubmit={handleAddStatement}>
          {/* Statement Text Field - Show when adding new, editing, or no current statement */}
          {(isAddingNewStatement || editingStatementId || !currentStatement) && (
            <div className="form-group">
              <label htmlFor="statement_text">Write your statement here:</label>
              <textarea
                ref={statementInputRef}
                id="statement_text"
                name="statement_text"
                value={newStatement.statement_text}
                onChange={handleInputChange}
                placeholder="Enter your statement here..."
                required
              />
            </div>
          )}
          
          {/* Question Field - Always show */}
          <div className="form-group">
            <label htmlFor="question_text">Write your question here:</label>
            <textarea
              id="question_text"
              name="question_text"
              value={newStatement.question_text}
              onChange={handleInputChange}
              placeholder="Enter your question here..."
              required={editingStatementId || isAddingNewStatement}
            />
          </div>
          
          {/* Response Hint Field - Always show */}
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
            {editingStatementId ? (
              <>
                <button type="submit" className="submit-btn">
                  Update Statement & Question
                </button>
                <button type="button" className="cancel-btn" onClick={cancelEditing}>
                  Cancel
                </button>
              </>
            ) : isAddingNewStatement ? (
              <>
                <button type="submit" className="submit-btn">
                  Add Statement
                </button>
                <button type="button" className="cancel-btn" onClick={cancelEditing}>
                  Cancel
                </button>
              </>
            ) : currentStatement ? (
              <button type="button" className="submit-btn" onClick={() => startEditing(currentStatement)}>
                Edit Selected Statement
              </button>
            ) : (
              <button type="submit" className="submit-btn">
                Add Statement
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Debug Panel */}
      {debug.showDebug && (
        <div className="debug-panel">
          <h3>Debug Info</h3>
          {debug.apiCalls.length === 0 ? (
            <p>No API calls logged yet.</p>
          ) : (
            <ul>
              {debug.apiCalls.map((log, index) => (
                <li key={index}>
                  <strong>{log.timestamp}</strong>: {log.action}
                  <pre>{log.data}</pre>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Debug Toggle Button */}
      <button className="debug-toggle" onClick={toggleDebug}>
        {debug.showDebug ? "Hide Debug Info" : "Show Debug Info"}
      </button>

    </div>
  );
};

export default VisualStatementSequenceEditor;