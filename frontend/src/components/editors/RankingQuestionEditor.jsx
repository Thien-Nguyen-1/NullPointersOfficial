import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";
import { FaTrash, FaPencilAlt, FaArrowUp, FaArrowDown } from "react-icons/fa";

const AdminRankingQuestionForm = ({ onSubmit }) => {
  const [rankingTiers, setRankingTiers] = useState(0);
  const [tierTexts, setTierTexts] = useState([]);
  const [error, setError] = useState("");

  // Function to generate ranking tiers
  const handleSetRankingTiers = () => {
    if (rankingTiers > 0) {
      setTierTexts(Array.from({ length: rankingTiers }, () => ""));
    } else {
      setError("Please enter a number greater than 0.");
    }
  };

  // Function to handle text change in ranking tiers
  const handleTierTextChange = (index, newText) => {
    const updatedTexts = [...tierTexts];
    updatedTexts[index] = newText;
    setTierTexts(updatedTexts);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (tierTexts.length === 0) {
      setError("Please set ranking tiers first.");
      return;
    }

    if (tierTexts.some(text => !text.trim())) {
      setError("Please fill in all ranking tiers before adding.");
      return;
    }

    setError("");
    onSubmit({
      tiers: [...tierTexts]
    });

    // Reset form after submission
    setRankingTiers(0);
    setTierTexts([]);
  };

  return (
    <div className="module-container">
      <h2 className="module-title">Add Ranking Question</h2>
      {error && <p className="error-message">{error}</p>}

      <div className="ranking-setup">
        <div className="input-container">
          <label>Number of ranking tiers:</label>
          <input
            type="number"
            min="1"
            value={rankingTiers}
            onChange={(e) => setRankingTiers(Number(e.target.value))}
            className="input-number"
          />
          <button onClick={handleSetRankingTiers} className="btn-set">
            Set
          </button>
        </div>

        {tierTexts.length > 0 && (
          <div className="tier-inputs">
            {tierTexts.map((text, index) => (
              <div key={index} className="tier-input-row">
                <span className="tier-number">{index + 1}.</span>
                <input
                  type="text"
                  placeholder="Enter tier text"
                  value={text}
                  onChange={(e) => handleTierTextChange(index, e.target.value)}
                  className="tier-input"
                />
              </div>
            ))}
            <button onClick={handleSubmit} className="btn-add-question green-button larger-rounded-button">
              Add Ranking Question
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

const RankingQuestionItem = ({ question, index, onDelete, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedTiers, setEditedTiers] = useState([...question.tiers]);
  const [editError, setEditError] = useState("");

  useEffect(() => {
    // Update when question prop changes
    setEditedTiers([...question.tiers]);
  }, [question]);

  const handleEdit = () => {
    setIsEditing(true);
    setEditError("");
  };

  const handleSave = () => {
    if (editedTiers.some(tier => !tier.trim())) {
      setEditError("Please fill in all ranking tiers.");
      return;
    }

    const updatedQuestion = {
      ...question,
      tiers: [...editedTiers]
    };

    setEditError("");
    onEdit(index, updatedQuestion);
    setIsEditing(false);
  };

  const handleTierTextChange = (index, newText) => {
    const updatedTiers = [...editedTiers];
    updatedTiers[index] = newText;
    setEditedTiers(updatedTiers);
  };

  const moveTierUp = (tierIndex) => {
    if (tierIndex > 0) {
      const updatedTiers = [...editedTiers];
      [updatedTiers[tierIndex], updatedTiers[tierIndex - 1]] = [updatedTiers[tierIndex - 1], updatedTiers[tierIndex]];
      setEditedTiers(updatedTiers);
    }
  };

  const moveTierDown = (tierIndex) => {
    if (tierIndex < editedTiers.length - 1) {
      const updatedTiers = [...editedTiers];
      [updatedTiers[tierIndex], updatedTiers[tierIndex + 1]] = [updatedTiers[tierIndex + 1], updatedTiers[tierIndex]];
      setEditedTiers(updatedTiers);
    }
  };

  return (
    <div className="question-box">
      <div className="question-header">
        <h2 className="question-number">Question {index + 1}</h2>
        <div className="editor-icon-container">
          {isEditing ? (
            <button className="save-button" onClick={handleSave}>Save</button>
          ) : (
            <FaPencilAlt className="edit-icon" onClick={handleEdit} />
          )}
          <FaTrash className="delete-icon" onClick={() => onDelete(index)} />
        </div>
      </div>
      <h3 className="question-subtitle">Ranking Question</h3>
      {editError && <p className="error-message">{editError}</p>}

      {isEditing ? (
        <div className="edit-container">
          {editedTiers.map((tier, tierIndex) => (
            <div key={tierIndex} className="tier-edit-row">
              <input
                type="text"
                value={tier}
                onChange={(e) => handleTierTextChange(tierIndex, e.target.value)}
                className="edit-tier-input"
              />
              <div className="tier-actions">
                <button
                  className="tier-button"
                  onClick={() => moveTierUp(tierIndex)}
                  disabled={tierIndex === 0}
                >
                  <FaArrowUp />
                </button>
                <button
                  className="tier-button"
                  onClick={() => moveTierDown(tierIndex)}
                  disabled={tierIndex === editedTiers.length - 1}
                >
                  <FaArrowDown />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="question-content">
          <div className="ranking-tiers">
            {question.tiers.map((tier, tierIndex) => (
              <div key={tierIndex} className="ranking-tier-item">
                <span className="tier-number">{tierIndex + 1}.</span>
                <div className="tier-text">{tier}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const RankingQuestionEditor = forwardRef((props, ref) => {
  const { moduleId, initialQuestions = [], onUpdateQuestions } = props;
  const [questions, setQuestions] = useState([]);

  // Expose getQuestions method to parent component
  useImperativeHandle(ref, () => ({
    getQuestions: () => {
      // Format questions for API compatibility
      return questions.map((question, index) => ({
        id: question.id || Date.now() + index,
        type: "Ranking Question",
        data: question.tiers,
        order: index
      }));
    }
  }));

  // Load initial questions if provided
  useEffect(() => {
    if (initialQuestions && initialQuestions.length > 0) {
      // Format questions for consistency
      const formattedQuestions = initialQuestions.map(q => ({
        id: q.id || Date.now() + Math.random(),
        tiers: Array.isArray(q.data) ? q.data : [],
        order: q.order || 0
      }));

      setQuestions(formattedQuestions);
    } else {
      setQuestions([]);
    }
  }, [initialQuestions]);

  // Update parent component when questions change
  useEffect(() => {
    if (onUpdateQuestions) {
      onUpdateQuestions(questions);
    }
  }, [questions, onUpdateQuestions]);

  const addQuestion = (newQuestion) => {
    const questionWithId = {
      ...newQuestion,
      id: Date.now() + Math.random()
    };
    setQuestions(prevQuestions => [...prevQuestions, questionWithId]);
  };

  const deleteQuestion = (index) => {
    setQuestions(prevQuestions => prevQuestions.filter((_, i) => i !== index));
  };

  const editQuestion = (index, updatedQuestion) => {
    const updatedQuestions = [...questions];
    updatedQuestions[index] = updatedQuestion;
    setQuestions(updatedQuestions);
  };

  return (
    <div className="editor-container">
      <AdminRankingQuestionForm onSubmit={addQuestion} />
      <div className="questions-list">
        {questions.length > 0 ? (
          questions.map((question, index) => (
            <RankingQuestionItem
              key={`${moduleId}-question-${index}`}
              index={index}
              question={question}
              onDelete={deleteQuestion}
              onEdit={editQuestion}
            />
          ))
        ) : (
          <div className="no-questions-message">
            <p>No ranking questions added yet. Add a question using the form above.</p>
          </div>
        )}
      </div>
    </div>
  );
});

export default RankingQuestionEditor;