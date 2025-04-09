import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import "./FillInTheBlanks.css"; // Import the CSS file
import { FaTrash, FaPencilAlt } from "react-icons/fa";

const AdminQuestionForm = ({ onSubmit }) => {
  const [question, setQuestion] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    const blankMatches = question.match(/\b____\b/g) || []; // Ensures only exact '____' is counted
    const blankCount = blankMatches.length;

    if (blankCount === 0) {
      setError("Each question must contain at least one blank space (____). Please adjust your input.");
      return;
    }

    // Check if any blank is not exactly '____'
    const invalidBlanks = question.match(/\b_+\b/g) || [];
    if (invalidBlanks.some(blank => blank !== "____")) {
      setError("Blanks must be exactly 4 underscores (____) with no more or less.");
      return;
    }

    setError("");
    onSubmit(question.trim()); // Ensure question doesn't have unnecessary spaces
    setQuestion("");
  };

  return (
    <div className="fitb-module-container">
      <h2 className="fitb-module-title">Add Question</h2>
      {error && <p className="fitb-error-message">{error}</p>}
      <div className="fitb-input-container">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter question with (four underscore) ____ for blanks"
          className="fitb-input-textarea"
        />
        <button onClick={handleSubmit} className="fitb-btn-add-question">
          Add Question
        </button>
      </div>
    </div>
  );
};

const UserFillInTheBlanks = ({ question, index, onDelete, onEdit }) => {
  // Get question text from either string or object format
  const questionText = typeof question === 'object' ? question.question_text : question || '';
  
  const parts = questionText.split("____");
  const [answers, setAnswers] = useState(Array(parts.length - 1).fill(""));
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(questionText);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    // Update when question prop changes
    setEditedQuestion(typeof question === 'object' ? question.question_text : question || '');
  }, [question]);

  const handleChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditError("");
  };

  const handleSave = () => {
    // Validate blanks before saving
    const blankMatches = editedQuestion.match(/\b____\b/g) || [];
    const blankCount = blankMatches.length;

    if (blankCount === 0) {
      setEditError("Each question must contain at least one blank space (____). Please adjust your input.");
      return;
    }

    // Check if any blank is not exactly '____'
    const invalidBlanks = editedQuestion.match(/\b_+\b/g) || [];
    if (invalidBlanks.some(blank => blank !== "____")) {
      setEditError("Blanks must be exactly 4 underscores (____) with no more or less.");
      return;
    }

    setEditError("");
    if (typeof question === 'object') {
      // If question is an object, preserve its properties
      const updatedQuestion = {
        ...question,
        question_text: editedQuestion
      };
      onEdit(index, updatedQuestion);
    } else {
      // Otherwise just update the text
      onEdit(index, editedQuestion);
    }
    setIsEditing(false);
  };

  return (
    <div className="fitb-question-box">
      <div className="fitb-question-header">
        <h2 className="fitb-question-number">Question {index + 1}</h2>
        <div className="fitb-editor-icon-container">
          {isEditing ? (
            <button className="fitb-save-button" onClick={handleSave}>Save</button>
          ) : (
            <FaPencilAlt className="fitb-edit-icon" onClick={handleEdit} />
          )}
          <FaTrash className="fitb-delete-icon" onClick={() => onDelete(index)} />
        </div>
      </div>
      <h3 className="fitb-question-subtitle">Fill in the Blanks</h3>
      {editError && <p className="fitb-error-message">{editError}</p>}
      {isEditing ? (
        <textarea
          value={editedQuestion}
          onChange={(e) => setEditedQuestion(e.target.value)}
          className="fitb-edit-textarea"
        />
      ) : (
        <div className="fitb-question-content">
          <p className="fitb-question-preview">
            {parts.map((part, idx) => (
              <span key={idx}>
                {part}
                {idx < parts.length - 1 && (
                  <input
                    type="text"
                    value={answers[idx]}
                    onChange={(e) => handleChange(idx, e.target.value)}
                    className="fitb-input-field"
                  />
                )}
              </span>
            ))}
          </p>
        </div>
      )}
    </div>
  );
};

const VisualFillTheFormEditor = forwardRef((props, ref) => {
  const { moduleId, quizType, initialQuestions = [], onUpdateQuestions } = props;
  const [questions, setQuestions] = useState([]);

  // Load initial questions if provided
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      console.log("[FITB] Received initialQuestions:", initialQuestions);
      
      // Ensure questions are in a consistent object format
      const formattedQuestions = initialQuestions.map(q => {
        if (typeof q === 'string') {
          return {
            id: `temp-${Date.now()}-${Math.random()}`,
            question_text: q,
            hint_text: ""
          };
        } else {
          return {
            id: q.id || `temp-${Date.now()}-${Math.random()}`,
            question_text: q.question_text || q.text || '',
            hint_text: q.hint_text || q.hint || '',
            order: q.order || 0
          };
        }
      });
      
      console.log("[FITB] Formatted questions:", formattedQuestions);
      setQuestions(formattedQuestions);
    }
  }, [initialQuestions]);

  // Update parent component when questions change
  useEffect(() => {
    if (onUpdateQuestions) {
      const formattedQuestions = questions.map((question, index) => {
        if (typeof question === 'string') {
          return {
            id: `temp-${Date.now()}-${index}`,
            question_text: question,
            hint_text: "",
            order: index
          };
        } else {
          return {
            id: question.id || `temp-${Date.now()}-${index}`,
            question_text: question.question_text || '',
            hint_text: question.hint_text || "",
            order: index
          };
        }
      });
      
      onUpdateQuestions(formattedQuestions);
    }
  }, [questions, onUpdateQuestions]);

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    getQuestions: () => {
      console.log("[FITB] Getting questions, current state:", questions);
      
      // Format questions for API compatibility
      const formattedQuestions = questions.map((question, index) => {
        if (typeof question === 'string') {
          return {
            id: `temp-${Date.now()}-${index}`,
            question_text: question,
            hint_text: "",
            order: index
          };
        } else {
          return {
            id: question.id || `temp-${Date.now()}-${index}`,
            question_text: question.question_text || '',
            hint_text: question.hint_text || "",
            order: index
          };
        }
      });
      
      console.log("[FITB] Returning formatted questions:", formattedQuestions);
      return formattedQuestions;
    },
    setQuestions: (newQuestions) => {
      console.log("[FITB] Setting questions:", newQuestions);
      
      // Normalize the new questions
      const formattedQuestions = newQuestions.map(q => {
        if (typeof q === 'string') {
          return {
            id: `temp-${Date.now()}-${Math.random()}`,
            question_text: q,
            hint_text: ""
          };
        } else {
          return {
            id: q.id || `temp-${Date.now()}-${Math.random()}`,
            question_text: q.question_text || q.text || '',
            hint_text: q.hint_text || q.hint || '',
            order: q.order || 0
          };
        }
      });
      
      setQuestions(formattedQuestions);
    }
  }));

  const addQuestion = (newQuestion) => {
    // Store question as object instead of string
    const newQuestionObj = {
      id: `temp-${Date.now()}-${questions.length}`,
      question_text: newQuestion,
      hint_text: "",
      order: questions.length
    };
    
    console.log("[FITB] Adding question:", newQuestionObj);
    setQuestions(prevQuestions => [...prevQuestions, newQuestionObj]);
  };

  const deleteQuestion = (index) => {
    console.log("[FITB] Deleting question at index:", index);
    setQuestions(prevQuestions => prevQuestions.filter((_, i) => i !== index));
  };

  const editQuestion = (index, updatedQuestion) => {
    console.log("[FITB] Editing question at index:", index, updatedQuestion);
    
    setQuestions(prevQuestions => {
      const newQuestions = [...prevQuestions];
      
      // If we're editing a question object, update it while preserving ID
      if (typeof prevQuestions[index] === 'object' && typeof updatedQuestion === 'object') {
        newQuestions[index] = {
          ...updatedQuestion,
          id: prevQuestions[index].id || `temp-${Date.now()}-${index}`
        };
      } 
      // If updating from object to string
      else if (typeof prevQuestions[index] === 'object' && typeof updatedQuestion === 'string') {
        newQuestions[index] = {
          id: prevQuestions[index].id || `temp-${Date.now()}-${index}`,
          question_text: updatedQuestion,
          hint_text: "",
          order: index
        };
      }
      // If updating from string to object
      else if (typeof prevQuestions[index] === 'string' && typeof updatedQuestion === 'object') {
        newQuestions[index] = {
          id: updatedQuestion.id || `temp-${Date.now()}-${index}`,
          question_text: updatedQuestion.question_text || "",
          hint_text: updatedQuestion.hint_text || "",
          order: index
        };
      }
      // If updating string to string
      else {
        newQuestions[index] = {
          id: `temp-${Date.now()}-${index}`,
          question_text: updatedQuestion,
          hint_text: "",
          order: index
        };
      }
      
      return newQuestions;
    });
  };

  return (
    <div className="fitb-editor-container">
      <AdminQuestionForm onSubmit={addQuestion} />
      <div className="fitb-questions-list">
        {questions.length > 0 ? (
          questions.map((question, index) => (
            <UserFillInTheBlanks 
              key={`${moduleId}-question-${index}`}
              index={index} 
              question={question} 
              onDelete={deleteQuestion} 
              onEdit={editQuestion} 
            />
          ))
        ) : (
          <div className="fitb-no-questions-message">
            <p>No questions added yet. Add a question using the form above.</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default VisualFillTheFormEditor;