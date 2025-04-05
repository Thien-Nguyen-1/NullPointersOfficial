import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import "./FillInTheBlanks.css"; // Import the new CSS file
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
          placeholder="Enter question with ____ for blanks"
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
  // Add a check to make sure question is a string and not undefined
  const questionText = typeof question === 'string' ? question : '';
  const parts = questionText.split("____");
  const [answers, setAnswers] = useState(Array(parts.length - 1).fill(""));
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(questionText);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    // Update when question prop changes
    setEditedQuestion(typeof question === 'string' ? question : '');
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
    onEdit(index, editedQuestion);
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
          {/* Display the question text directly */}
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

  useEffect(() => {
    if (onUpdateQuestions) {
      const formattedQuestions = questions.map((question, index) => ({
        id: Date.now() + index, // Temporary ID for UI
        question_text: question || '',
        hint_text: "", // Fill-in-the-blanks doesn't use hints
        order: index
      }));
      
      onUpdateQuestions(formattedQuestions);
    }
  }, [questions, onUpdateQuestions]);

  
  // Expose getQuestions method to parent component
  useImperativeHandle(ref, () => ({
    getQuestions: () => {
      // Format questions for API compatibility
      return questions.map((question, index) => ({
        id: Date.now() + index, // Temporary ID for UI
        question_text: question || '',
        hint_text: "", // Fill-in-the-blanks doesn't use hints
        order: index
      }));
    },
    setQuestions: (newQuestions) => {
      // Normalize the new questions 
      const formattedQuestions = newQuestions.map(q => 
        q.question_text || q.text || q
      );
      setQuestions(formattedQuestions);
    }
  }));


  // Load initial questions if provided
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      // Format questions for consistency - convert from API format to component format
      const formattedQuestions = initialQuestions.map(q => {
        const questionText = q.question_text || q.text || '';
        return questionText;
      });
      
      setQuestions(formattedQuestions);
    } else {
      setQuestions([]);
    }
  }, [initialQuestions]);

  const addQuestion = (newQuestion) => {
    setQuestions(prevQuestions => [...prevQuestions, newQuestion]);
  };

  const deleteQuestion = (index) => {
    setQuestions(prevQuestions => prevQuestions.filter((_, i) => i !== index));
  };

  const editQuestion = (index, newQuestion) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = newQuestion;
    setQuestions(updatedQuestions);
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