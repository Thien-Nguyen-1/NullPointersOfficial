import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import { FaTrash } from "react-icons/fa";
import "../../styles/MainQuizContainer.css";
import "./VisualFlowChartQuiz.css";

// Constants for placeholder text
const STATEMENT_PLACEHOLDER = "New statement - click to edit";
const QUESTION_PLACEHOLDER = "Enter question here";

const VisualFlowChartQuiz = forwardRef((props, ref) => {
  const { moduleId, quizType, initialQuestions = [], onUpdateQuestions } = props;
  const [statements, setStatements] = useState([]);
  const [selectedStatement, setSelectedStatement] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true); // Track initialization state
  const initializedRef = useRef(false); // Use a ref to track if we've already initialized
  const lastInitialQuestionsLength = useRef(0); // Track the last initialQuestions length
  
  // Debug logging for props
  console.log("[DEBUG] Component rendering with props:", { 
    moduleId, 
    quizType, 
    initialQuestionsLength: initialQuestions?.length,
    onUpdateQuestionsExists: !!onUpdateQuestions
  });

  // Log the raw initialQuestions to inspect field names
  if (initialQuestions && initialQuestions.length > 0) {
    console.log("[DEBUG] Raw initialQuestions:", JSON.stringify(initialQuestions));
  }

  // Expose getQuestions method for parent component to access
  useImperativeHandle(ref, () => ({
    getQuestions: () => {
      console.log("[DEBUG] getQuestions called, current statements:", statements);
      
      // Filter out empty statements and format for API compatibility
      const formattedQuestions = statements
        .filter(statement => {
          // Don't count placeholder text as valid content
          const textIsValid = statement.text && 
                             statement.text.trim() !== "" && 
                             statement.text !== STATEMENT_PLACEHOLDER;
                             
          const questionIsValid = statement.question && 
                                 statement.question.trim() !== "" && 
                                 statement.question !== QUESTION_PLACEHOLDER;
          
          console.log(`[DEBUG] Statement ${statement.id} validity check - text: "${statement.text}", question: "${statement.question}", isValid: ${textIsValid && questionIsValid}`);
          return textIsValid && questionIsValid;
        })
        .map((statement, index) => {
          // Format question for API with the exact field names expected
          const formattedQuestion = {
            id: statement.id,
            question_text: statement.text || "",
            hint_text: statement.question || "",
            order: index
          };
          console.log(`[DEBUG] Formatted question from statement ${statement.id}:`, formattedQuestion);
          return formattedQuestion;
        });
      
      console.log("[DEBUG] Returning formatted questions:", formattedQuestions);
      return formattedQuestions;
    },

    setQuestions: (newQuestions) => {
      // Normalize and format incoming questions
      const formattedStatements = newQuestions.map(q => ({
        id: q.id || Date.now() + Math.random(),
        text: q.question_text || q.text || "",
        question: q.hint_text || q.question || "",
        answer: "Sample Answer",
        order: q.order || 0
      }));
      
      setStatements(formattedStatements);
      
      // Auto-select the first statement if available
      if (formattedStatements.length > 0) {
        setSelectedStatement(formattedStatements[0]);
      }
    }
  }), [statements]);

  // Initialize statements from initialQuestions - only run once or when initialQuestions changes
  useEffect(() => {
    // Skip during deletion
    if (isDeleting) {
      console.log("[DEBUG] Skipping initialQuestions effect during deletion");
      return;
    }
    
    // Skip if we've already initialized with this exact set of questions
    const initialCount = initialQuestions?.length || 0;
    if (initializedRef.current && initialCount === lastInitialQuestionsLength.current && statements.length > 0) {
      console.log("[DEBUG] Skipping initialization - already initialized with the same questions");
      return;
    }
    
    console.log("[DEBUG] initialQuestions effect triggered, length:", initialQuestions?.length);
    
    if (initialQuestions && initialQuestions.length > 0) {
      // Detailed logging of initialQuestions data
      initialQuestions.forEach((q, i) => {
        console.log(`[DEBUG] InitialQuestion ${i} ALL FIELDS:`, q);
        console.log(`[DEBUG] Fields available: ${Object.keys(q).join(', ')}`);
      });
      
      // Format questions for this component's state structure
      const formattedStatements = initialQuestions.map(q => {
        // Handle all possible field names from the API
        const formattedStatement = {
          id: q.id || Date.now() + Math.random(),
          text: q.text || q.question_text || "", 
          question: q.hint || q.hint_text || q.question || "",
          answer: "Sample Answer",
          order: q.order || 0
        };
        
        console.log(`[DEBUG] Formatted statement from API: ID=${formattedStatement.id}, text="${formattedStatement.text}", question="${formattedStatement.question}"`);
        return formattedStatement;
      });
      
      console.log("[DEBUG] All formatted statements:", formattedStatements);
      
      // Update the ref to track that we've initialized with this length
      lastInitialQuestionsLength.current = initialCount;
      
      // Set the statements
      setStatements(formattedStatements);
      
      // Auto-select the first statement if available and no statement is selected
      if (formattedStatements.length > 0 && !selectedStatement) {
        setSelectedStatement(formattedStatements[0]);
      }
      
      // Mark as initialized
      initializedRef.current = true;
      setIsInitializing(false);
    } else if (isInitializing && statements.length === 0) {
      // Initialize with a default empty statement if nothing exists
      const defaultStatement = { 
        id: Date.now(), 
        text: "", 
        question: "", 
        answer: "Sample Answer"
      };
      
      console.log("[DEBUG] Creating default statement:", defaultStatement);
      setStatements([defaultStatement]);
      setSelectedStatement(defaultStatement);
      
      // Mark as initialized
      initializedRef.current = true;
      setIsInitializing(false);
      lastInitialQuestionsLength.current = 0;
    } else {
      // Just mark as initialized if we don't need to create statements
      initializedRef.current = true;
      setIsInitializing(false);
    }
  }, [initialQuestions, isDeleting, statements.length, isInitializing, selectedStatement]);

  // Update parent component when statements change (but not during deletion)
  useEffect(() => {
    // Skip updates during deletion, initialization, or if no update function
    if (isDeleting || isInitializing || !onUpdateQuestions) {
      return;
    }
    
    // Ensure we have statements to update
    if (statements.length === 0) {
      return;
    }
    
    // Use a debounced update to prevent too frequent API calls
    const timeoutId = setTimeout(() => {
      console.log("[DEBUG] statements change detected:", statements.length);
      
      // Format statements as questions for API compatibility
      const formattedQuestions = statements
        .filter(statement => {
          const textIsValid = statement.text && 
                           statement.text.trim() !== "" && 
                           statement.text !== STATEMENT_PLACEHOLDER;
                           
          const questionIsValid = statement.question && 
                               statement.question.trim() !== "" && 
                               statement.question !== QUESTION_PLACEHOLDER;
                               
          return textIsValid && questionIsValid;
        })
        .map((statement, index) => ({
          id: statement.id,
          question_text: statement.text || "",
          hint_text: statement.question || "",
          order: index
        }));
      
      if (formattedQuestions.length > 0) {
        console.log("[DEBUG] Updating parent with valid questions:", formattedQuestions);
        onUpdateQuestions(formattedQuestions);
      }
    }, 100); // Small delay to batch changes
    
    return () => {
      clearTimeout(timeoutId);
    };
  }, [statements, onUpdateQuestions, isDeleting, isInitializing]);

  // Add a new statement
  const addStatement = () => {
    const newStatement = { 
      id: Date.now(), 
      text: "", 
      question: "", 
      answer: "Sample Answer" 
    };
    
    console.log("[DEBUG] Adding new statement:", newStatement);
    setStatements(prevStatements => [...prevStatements, newStatement]);
    setSelectedStatement(newStatement);
  };

  // Check if text is empty or placeholder
  const isEmptyOrPlaceholder = (text, placeholder) => {
    return !text || text.trim() === "" || text === placeholder;
  };

  // Update a statement
  const updateStatement = (id, field, value) => {
    console.log(`[DEBUG] Updating statement ${id}, field: ${field}, value: "${value}"`);
    
    // Update both statements array and selected statement
    setStatements(prevStatements => {
      const updatedStatements = prevStatements.map(s => 
        s.id === id ? { ...s, [field]: value } : s
      );
      console.log("[DEBUG] Updated statements after change:", updatedStatements);
      return updatedStatements;
    });
    
    // Update selected statement if that's the one being modified
    if (selectedStatement && selectedStatement.id === id) {
      setSelectedStatement(prevSelected => ({ ...prevSelected, [field]: value }));
    }
  };

  // Delete a statement
  const deleteStatement = (id) => {
    // Check if we have enough statements
    if (statements.length <= 1) {
      alert("You must have at least one statement in the flowchart. Add another statement before deleting this one.");
      return;
    }
    
    // Confirm deletion
    if (window.confirm("Are you sure you want to delete this statement?")) {
      // First set the deleting flag to true to prevent any other state updates
      setIsDeleting(true);
      
      try {
        // Create a copy of the statements without the deleted one
        const remainingStatements = statements.filter(s => s.id !== id);
        
        // If we're deleting the currently selected statement, select another one
        if (selectedStatement && selectedStatement.id === id) {
          setSelectedStatement(remainingStatements.length > 0 ? remainingStatements[0] : null);
        }
        
        // Update the statements array
        setStatements(remainingStatements);
        
        console.log(`[DEBUG] Statement ${id} deleted successfully`);
      } catch (error) {
        console.error("[ERROR] Error during deletion:", error);
      }
      
      // Reset deleting flag after a delay to ensure state updates are processed
      setTimeout(() => {
        setIsDeleting(false);
      }, 200);
    }
  };

  // Save changes to a statement
  const saveChanges = () => {
    if (!selectedStatement) return;
    
    // Validate statement before saving
    if (isEmptyOrPlaceholder(selectedStatement.text, STATEMENT_PLACEHOLDER)) {
      alert("Statement text cannot be empty. Please enter a statement.");
      return;
    }
    
    if (isEmptyOrPlaceholder(selectedStatement.question, QUESTION_PLACEHOLDER)) {
      alert("Question cannot be empty. Please enter a question.");
      return;
    }
    
    console.log("[DEBUG] Saving changes:", selectedStatement);
    
    // Update the statements array with the saved changes
    setStatements(prevStatements => {
      // Check if the statement exists in the array
      const statementExists = prevStatements.some(s => s.id === selectedStatement.id);
      
      if (!statementExists) {
        console.log("[DEBUG] Statement not found in array, adding it");
        return [...prevStatements, selectedStatement];
      } else {
        // Update the existing statement
        return prevStatements.map(s => 
          s.id === selectedStatement.id ? {...selectedStatement} : s
        );
      }
    });
    
    alert("Changes saved successfully!");
  };

  // Validation helper
  const isStatementValid = (statement) => {
    return statement && 
      !isEmptyOrPlaceholder(statement.text, STATEMENT_PLACEHOLDER) &&
      !isEmptyOrPlaceholder(statement.question, QUESTION_PLACEHOLDER);
  };

  // Check if field is empty for validation
  const isFieldEmpty = (statement, field) => {
    if (!statement) return false;
    
    const value = statement[field];
    const placeholder = field === 'text' ? STATEMENT_PLACEHOLDER : QUESTION_PLACEHOLDER;
    
    return isEmptyOrPlaceholder(value, placeholder);
  };

  // While deleting or initializing, show a temporary loading state
  if (isDeleting || isInitializing) {
    return (
      <div className="visual-sequence-editor">
        <div className="loading-state">
          <p>{isDeleting ? "Updating sequence..." : "Loading sequence..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="visual-sequence-editor">
      <div className="sequence-flow">
        {statements.length > 0 ? (
          statements.map((statement, index) => (
            <React.Fragment key={`statement-${statement.id}-${index}`}>
              {index > 0 && (
                <div className={`sequence-arrow ${index % 2 === 0 ? "even-arrow" : "odd-arrow"}`}>
                  &#x276D;&#x276D;&#x276D;
                </div>
              )}
              <div
                className={`sequence-item ${index % 2 === 0 ? "even-editor" : "odd-editor"} ${selectedStatement?.id === statement.id ? "selected" : ""}`}
              >
                <div 
                  className="statement-content-wrapper"
                  onClick={() => setSelectedStatement(statement)}
                >
                  <p className="statement-content">
                    {statement.text || STATEMENT_PLACEHOLDER}
                  </p>
                </div>
                
                {/* Delete button directly in sequence item */}
                <button 
                  className="delete-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteStatement(statement.id);
                  }}
                  disabled={statements.length <= 1}
                >
                  ×
                </button>
              </div>
            </React.Fragment>
          ))
        ) : (
          <div className="no-statements-message">
            <p>No statements added yet. Add a statement using the + button below.</p>
          </div>
        )}
        <div className="add-statement-container" onClick={addStatement}>
          <button className="add-statement-button">
            <div className="plus-icon">+</div>
          </button>
          <p className="add-statement-text">Add another statement</p>
        </div>
      </div>
      
      {selectedStatement && (
        <div
          className={`statement-editor-form ${statements.findIndex(s => s.id === selectedStatement.id) % 2 === 0 ? "even-editor" : "odd-editor"}`}
        >
          <h3>Edit Statement</h3>
          <div className="required-field">
            <input
              className="form-group"
              value={selectedStatement.text || ""}
              onChange={(e) => {
                const newValue = e.target.value;
                updateStatement(selectedStatement.id, "text", newValue);
              }}
              placeholder={STATEMENT_PLACEHOLDER}
            />
            {isFieldEmpty(selectedStatement, 'text') && 
              <div className="validation-error">Statement is required</div>
            }
          </div>
          
          <h3>Question</h3>
          <div className="required-field">
            <input
              className="form-group"
              value={selectedStatement.question || ""}
              onChange={(e) => {
                const newValue = e.target.value;
                updateStatement(selectedStatement.id, "question", newValue);
              }}
              placeholder={QUESTION_PLACEHOLDER}
            />
            {isFieldEmpty(selectedStatement, 'question') && 
              <div className="validation-error">Question is required</div>
            }
          </div>
          
          <h3>Answer (View Only)</h3>
          <input 
            className="form-group" 
            value={selectedStatement.answer || "Sample Answer"} 
            readOnly 
          />
          <div className="button-group">
            <button 
              onClick={saveChanges} 
              className="large-grey-btn"
              disabled={!isStatementValid(selectedStatement)}
            >
              Save
            </button>
            <button 
              onClick={() => deleteStatement(selectedStatement.id)} 
              className="trash-button"
              disabled={statements.length <= 1}
            >
              <FaTrash size={20} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

export default VisualFlowChartQuiz;