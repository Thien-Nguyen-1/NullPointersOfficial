import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { FaArrowUp, FaArrowDown, FaPencilAlt, FaCheck, FaTrash } from "react-icons/fa";
import "../../styles/Quizzes.css"; // Using the shared quiz styles

const RankingQuizEditor = forwardRef((props, ref) => {
  const { moduleId, initialQuestions = [], onUpdateQuestions } = props;
  const [questions, setQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState("Rank the following items:");
  const [tiersCount, setTiersCount] = useState(3); // Default to 3 tiers
  const [tierTexts, setTierTexts] = useState(Array(3).fill("")); // Store tier texts for new question
  const [error, setError] = useState("");
  const [showNewQuestionForm, setShowNewQuestionForm] = useState(true);

  useEffect(() => {
    if (onUpdateQuestions) {
      console.log("[DEBUG] Ranking questions changed:", questions);
      console.log("[DEBUG] onUpdateQuestions exists:", !!onUpdateQuestions);

      const formattedQuestions = questions.map((question, index) => ({
        id: question.id || Date.now() + index, // Use existing ID or generate temp one
        question_text: question.question_text || 'Rank the following items:',
        hint_text: "", // Not used for ranking quiz
        order: index,
        answers: question.tiers || [], // Store tier data in answers field
        tiers: question.tiers || [] // to maintain original tiers for ui, might be deleted
      }));
      
      console.log("[DEBUG] Formatted questions for backend:", formattedQuestions);
      onUpdateQuestions(formattedQuestions);
    }
  }, [questions, onUpdateQuestions]);

  // Expose getQuestions method to parent component
  useImperativeHandle(ref, () => ({
    getQuestions: () => {
      // Check if any question's tiers have empty values
      for (const question of questions) {
        for (const tier of question.tiers) {
          if (!tier.trim()) {
            setError("Please enter text for all tiers before saving.");
            return [];
          }
        }
      }

      // Format questions for API compatibility
      return questions.map((question, index) => ({
        id: question.id || Date.now() + index, // Use existing ID or generate temp one
        question_text: question.question_text || 'Rank the following items:',
        hint_text: "", // Not used for ranking quiz
        order: index,
        answers: question.tiers || [], // Store tier data in answers field
        tiers: question.tiers || []
      }));
    },

    setQuestions: (newQuestions) => {
      // Convert from API format if needed
      const formattedQuestions = newQuestions.map(q => ({
        id: q.id,
        question_text: q.question_text || q.text || 'Rank the following items:',
        tiers: q.answers || []
      }));
      setQuestions(formattedQuestions);
    }
  }));

  // Show/hide form based on questions length
  useEffect(() => {
    // If there are no questions, always show the form
    if (questions.length === 0) {
      setShowNewQuestionForm(true);
    }
  }, [questions]);

  // Load initial questions if provided
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      // Format questions for consistency - convert from API format to component format
      const formattedQuestions = initialQuestions.map(q => {
        return {
          id: q.id,
          question_text: q.question_text || q.text || 'Rank the following items:',
          tiers: q.answers || [] // Get tiers from answers field
        };
      });

      setQuestions(formattedQuestions);

      // If we loaded questions, hide the form
      if (formattedQuestions.length > 0) {
        setShowNewQuestionForm(false);
      }
    } else {
      setQuestions([]);
      // If no initial questions, show the form
      setShowNewQuestionForm(true);
    }
  }, [initialQuestions]);

  // Handle tier text change for new question form
  const handleTierTextChange = (index, value) => {
    const newTierTexts = [...tierTexts];
    newTierTexts[index] = value;
    setTierTexts(newTierTexts);
  };

  // Create the new question with tiers
  const handleAddQuestion = () => {
    // Validate tier texts
    const hasEmptyTier = tierTexts.some(text => !text.trim());
    if (hasEmptyTier) {
      setError("Please enter text for all tiers before adding the question.");
      return;
    }

    setError("");

    // Add new question to the list
    setQuestions([
      ...questions,
      {
        question_text: newQuestionText,
        tiers: [...tierTexts]
      }
    ]);

    // Reset form
    setNewQuestionText("Rank the following items:");
    setTiersCount(3);
    setTierTexts(Array(3).fill(""));

    // Hide form only if it's not the first question
    setShowNewQuestionForm(false);
  };

  // Delete a question
  const handleDeleteQuestion = (indexToDelete) => {
    setQuestions(questions.filter((_, index) => index !== indexToDelete));

    // If deleting the last question, show the form
    if (questions.length === 1) {
      setShowNewQuestionForm(true);
    }
  };

  // Handle tier count change
  const handleTierCountChange = (count) => {
    const newCount = parseInt(count) || 2;
    setTiersCount(newCount);

    // Update tier texts array to match new count
    if (newCount > tierTexts.length) {
      // Add empty strings for new tiers
      setTierTexts([...tierTexts, ...Array(newCount - tierTexts.length).fill("")]);
    } else if (newCount < tierTexts.length) {
      // Remove extra tiers
      setTierTexts(tierTexts.slice(0, newCount));
    }
  };

  // Show the new question form
  const handleShowNewQuestionForm = () => {
    setError("");
    setShowNewQuestionForm(true);
  };

  // Cancel adding a new question
  const handleCancelAddQuestion = () => {
    // Only hide form if there are existing questions
    if (questions.length > 0) {
      setShowNewQuestionForm(false);
    }

    setNewQuestionText("Rank the following items:");
    setTiersCount(3);
    setTierTexts(Array(3).fill(""));
    setError("");
  };

  return (
    <div className="quiz-editor ranking-quiz-editor">
      <h2>Ranking Quiz</h2>

      {error && <p className="error-message">{error}</p>}

      {/* Display existing questions */}
      {questions.map((question, questionIndex) => (
        <div key={`question-${questionIndex}`} className="ranking-question-container">
          <div className="question-header">
            <h3 className="ranking-question-number">Question {questionIndex + 1}</h3>
            <button
              className="trash-icon-button"
              onClick={() => handleDeleteQuestion(questionIndex)}
              title="Delete question"
            >
              <FaTrash />
            </button>
          </div>

          <div className="question-full-width">
            <div className="readonly-question-text">
              {question.question_text}
            </div>
          </div>

          <div className="tiers-container">
            {question.tiers.map((tier, tierIndex) => (
              <div
                key={`tier-${questionIndex}-${tierIndex}`}
                className="tier-item readonly"
              >
                <div className="tier-number">{tierIndex + 1}</div>
                <div className="tier-content readonly">
                  {tier}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Add new question form */}
      {showNewQuestionForm ? (
        <div className="fitb-module-container add-question-container">
          <h3>Add Ranking Question</h3>

          <div className="new-question-input">
            <label>Question Text:</label>
            <input
              type="text"
              value={newQuestionText}
              onChange={(e) => setNewQuestionText(e.target.value)}
              className="question-input"
              placeholder="Enter question text..."
            />
          </div>

          <div className="tier-count-container">
            <label>Number of tiers:</label>
            <input
              type="number"
              min="2"
              max="10"
              value={tiersCount}
              onChange={(e) => handleTierCountChange(e.target.value)}
              className="tiers-count-input"
            />
          </div>

          <div className="new-tiers-container">
            <label>Enter text for each tier:</label>
            {Array.from({ length: tiersCount }).map((_, index) => (
              <div key={`new-tier-${index}`} className="new-tier-item">
                <span className="tier-number-label">{index + 1}.</span>
                <input
                  type="text"
                  value={tierTexts[index] || ""}
                  onChange={(e) => handleTierTextChange(index, e.target.value)}
                  className="tier-text-input"
                  placeholder={`Enter text for tier ${index + 1}...`}
                />
              </div>
            ))}
          </div>

          <div className="form-actions">
            <button
              onClick={handleAddQuestion}
              className="fitb-btn-add-question"
            >
              Add Question
            </button>
            {questions.length > 0 && (
              <button
                onClick={handleCancelAddQuestion}
                className="cancel-button"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="add-question-button-container">
          <button onClick={handleShowNewQuestionForm} className="fitb-btn-add-question">
            Add Another Question
          </button>
        </div>
      )}
    </div>
  );
});

export default RankingQuizEditor;