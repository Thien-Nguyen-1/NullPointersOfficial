import React, { useState, useEffect, useRef } from 'react';
import '../../styles/MainQuizContainer.css';

const VisualFlashcardEditor = ({ moduleId, quizType, onUpdateQuestions, initialQuestions = [] }) => {
  const [questions, setQuestions] = useState([]);
  const [flippedCardId, setFlippedCardId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state for adding new questions
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    hint_text: '',
    order: 0
  });

  const questionInputRef = useRef(null);

  // Load initial questions if provided
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      // Format questions for consistency
      const formattedQuestions = initialQuestions.map(q => ({
        id: q.id || Date.now() + Math.random(),
        question_text: q.question_text || q.text || "",
        hint_text: q.hint_text || q.hint || "",
        order: q.order || 0
      }));
      
      setQuestions(formattedQuestions);
    }
  }, [initialQuestions]);

  // Focus on the input field when editing
  useEffect(() => {
    if (isEditing && questionInputRef.current) {
      questionInputRef.current.focus();
    }
  }, [isEditing]);

  // Update parent component when questions change
  useEffect(() => {
    if (onUpdateQuestions) {
      onUpdateQuestions(questions);
    }
  }, [questions, onUpdateQuestions]);

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
  const handleAddQuestion = (e) => {
    e.preventDefault();
    
    if (!newQuestion.question_text.trim()) {
      setError("Question text is required!");
      return;
    }
    
    // Create a new question object with a temporary ID
    const newQuestionObj = {
      id: Date.now(), // Temporary ID for UI purposes
      question_text: newQuestion.question_text,
      hint_text: newQuestion.hint_text || '',
      order: questions.length
    };
    
    // Add the question to the list
    setQuestions([...questions, newQuestionObj]);
    
    // Reset the form
    setNewQuestion({
      question_text: '',
      hint_text: '',
      order: questions.length + 1
    });
    
    // Clear any previous errors
    setError(null);
    setIsEditing(false);
  };

  // Preview a question
  const previewQuestion = (question) => {
    handleFlip(question.id);
  };

  // Delete a question
  const deleteQuestion = (questionId) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      setQuestions(questions.filter(q => q.id !== questionId));
    }
  };

  // Edit a question
  const editQuestion = (question) => {
    setNewQuestion({
      question_text: question.question_text,
      hint_text: question.hint_text || '',
      order: question.order
    });
    setIsEditing(true);
    
    // Remove the question from the list (will be re-added on save)
    setQuestions(questions.filter(q => q.id !== question.id));
  };

  return (
    <div className="visual-flashcard-editor">
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
                  {question.question_text}
                </div>
                <div className="actions">
                  <button onClick={(e) => { e.stopPropagation(); previewQuestion(question); }}>Preview</button>
                  <button onClick={(e) => { e.stopPropagation(); editQuestion(question); }}>Edit</button>
                  <button onClick={(e) => { e.stopPropagation(); deleteQuestion(question.id); }}>Delete</button>
                </div>
              </div>
              <div className="flashcard-back">
                <h3>Hint/Answer</h3>
                <div className="flashcard-content">
                  {question.hint_text || 'No hint provided.'}
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
    </div>
  );
};

export default VisualFlashcardEditor;