import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import styles from '../../styles/VisualFlashcardEditor.module.css';

const VisualFlashcardEditor = forwardRef((props, ref) => {
  const { moduleId, quizType, initialQuestions = [], onUpdateQuestions } = props;
  const [questions, setQuestions] = useState([]);
  const [flippedCardId, setFlippedCardId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [activeEditingCard, setActiveEditingCard] = useState(null);
  const [error, setError] = useState(null);
  
  // Form state for adding new questions
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    hint_text: '',
    order: 0
  });

  const questionInputRef = useRef(null);
  const hintInputRef = useRef(null);

  // Expose the getQuestions method to the parent component
  useImperativeHandle(ref, () => ({
    getQuestions: () => {
      return questions;
    }
  }));

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
    if (isEditing && !activeEditingCard && questionInputRef.current) {
      questionInputRef.current.focus();
    }
  }, [isEditing, activeEditingCard]);

  // Update parent component when questions change - only if onUpdateQuestions is provided
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

  // Handle question edit in-place
  const handleQuestionTextEdit = (questionId, value) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, question_text: value } : q
    ));
  };
  
  // Handle hint edit in-place
  const handleHintTextEdit = (questionId, value) => {
    setQuestions(questions.map(q => 
      q.id === questionId ? { ...q, hint_text: value } : q
    ));
  };

  // Handle flipping a card
  const handleFlip = (id) => {
    if (activeEditingCard !== id) {
      setFlippedCardId(flippedCardId === id ? null : id);
    }
  };

  // Start editing a specific card
  const startEditingCard = (id, event) => {
    if (event) {
      event.stopPropagation();
    }
    setActiveEditingCard(id);
  };

  // Stop editing a specific card
  const stopEditingCard = (event) => {
    if (event) {
      event.stopPropagation();
    }
    setActiveEditingCard(null);
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
  const previewQuestion = (question, event) => {
    if (event) {
      event.stopPropagation();
    }
    if (activeEditingCard !== question.id) {
      handleFlip(question.id);
    }
  };

  // Delete a question
  const deleteQuestion = (questionId, event) => {
    if (event) {
      event.stopPropagation();
    }
    if (window.confirm("Are you sure you want to delete this question?")) {
      setQuestions(questions.filter(q => q.id !== questionId));
      if (activeEditingCard === questionId) {
        setActiveEditingCard(null);
      }
    }
  };

  // Create a new blank card to edit
  const createNewCard = () => {
    setIsEditing(true);
    setActiveEditingCard(null);
  };

  // Handle keydown events (like Enter, Escape)
  const handleKeyDown = (e, id, field, nextRef) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (nextRef && nextRef.current) {
        nextRef.current.focus();
      } else {
        stopEditingCard(e);
      }
    } else if (e.key === 'Escape') {
      stopEditingCard(e);
    }
  };

  return (
    <div className={styles.editorContainer}>
      <div className={styles.flashcardsContainer}>
        {questions.map((question, index) => {
          const cardClasses = [
            styles.flashcard,
            flippedCardId === question.id ? styles.flipped : '',
            activeEditingCard === question.id ? styles.editing : ''
          ].filter(Boolean).join(' ');
          
          return (
            <div 
              key={question.id} 
              className={cardClasses}
              onClick={() => activeEditingCard !== question.id && handleFlip(question.id)}
            >
              <div className={styles.flashcardInner}>
                <div className={styles.flashcardFront}>
                  <h3 className={styles.cardTitle}>Question {index + 1}</h3>
                  {activeEditingCard === question.id ? (
                    <div 
                      className={`${styles.questionText} ${styles.editableContent}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={styles.editableWrapper}>
                        <textarea
                          ref={questionInputRef}
                          value={question.question_text}
                          onChange={(e) => handleQuestionTextEdit(question.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, question.id, 'question', hintInputRef)}
                          placeholder="Enter your question here..."
                          className={styles.editableTextarea}
                          autoFocus
                        />
                      </div>
                    </div>
                  ) : (
                    <div className={styles.questionText}>
                      {question.question_text}
                    </div>
                  )}
                  <div className={styles.actionButtons}>
                    {activeEditingCard === question.id ? (
                      <button 
                        className={styles.actionButton} 
                        onClick={stopEditingCard}
                      >
                        Done
                      </button>
                    ) : (
                      <>
                        <button 
                          className={styles.actionButton} 
                          onClick={(e) => previewQuestion(question, e)}
                        >
                          Preview
                        </button>
                        <button 
                          className={styles.actionButton} 
                          onClick={(e) => startEditingCard(question.id, e)}
                        >
                          Edit
                        </button>
                        <button 
                          className={styles.actionButton} 
                          onClick={(e) => deleteQuestion(question.id, e)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className={styles.flashcardBack}>
                  <h3 className={styles.cardTitle}>Hint/Answer</h3>
                  {activeEditingCard === question.id ? (
                    <div 
                      className={`${styles.hintText} ${styles.editableContent}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className={styles.editableWrapper}>
                        <textarea
                          ref={hintInputRef}
                          value={question.hint_text}
                          onChange={(e) => handleHintTextEdit(question.id, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(e, question.id, 'hint')}
                          placeholder="Enter hint or guidance for the answer (optional)..."
                          className={`${styles.editableTextarea} ${styles.hintArea}`}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className={styles.hintText}>
                      {question.hint_text || 'No hint provided.'}
                    </div>
                  )}
                  <div className={styles.flipInstruction}>Client will flip the card to write their answer.</div>
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Add new question card */}
        {isEditing && !activeEditingCard ? (
          <div className={`${styles.flashcard} ${styles.addCard} ${styles.editing}`}>
            <form 
              className={styles.addCardForm}
              onSubmit={handleAddQuestion} 
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className={styles.cardTitle}>Question {questions.length + 1}</h3>
              <div className={`${styles.questionText} ${styles.editableContent}`}>
                <textarea
                  ref={questionInputRef}
                  name="question_text"
                  value={newQuestion.question_text}
                  onChange={handleInputChange}
                  placeholder="Enter your question here..."
                  className={styles.editableTextarea}
                  required
                />
              </div>
              <div className={`${styles.hintText} ${styles.editableContent}`}>
                <textarea
                  name="hint_text"
                  value={newQuestion.hint_text}
                  onChange={handleInputChange}
                  placeholder="Enter a hint or guidance for the answer (optional)..."
                  className={`${styles.editableTextarea} ${styles.hintArea}`}
                />
              </div>
              <div className={styles.formActions}>
                <button type="submit" className={styles.submitButton}>
                  Add Question
                </button>
                <button 
                  type="button" 
                  className={styles.cancelButton} 
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        ) : !isEditing && (
          <div 
            className={`${styles.flashcard} ${styles.addCard}`} 
            onClick={createNewCard}
          >
            <div className={styles.addPlaceholder}>
              <h3 className={styles.cardTitle}>Question {questions.length + 1}</h3>
              <div className={styles.questionText}>
                <span className={styles.placeholderText}>Add your question here.</span>
              </div>
              <div className={styles.flipInstruction}>Client will flip the card to write their answer.</div>
            </div>
          </div>
        )}
        
        {/* Add another flashcard button */}
        <div className={styles.addAnotherButton}>
          <button onClick={createNewCard}>
            <span className={styles.plusIcon}>+</span>
            Add another flashcard
          </button>
        </div>
      </div>
      
      {/* Error message display */}
      {error && (
        <div className={styles.errorMessage}>
          <strong>Error:</strong> {error}
          <button 
            onClick={() => setError(null)} 
            className={styles.closeError}
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
});

export default VisualFlashcardEditor;