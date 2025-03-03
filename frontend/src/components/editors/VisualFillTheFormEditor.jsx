import React, { useState, useEffect } from "react";
import "../../styles/MainQuizContainer.css";
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
    <div className="module-container">
      <h2 className="module-title">Add Question</h2>
      {error && <p className="error-message">{error}</p>}
      <div className="input-container">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Enter question with ____ for blanks"
          className="input-textarea wide-input"
        />
        <button onClick={handleSubmit} className="btn-add-question green-button larger-rounded-button">
          Add Question
        </button>
      </div>
    </div>
  );
};

const UserFillInTheBlanks = ({ question, index, onDelete, onEdit }) => {
  const parts = question.split("____");
  const [answers, setAnswers] = useState(Array(parts.length - 1).fill(""));
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState(question);

  const handleChange = (index, value) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    onEdit(index, editedQuestion);
    setIsEditing(false);
  };

  return (
    <div className="question-box">
      <div className="question-header">
        <h2 className="question-number">Question {index + 1}</h2>
        <div className="icon-container">
          {isEditing ? (
            <button className="save-button" onClick={handleSave}>Save</button>
          ) : (
            <FaPencilAlt className="edit-icon" onClick={handleEdit} />
          )}
          <FaTrash className="delete-icon" onClick={() => onDelete(index)} />
        </div>
      </div>
      <h3 className="question-subtitle">Fill in the Blanks</h3>
      {isEditing ? (
        <textarea
          value={editedQuestion}
          onChange={(e) => setEditedQuestion(e.target.value)}
          className="edit-textarea"
        />
      ) : (
        <p className="question-content">
          {parts.map((part, idx) => (
            <span key={idx}>
              {part}
              {idx < answers.length && (
                <input
                  type="text"
                  value={answers[idx]}
                  onChange={(e) => handleChange(idx, e.target.value)}
                  className="input-field"
                />
              )}
            </span>
          ))}
        </p>
      )}
    </div>
  );
};

const VisualFillTheFormEditor = ({ moduleId, quizType, onUpdateQuestions }) => {
  const [questions, setQuestions] = useState([]);

  // Update parent component when questions change
  useEffect(() => {
    if (onUpdateQuestions) {
      // Format questions for API compatibility
      const formattedQuestions = questions.map((question, index) => ({
        id: Date.now() + index, // Temporary ID for UI
        question_text: question,
        hint_text: "", // Fill-in-the-blanks doesn't use hints
        order: index
      }));
      
      onUpdateQuestions(formattedQuestions);
    }
  }, [questions, onUpdateQuestions]);

  const addQuestion = (newQuestion) => {
    setQuestions([...questions, newQuestion]);
  };

  const deleteQuestion = (index) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const editQuestion = (index, newQuestion) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = newQuestion;
    setQuestions(updatedQuestions);
  };

  return (
    <div className="editor-container">
      <AdminQuestionForm onSubmit={addQuestion} />
      <div className="questions-list two-column-grid">
        {questions.map((question, index) => (
          <UserFillInTheBlanks 
            key={index} 
            index={index} 
            question={question} 
            onDelete={deleteQuestion} 
            onEdit={editQuestion} 
          />
        ))}
      </div>
    </div>
  );
};

export default VisualFillTheFormEditor;