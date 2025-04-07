import React, { useState } from "react";
import "../../styles/ModulePreview.css";

// Components for different quiz types
const FlashcardPreview = ({ questions }) => {
  const [currentCard, setCurrentCard] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (!questions || questions.length === 0) {
    return <div className="empty-quiz">No flashcards available.</div>;
  }

  const handleNext = () => {
    if (currentCard < questions.length - 1) {
      setCurrentCard(currentCard + 1);
      setFlipped(false);
      setUserAnswer("");
      setSubmitted(false);
    }
  };

  const handlePrev = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setFlipped(false);
      setUserAnswer("");
      setSubmitted(false);
    }
  };

  const handleFlip = () => {
    setFlipped(!flipped);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    setFlipped(true);
  };

  return (
    <div className="flashcard-preview">
      <div className="flashcard-navigation">
        <span>Card {currentCard + 1} of {questions.length}</span>
        <div className="flashcard-nav-buttons">
          <button 
            onClick={handlePrev} 
            disabled={currentCard === 0}
            className="nav-button"
          >
            Previous
          </button>
          <button 
            onClick={handleNext} 
            disabled={currentCard === questions.length - 1}
            className="nav-button"
          >
            Next
          </button>
        </div>
      </div>

      <div className={`flashcard-container ${flipped ? 'flipped' : ''}`}>
        <div className="flashcard-inner">
          <div className="flashcard-front">
            <h3>Question:</h3>
            <p>{questions[currentCard].question_text}</p>
            <textarea
              placeholder="Type your answer here..."
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              disabled={submitted}
            />
            {!submitted && (
              <button className="submit-button" onClick={handleSubmit}>
                Submit Answer
              </button>
            )}
            {!submitted && (
              <button className="flip-button" onClick={handleFlip}>
                View Hint
              </button>
            )}
          </div>
          <div className="flashcard-back">
            <h3>Hint/Answer:</h3>
            <p>{questions[currentCard].hint_text || "No hint provided."}</p>
            <div className="user-answer-section">
              <h4>Your Answer:</h4>
              <p className="user-answer">{userAnswer || "(No answer provided)"}</p>
            </div>
            <button className="flip-button" onClick={handleFlip}>
              Back to Question
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FillInTheBlanksPreview = ({ questions }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [blanksAnswers, setBlanksAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!questions || questions.length === 0) {
    return <div className="empty-quiz">No fill-in-the-blanks questions available.</div>;
  }

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSubmitted(false);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
      setSubmitted(false);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleBlankChange = (blankIndex, value) => {
    setBlanksAnswers({
      ...blanksAnswers,
      [`${currentQuestion}-${blankIndex}`]: value
    });
  };

  const getCurrentQuestionBlanks = () => {
    const questionText = questions[currentQuestion].question_text || "";
    const parts = questionText.split("____");
    return parts;
  };

  const getBlankAnswer = (blankIndex) => {
    return blanksAnswers[`${currentQuestion}-${blankIndex}`] || "";
  };

  const parts = getCurrentQuestionBlanks();

  return (
    <div className="fill-blanks-preview">
      <div className="question-navigation">
        <span>Question {currentQuestion + 1} of {questions.length}</span>
        <div className="question-nav-buttons">
          <button 
            onClick={handlePrev} 
            disabled={currentQuestion === 0}
            className="nav-button"
          >
            Previous
          </button>
          <button 
            onClick={handleNext} 
            disabled={currentQuestion === questions.length - 1}
            className="nav-button"
          >
            Next
          </button>
        </div>
      </div>

      <div className="question-container">
        <h3>Fill in the Blanks:</h3>
        <div className="fill-blanks-content">
          {parts.map((part, index) => (
            <React.Fragment key={index}>
              <span>{part}</span>
              {index < parts.length - 1 && (
                <input
                  type="text"
                  value={getBlankAnswer(index)}
                  onChange={(e) => handleBlankChange(index, e.target.value)}
                  disabled={submitted}
                  className={`blank-input ${submitted ? 'submitted' : ''}`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        {!submitted ? (
          <button className="submit-button" onClick={handleSubmit}>
            Submit
          </button>
        ) : (
          <div className="submission-message">
            <p>Your answers have been submitted!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const FlowchartPreview = ({ questions }) => {
  const [currentStatement, setCurrentStatement] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!questions || questions.length === 0) {
    return <div className="empty-quiz">No flowchart questions available.</div>;
  }

  const handleNext = () => {
    if (currentStatement < questions.length - 1) {
      setCurrentStatement(currentStatement + 1);
    }
  };

  const handlePrev = () => {
    if (currentStatement > 0) {
      setCurrentStatement(currentStatement - 1);
    }
  };

  const handleAnswerChange = (e) => {
    setUserAnswers({
      ...userAnswers,
      [currentStatement]: e.target.value
    });
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  return (
    <div className="flowchart-preview">
      <div className="flowchart-visualization">
        {questions.map((statement, index) => (
          <React.Fragment key={statement.id || index}>
            <div 
              className={`flowchart-node ${index === currentStatement ? 'active' : ''} ${index < currentStatement ? 'completed' : ''}`}
              onClick={() => setCurrentStatement(index)}
            >
              <span className="node-number">{index + 1}</span>
              <div className="node-content">
                <p>{statement.question_text}</p>
              </div>
            </div>
            {index < questions.length - 1 && (
              <div className="flowchart-arrow">→</div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="statement-detail">
        <h3>Statement {currentStatement + 1}:</h3>
        <p className="statement-text">{questions[currentStatement].question_text}</p>
        
        <div className="question-section">
          <h4>Question:</h4>
          <p>{questions[currentStatement].hint_text || "No question available."}</p>
          
          <textarea
            placeholder="Write your answer here..."
            value={userAnswers[currentStatement] || ""}
            onChange={handleAnswerChange}
            disabled={submitted}
            className="answer-textarea"
          />
          
          <div className="statement-navigation">
            <button 
              onClick={handlePrev} 
              disabled={currentStatement === 0}
              className="nav-button"
            >
              Previous
            </button>
            <button 
              onClick={handleNext} 
              disabled={currentStatement === questions.length - 1}
              className="nav-button"
            >
              Next
            </button>
          </div>
          
          {!submitted && (
            <button className="submit-button" onClick={handleSubmit}>
              Submit All Answers
            </button>
          )}
          
          {submitted && (
            <div className="submission-message">
              <p>Your answers have been submitted!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const RankingPreview = ({ questions }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [rankOrder, setRankOrder] = useState({});
  const [submitted, setSubmitted] = useState(false);

  if (!questions || questions.length === 0) {
    return <div className="empty-quiz">No ranking questions available.</div>;
  }

  useEffect(() => {
    // Initialize ranking order for each question
    const initialRankings = {};
    questions.forEach((question, index) => {
      initialRankings[index] = question.answers || [];
    });
    setRankOrder(initialRankings);
  }, [questions]);

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    setSubmitted(true);
  };

  const handleMove = (direction, itemIndex) => {
    if (submitted) return;

    const currentItems = [...rankOrder[currentQuestion]];
    if (direction === 'up' && itemIndex > 0) {
      // Swap with the item above
      [currentItems[itemIndex], currentItems[itemIndex - 1]] =
        [currentItems[itemIndex - 1], currentItems[itemIndex]];
    } else if (direction === 'down' && itemIndex < currentItems.length - 1) {
      // Swap with the item below
      [currentItems[itemIndex], currentItems[itemIndex + 1]] =
        [currentItems[itemIndex + 1], currentItems[itemIndex]];
    }

    setRankOrder({
      ...rankOrder,
      [currentQuestion]: currentItems
    });
  };

  return (
    <div className="ranking-preview">
      <div className="ranking-navigation">
        <span>Question {currentQuestion + 1} of {questions.length}</span>
        <div className="ranking-nav-buttons">
          <button
            onClick={handlePrev}
            disabled={currentQuestion === 0}
            className="nav-button"
          >
            Previous
          </button>
          <button
            onClick={handleNext}
            disabled={currentQuestion === questions.length - 1}
            className="nav-button"
          >
            Next
          </button>
        </div>
      </div>

      <div className="ranking-container">
        <h3>Ranking Exercise:</h3>
        <p className="ranking-instructions">
          {questions[currentQuestion].question_text || "Rank the following items:"}
        </p>

        <div className="ranking-items">
          {rankOrder[currentQuestion]?.map((item, index) => (
            <div key={index} className="ranking-item">
              <div className="ranking-item-number">{index + 1}</div>
              <div className="ranking-item-content">{item}</div>
              <div className="ranking-item-controls">
                <button
                  onClick={() => handleMove('up', index)}
                  disabled={index === 0 || submitted}
                  className="move-button"
                >
                  ↑
                </button>
                <button
                  onClick={() => handleMove('down', index)}
                  disabled={index === rankOrder[currentQuestion].length - 1 || submitted}
                  className="move-button"
                >
                  ↓
                </button>
              </div>
            </div>
          ))}
        </div>

        {!submitted ? (
          <button
            className="submit-button"
            onClick={handleSubmit}
          >
            Submit Ranking
          </button>
        ) : (
          <div className="submission-message">
            <p>Your ranking has been submitted!</p>
          </div>
        )}
      </div>
    </div>
  );
};

const ModulePreview = ({ module, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);

  // Handle case when no module data is provided
  if (!module || !module.title) {
    return (
      <div className="module-preview-overlay">
        <div className="module-preview-container">
          <div className="preview-header">
            <h2>Preview</h2>
            <button className="close-preview" onClick={onClose}>×</button>
          </div>
          <div className="preview-content">
            <p>No module data available for preview.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="module-preview-overlay">
      <div className="module-preview-container">
        <div className="preview-header">
          <h2>Student View: {module.title}</h2>
          <button className="close-preview" onClick={onClose}>×</button>
        </div>

        <div className="preview-content">
          <div className="module-info">
            <p className="module-description">{module.description}</p>
            
            {module.tags && module.tags.length > 0 && (
              <div className="module-tags">
                {module.tags.map((tag, index) => (
                  <span key={index} className="module-tag">{tag}</span>
                ))}
              </div>
            )}
          </div>

          {module.modules && module.modules.length > 0 ? (
            <>
              <div className="preview-tabs">
                {module.modules.map((m, index) => (
                  <button
                    key={index}
                    className={`tab-button ${activeTab === index ? 'active' : ''}`}
                    onClick={() => setActiveTab(index)}
                  >
                    {m.type}
                  </button>
                ))}
              </div>

              <div className="preview-tab-content">
                {module.modules[activeTab].quizType === 'flashcard' && (
                  <FlashcardPreview questions={module.modules[activeTab].questions} />
                )}
                
                {module.modules[activeTab].quizType === 'text_input' && (
                  <FillInTheBlanksPreview questions={module.modules[activeTab].questions} />
                )}
                
                {module.modules[activeTab].quizType === 'statement_sequence' && (
                  <FlowchartPreview questions={module.modules[activeTab].questions} />
                )}

                {module.modules[activeTab].quizType === 'ranking_quiz' && (
                  <RankingPreview questions={module.modules[activeTab].questions} />
                )}

              </div>
            </>
          ) : (
            <div className="empty-module">
              <p>This module doesn't have any content yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ModulePreview;