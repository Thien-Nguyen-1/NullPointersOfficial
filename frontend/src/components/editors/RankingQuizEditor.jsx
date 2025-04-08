import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef } from "react";
import { FaArrowUp, FaArrowDown, FaPencilAlt, FaCheck, FaTrash } from "react-icons/fa";
import "../../styles/Quizzes.css"; // Using the shared quiz styles

// Create a module-level cache to persist questions between remounts
// This is a critical pattern for maintaining state when components unmount and remount
// The cache exists outside React's component lifecycle, so data persists between renders
const questionsCache = {};

const RankingQuizEditor = forwardRef((props, ref) => {
  // Extract all props with defaults
  const {
    moduleId,
    initialQuestions = [],
    onUpdateQuestions,
    editorKey // This is new - we'll use it to keep a consistent ID
  } = props;

  // Create a stable component ID that persists between renders
  const [componentId] = useState(() => {
    // Important: when editing, use the actual database ID if available
    const stableId = editorKey || moduleId || `new-ranking-${Date.now()}`;
    console.log(`[DEBUG] RankingQuizEditor instantiated with ID: ${stableId} (moduleId: ${moduleId})`);
    return stableId;
  });

  const [questions, setQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState("Rank the following items:");
  const [tiersCount, setTiersCount] = useState(3); // Default to 3 tiers
  const [tierTexts, setTierTexts] = useState(Array(3).fill("")); // Store tier texts for new question
  const [error, setError] = useState("");
  const [showNewQuestionForm, setShowNewQuestionForm] = useState(true); // Control form visibility

  // Generate a unique and stable cache key
  // This ensures cache persistence between component remounts
  const cacheKey = `ranking-quiz-${componentId}`;
  console.log(`[DEBUG] Using cacheKey: ${cacheKey} for moduleId: ${moduleId || 'undefined'}`);

  // Create a ref to track the latest questions state
  const questionsRef = useRef([]);

  // Initialize from cache on first render or when cache key changes - allows questions to persist between component remounts (this runs once)
  useEffect(() => {
    if (questionsCache[cacheKey] && questionsCache[cacheKey].length > 0) {
      console.log(`[DEBUG] Restoring ${questionsCache[cacheKey].length} questions from cache for key ${cacheKey}`);
      setQuestions(questionsCache[cacheKey]);
      questionsRef.current = questionsCache[cacheKey];

      // If we loaded questions from cache, hide the form
      if (questionsCache[cacheKey].length > 0) {
        setShowNewQuestionForm(false);
      }
    }
  }, [cacheKey]); // Only runs when cache key changes

  // Sync questionsRef and module cache whenever questions state changes - This creates a three-way sync between state, ref, and cache
  useEffect(() => {
    questionsRef.current = questions; // Update the ref to match current state

    // Update the module-level cache
    if (questions.length > 0) {
      console.log(`[DEBUG] Updating cache with ${questions.length} questions for key ${cacheKey}`);
      questionsCache[cacheKey] = [...questions]; // Create a new array to avoid reference issues
    }

    console.log(`[DEBUG] Questions state updated for ${cacheKey}:`, questions);
  }, [questions, cacheKey]); // Runs whenever questions or cacheKey changes

  //  Notify parent component when questions change using callback
  // This allows parent components to react to question changes
  useEffect(() => {
    if (onUpdateQuestions) {
      console.log(`[DEBUG] Ranking questions changed for ${cacheKey}:`, questions);
      console.log("[DEBUG] onUpdateQuestions exists:", !!onUpdateQuestions);

      const formattedQuestions = questions.map((question, index) => ({
        id: question.id || `${componentId}-${Date.now()}-${index}`, // Use existing ID or generate temp one
        question_text: question.question_text || 'Rank the following items:',
        hint_text: "", // Not used for ranking quiz
        order: index,
        answers: question.tiers || [], // Store tier data in answers field
        tiers: question.tiers || [] // to maintain original tiers for ui, might be deleted
      }));

      console.log(`[DEBUG] Formatted questions for backend from ${cacheKey}:`, formattedQuestions);
      onUpdateQuestions(formattedQuestions);
    }
  }, [questions, onUpdateQuestions, cacheKey, componentId]);  // Run when questions or callback changes

  // Initialize questions from props if passed and no cached data exists
  // This helps load existing questions when editing
  useEffect(() => {
    console.log(`[DEBUG] initialQuestions for ${cacheKey}:`, initialQuestions);
    // First check cache, then check initialQuestions (cache has priority)
    if (questionsCache[cacheKey] && questionsCache[cacheKey].length > 0) {
      console.log(`[DEBUG] Using cached questions for ${cacheKey} instead of initialQuestions`);
      return; // Skip initialization from props if we have cached questions
    }

    if (initialQuestions && initialQuestions.length > 0) {
      // Format questions for consistency - convert from API format to component format
      const formattedQuestions = initialQuestions.map(q => {
        return {
          id: q.id,
          question_text: q.question_text || q.text || 'Rank the following items:',
          tiers: q.answers || [] // Get tiers from answers field
        };
      });
      console.log(`[DEBUG] Setting formatted initial questions for ${cacheKey}:`, formattedQuestions);
      setQuestions(formattedQuestions);
      // Update the ref immediately to maintain consistency
      questionsRef.current = formattedQuestions;

      // Update the cache
      questionsCache[cacheKey] = [...formattedQuestions];

      // If we loaded questions, hide the form
      if (formattedQuestions.length > 0) {
        setShowNewQuestionForm(false);
      }
    } else {
      console.log(`[DEBUG] No initial questions for ${cacheKey}, setting empty array`);
      setQuestions([]);
      questionsRef.current = [];
      // If no initial questions, show the form
      setShowNewQuestionForm(true);
    }
  }, [initialQuestions, cacheKey]); // Run when initialQuestions or cacheKey changes

  // Method called by parent to retrieve questions when saving
  useImperativeHandle(ref, () => ({
    getQuestions: () => {
      console.log(`[DEBUG] getQuestions called for componentId: ${componentId}, cacheKey: ${cacheKey}`);
      console.log("[DEBUG] Raw questions state in getQuestions:", questionsRef.current);
      console.log("[DEBUG] Cache state in getQuestions:", questionsCache[cacheKey]);
      console.log("[DEBUG] Component state snapshot:", {
        newQuestionText,
        tierTexts,
        showNewQuestionForm,
        error,
        cacheKey,
        componentId
      });

      // First priority: use cached questions if available
      // The cache is the most reliable source and persists between remounts
      if (questionsCache[cacheKey] && questionsCache[cacheKey].length > 0) {
        console.log(`[DEBUG] Returning ${questionsCache[cacheKey].length} questions from cache for key ${cacheKey}`);

        const formattedCachedQuestions = questionsCache[cacheKey].map((question, index) => ({
          id: question.id,
          question_text: question.question_text || 'Rank the following items:',
          hint_text: "",
          order: index,
          answers: question.tiers || [],
          tiers: question.tiers || []
        }));

        return formattedCachedQuestions;
      }

      // Second priority: use ref
      // The ref should match state but sometimes has better timing
      if (questionsRef.current.length > 0) {
        console.log(`[DEBUG] Returning ${questionsRef.current.length} questions from ref for key ${cacheKey}`);

        const formattedRefQuestions = questionsRef.current.map((question, index) => ({
          id: question.id,
          question_text: question.question_text || 'Rank the following items:',
          hint_text: "",
          order: index,
          answers: question.tiers || [],
          tiers: question.tiers || []
        }));

        return formattedRefQuestions;
      }

      // Third priority: check for unsaved form data: DO WE NEED THIS???
      // If the user has entered data but not clicked "Add Question" yet, we try to save it
      /* if (tierTexts.some(text => text.trim() !== "") && newQuestionText.trim() !== "") {
        console.log("[DEBUG] Found unsaved form data:", {
          question: newQuestionText,
          tiers: tierTexts
        });

        // Filter out empty tiers
        const validTiers = tierTexts.filter(text => text.trim() !== "");

        // Only create a question if we have at least 2 valid tiers
        if (validTiers.length >= 2) {
          // Create a question from the unsaved form data
          const unsavedQuestion = {
            id: Date.now(),
            question_text: newQuestionText,
            hint_text: "",
            order: 0,
            answers: validTiers,
            tiers: validTiers
          };

          console.log("[DEBUG] Created unsaved question from form:", unsavedQuestion);

          // Update cache with this question for future use
          questionsCache[cacheKey] = [unsavedQuestion];

          return [unsavedQuestion];
        }
      } */

      // Fourth priority: try DOM elements as last resort
      // This is a fallback for extreme cases where state is completely lost
      const tierInputs = document.querySelectorAll('.tier-text-input');
      const questionInput = document.querySelector('.question-input');

      if (tierInputs.length > 0 && questionInput) {
        console.log("[DEBUG] Found form elements in DOM:", {
          tierInputs: tierInputs.length,
          questionInput: Boolean(questionInput)
        });

        // Get values from inputs
        const text = questionInput.value;
        const tiers = Array.from(tierInputs)
          .map(input => input.value)
          .filter(val => val.trim() !== "");

        if (text && tiers.length >= 2 && tiers.length === tierInputs.length) {
          console.log(`[DEBUG] Captured unsaved question from DOM for ${cacheKey}:`, { text, tiers });

          // Create the question
          const domQuestion = {
            id: `${componentId}-${Date.now()}`,
            question_text: text,
            hint_text: "",
            order: 0,
            answers: tiers,
            tiers: tiers
          };

          // Update cache with this question
          questionsCache[cacheKey] = [domQuestion];

          return [domQuestion];
        }
      }

      // No questions found anywhere
      console.log(`[DEBUG] No questions found in any storage mechanism for ${cacheKey}`);
      return [];
    },

    setQuestions: (newQuestions) => {
      // Convert from API format if needed
      const formattedQuestions = newQuestions.map(q => ({
        id: q.id,
        question_text: q.question_text || q.text || 'Rank the following items:',
        tiers: q.answers || []
      }));
      console.log(`[DEBUG] Setting questions via ref method for ${cacheKey}:`, formattedQuestions);
      setQuestions(formattedQuestions);

      // Update the ref immediately for consistency
      questionsRef.current = formattedQuestions;

      // Update the cache
      questionsCache[cacheKey] = [...formattedQuestions];
    },

    // clearCache: Utility method to clear the cache when needed
    clearCache: () => {
      console.log(`[DEBUG] Clearing cache for key ${cacheKey}`);
      delete questionsCache[cacheKey];
    },

    // Debugging method to expose cache key
    getCacheKey: () => {
      return cacheKey;
    },

    // Debugging method to expose component ID
    getComponentId: () => {
      return componentId;
    },

    // For the parent to know what contentID to use when saving
    getContentId: () => {
      return editorKey || componentId;
    }
  }));

  // Ensures users always see a form when there are no questions
  useEffect(() => {
    // If there are no questions, always show the form
    if (questions.length === 0) {
      setShowNewQuestionForm(true);
    }
  }, [questions]);

  // Updates a specific tier's text when the user types
  const handleTierTextChange = (index, value) => {
    const newTierTexts = [...tierTexts];
    newTierTexts[index] = value;
    setTierTexts(newTierTexts);
  };

  // Create the new question with tiers
  const handleAddQuestion = () => {
    // Validate question text is not empty
    if (!newQuestionText.trim()) {
        setError("Please enter a question text.");
        return;
    }

    // Validate tier texts - ensure ALL tiers are filled in
    const emptyTiers = tierTexts.filter(text => !text.trim());
    if (emptyTiers.length > 0) {
        setError("Please enter text for all tiers before adding the question.");
        return;
    }

    setError("");

    // Add new question to the list
    const newQuestion = {
        id: `${componentId}-${Date.now()}`,
        question_text: newQuestionText,
        tiers: [...tierTexts]
    };

    console.log("[DEBUG] Before adding question:", {
        currentQuestions: questions,
        newQuestion: newQuestion,
        cacheKey: cacheKey,
        componentId: componentId
    });

    // Add new question to the list
    setQuestions(prevQuestions => {
        const updatedQuestions = [...prevQuestions, newQuestion];
        console.log(`[DEBUG] After adding question - updated questions array for key ${cacheKey}:`, updatedQuestions);

        // Update questionsRef immediately for consistency
        // This is important because state updates are asynchronous
        questionsRef.current = updatedQuestions;

        // Update the cache immediately
        // This ensures the cache is always in sync with the latest questions
        questionsCache[cacheKey] = [...updatedQuestions];

        return updatedQuestions;
    });

    // Reset form
    setNewQuestionText("Rank the following items:");
    setTiersCount(3);
    setTierTexts(Array(3).fill(""));

    // Hide form only if it's not the first question
    setShowNewQuestionForm(false);
  };

  // Removes a specific question by index
  const handleDeleteQuestion = (indexToDelete) => {
    setQuestions(prevQuestions => {
      const updatedQuestions = prevQuestions.filter((_, index) => index !== indexToDelete);

      // Update the ref immediately
      questionsRef.current = updatedQuestions;

      // Update the cache
      questionsCache[cacheKey] = [...updatedQuestions];

      // If deleting the last question, show the form
      if (updatedQuestions.length === 0) {
        setShowNewQuestionForm(true);
      }

      return updatedQuestions;
    });
  };

  // Updates the UI to display more or fewer ranking options
  const handleTierCountChange = (count) => {
    const newCount = parseInt(count) || 3; // Default to 3 if invalid
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

  //Display the form for adding a new question
  const handleShowNewQuestionForm = () => {
    setError("");
    setShowNewQuestionForm(true);
  };

  // Cancel adding a new question - // Hides the form and resets fields
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
      <div style={{ display: 'none' }} data-cache-key={cacheKey} data-component-id={componentId}  data-module-id={moduleId} data-editor-key={editorKey}/>
      {/* Error display */}
      {error && <p className="error-message">{error}</p>}
      {/* Display existing questions */}
      {questions.map((question, questionIndex) => (
        <div key={`question-${componentId}-${questionIndex}-${question.id}`} className="ranking-question-container">
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
                key={`tier-${componentId}-${questionIndex}-${tierIndex}-${question.id}`}
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
              <div key={`new-tier-${componentId}-${index}`} className="new-tier-item">
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