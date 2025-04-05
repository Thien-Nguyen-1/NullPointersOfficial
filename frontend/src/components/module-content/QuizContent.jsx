import React, { useState, useEffect } from "react";
import { QuizApiUtils } from "../../services/QuizApiUtils"; // Make sure this path is correct
import FlashcardQuiz from "../quizzes/FlashcardQuiz";
import FillInTheBlanksQuiz from "../quizzes/FillInTheBlanksQuiz";
import FlowchartQuiz from "../quizzes/FlowchartQuiz";
import QuestionAndAnswerForm from "../quizzes/QuestionAndAnswerForm";
import MatchingQuestionsQuiz from "../quizzes/MatchingQuestionsQuiz";
import RankingQuiz from "../quizzes/RankingQuiz";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
/**
 * Component for rendering quiz content in the module
 *
 * @param {Object} quizData - The quiz data to render
 * @param {Set} completedContentIds - Set of IDs of completed content items
 * @param {Function} onComplete - Callback function when quiz is completed
 * @param {Boolean} isPreviewMode - Whether we're in preview mode
 */
const QuizContent = ({ quizData, completedContentIds, onComplete, isPreviewMode = false }) => {
  if (!quizData || !quizData.taskData) return null;
  
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Function to load questions
    const loadQuestions = async () => {
      setLoading(true);
      
      try {
        // If we're in preview mode or have preview data, use it directly
        if (isPreviewMode && quizData.taskData && quizData.taskData.questions) {
          console.log("Using preview mode questions:", quizData.taskData.questions);
          setQuestions(quizData.taskData.questions);
          setLoading(false);
          return;
        }
        
        // Otherwise fetch from API as normal
        const fetchedQuestions = await QuizApiUtils.getQuestions(quizData.taskData.contentID);
        console.log("Fetched questions:", fetchedQuestions);
        
        if (fetchedQuestions && fetchedQuestions.length > 0) {
          setQuestions(fetchedQuestions);
        } else {
          console.log("No questions returned from API");
          setError("No questions available for this quiz.");
        }
      } catch (err) {
        console.error("Error loading quiz questions:", err);
        setError("Failed to load quiz questions. Please try again later.");
      }
      
      setLoading(false);
    };
    
    loadQuestions();
  }, [quizData, isPreviewMode]);
  
  // Show loading state
  if (loading) {
    return (
      <div className="alt-component">
        <div className="alt-component-header">
          <h3>{quizData.title}</h3>
        </div>
        <div className="alt-component-content">
          <p>Loading quiz questions...</p>
        </div>
      </div>
    );
  }
  
  // Show error state
  if (error) {
    return (
      <div className="alt-component">
        <div className="alt-component-header">
          <h3>{quizData.title}</h3>
        </div>
        <div className="alt-component-content">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }
  
  let quizComponent = null;
  
  switch (quizData.quiz_type) {
    case 'flashcard':
      quizComponent = (
        <FlashcardQuiz
          taskId={quizData.taskData.contentID}
          onComplete={(results) => onComplete(quizData.id, results)}
          isPreview={isPreviewMode}
          previewQuestions={isPreviewMode ? questions : null}
        />
      );
      break;
    case 'text_input':
      quizComponent = (
        <FillInTheBlanksQuiz
          taskId={quizData.taskData.contentID}
          onComplete={(results) => onComplete(quizData.id, results)}
          isPreview={isPreviewMode}
          previewQuestions={isPreviewMode ? questions : null}
        />
      );
      break;
    case 'statement_sequence':
      quizComponent = (
        <FlowchartQuiz
          taskId={quizData.taskData.contentID}
          onComplete={(results) => onComplete(quizData.id, results)}
          isPreview={isPreviewMode}
          previewQuestions={isPreviewMode ? questions : null}
        />
      );
      break;
    case 'question_input':
      quizComponent = (
        <QuestionAndAnswerForm
          taskId={quizData.taskData.contentID}
          onComplete={(results) => onComplete(quizData.id, results)}
          isPreview={isPreviewMode}
          previewQuestions={isPreviewMode ? questions : null}
        />
      );
      break;
    case 'ranking_quiz':
      quizComponent = <RankingQuiz
        taskId={quizData.taskData.contentID}
        onComplete={(results) => onComplete(quizData.id, results)}
        isPreview={isPreviewMode}
        previewQuestions={isPreviewMode ? questions : null}
      />;
      break;
    case 'pair_input':
      quizComponent = (
        <DndProvider backend={HTML5Backend}>
          <MatchingQuestionsQuiz
            taskId={quizData.taskData.contentID}
            onComplete={(results) => {console.log("QUIZ CONTENT: Matching Quiz onComplete", results); onComplete(quizData.id, results)}}
            isPreview={isPreviewMode}
            previewQuestions={isPreviewMode ? questions : null}
            completedContentIds={completedContentIds}
          />
        </DndProvider>
      );
      break;
    default:
      return <div className="error-message">Unknown quiz type: {quizData.quiz_type}</div>;
  }
  
  return (
    <div className="alt-component">
      <div className="alt-component-header">
        <h3>{quizData.title}</h3>
        {completedContentIds.has(quizData.id) && (
          <span className="completed-check">✓</span>
        )}
      </div>
      <div className="alt-component-content">
        {quizComponent}
      </div>
    </div>
  );
};

export default QuizContent;