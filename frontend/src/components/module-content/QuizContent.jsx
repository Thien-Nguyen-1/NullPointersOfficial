import React from "react";
import FlashcardQuiz from "../quizzes/FlashcardQuiz";
import FillInTheBlanksQuiz from "../quizzes/FillInTheBlanksQuiz";
import FlowchartQuiz from "../quizzes/FlowchartQuiz";
import QuestionAndAnswerForm from "../quizzes/QuestionAndAnswerForm";
import MatchingQuestionsQuiz from "../quizzes/MatchingQuestionsQuiz";
/**
 * Component for rendering quiz content in the module
 * 
 * @param {Object} quizData - The quiz data to render
 * @param {Set} completedContentIds - Set of IDs of completed content items
 * @param {Function} onComplete - Callback function when quiz is completed
 */
const QuizContent = ({ quizData, completedContentIds, onComplete }) => {
  if (!quizData || !quizData.taskData) return null;
  
  let quizComponent = null;
  
  switch (quizData.quiz_type) {
    case 'flashcard':
      quizComponent = <FlashcardQuiz 
        taskId={quizData.taskData.contentID} 
        onComplete={(results) => onComplete(quizData.id, results)}
      />;
      break;
    case 'text_input':
      quizComponent = <FillInTheBlanksQuiz 
        taskId={quizData.taskData.contentID} 
        onComplete={(results) => onComplete(quizData.id, results)}
      />;
      break;
    case 'statement_sequence':
      quizComponent = <FlowchartQuiz 
        taskId={quizData.taskData.contentID} 
        onComplete={(results) => onComplete(quizData.id, results)}
      />;
      break;
    case 'question_input':
      quizComponent = <QuestionAndAnswerForm
        taskId={quizData.taskData.contentID} 
        onComplete={(results) => onComplete(quizData.id, results)}
      />;
      break;
    case 'pair_input':
      quizComponent = <MatchingQuestionsQuiz
        taskId={quizData.taskData.contentID} 
        onComplete={(results) => onComplete(quizData.id, results)}
      />;
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