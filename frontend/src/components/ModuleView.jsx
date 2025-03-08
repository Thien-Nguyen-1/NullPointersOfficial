import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../services/AuthContext";
import { QuizApiUtils } from "../services/QuizApiUtils";
import { SaveUserModuleInteract, GetUserModuleInteract } from "../services/api";
import FlashcardQuiz from "./quizzes/FlashcardQuiz";
import FillInTheBlanksQuiz from "./quizzes/FillInTheBlanksQuiz";
import FlowchartQuiz from "./quizzes/FlowchartQuiz";
import { FaArrowLeft } from "react-icons/fa";
import { MdThumbUpAlt, MdThumbUpOffAlt, MdBookmark, MdBookmarkBorder } from "react-icons/md";
import "../styles/ModuleView.css";

const ModuleView = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  
  const [module, setModule] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [activeTaskIndex, setActiveTaskIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInteraction, setUserInteraction] = useState({ hasLiked: false, hasPinned: false });

  // Fetch module data when component mounts
  useEffect(() => {
    const fetchModuleData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Fetch module details
        const moduleData = await QuizApiUtils.getModule(moduleId);
        setModule(moduleData);
        
        // Fetch tasks associated with this module
        const moduleTasks = await QuizApiUtils.getModuleSpecificTasks(moduleId);
        setTasks(moduleTasks);
        
        // Fetch tags
        try {
          const tagsResponse = await fetch('/api/tags/');
          const tagsData = await tagsResponse.json();
          setAvailableTags(tagsData);
        } catch (tagsError) {
          console.warn("Could not fetch tags:", tagsError);
        }
        
        // Fetch user interaction data if the user is logged in
        if (user && token) {
          try {
            const interactionsData = await GetUserModuleInteract(token);
            
            // Find the interaction for this specific module
            const moduleInteraction = interactionsData.find(
              interaction => interaction.module === parseInt(moduleId)
            );
            
            if (moduleInteraction) {
              setUserInteraction({
                hasLiked: moduleInteraction.hasLiked,
                hasPinned: moduleInteraction.hasPinned
              });
            }
          } catch (interactionError) {
            console.warn("Could not fetch user interaction data:", interactionError);
          }
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching module data:", err);
        setError("Failed to load module data. Please try again later.");
        setIsLoading(false);
      }
    };
    
    if (moduleId) {
      fetchModuleData();
    }
  }, [moduleId, user, token]);

  // Handle liking/pinning the module
  const handleInteraction = async (action) => {
    if (!user || !token) {
      // Prompt user to log in
      alert("Please log in to save your progress.");
      return;
    }
    
    try {
      const updatedInteraction = { ...userInteraction };
      
      if (action === 'like') {
        updatedInteraction.hasLiked = !userInteraction.hasLiked;
      } else if (action === 'pin') {
        updatedInteraction.hasPinned = !userInteraction.hasPinned;
      }
      
      // Save updated interaction
      const response = await SaveUserModuleInteract(moduleId, updatedInteraction, token);
      
      if (response) {
        setUserInteraction(updatedInteraction);
        
        // Update module upvotes in UI immediately for better UX
        if (action === 'like') {
          setModule(prev => ({
            ...prev,
            upvotes: prev.upvotes + (updatedInteraction.hasLiked ? 1 : -1)
          }));
        }
      }
    } catch (err) {
      console.error("Error updating user interaction:", err);
      setError("Failed to update your interaction with this module.");
    }
  };

  // Handle quiz completion
  const handleQuizComplete = (taskId, results) => {
    // Save quiz results - implement based on your backend
    console.log(`Quiz ${taskId} completed with results:`, results);
    
    // Move to next task if available
    if (activeTaskIndex < tasks.length - 1) {
      setActiveTaskIndex(activeTaskIndex + 1);
    }
  };

  // Get tag name from tag ID
  const getTagName = (tagId) => {
    const tag = availableTags.find(t => t.id === tagId);
    return tag ? tag.tag : `Tag ${tagId}`;
  };

  // Render the appropriate quiz component based on quiz type
  const renderQuiz = (task) => {
    if (!task) return null;
    
    switch (task.quiz_type) {
      case 'flashcard':
        return <FlashcardQuiz taskId={task.contentID} onComplete={(results) => handleQuizComplete(task.contentID, results)} />;
      case 'text_input':
        return <FillInTheBlanksQuiz taskId={task.contentID} onComplete={(results) => handleQuizComplete(task.contentID, results)} />;
      case 'statement_sequence':
        return <FlowchartQuiz taskId={task.contentID} onComplete={(results) => handleQuizComplete(task.contentID, results)} />;
      default:
        return <div className="error-message">Unknown quiz type: {task.quiz_type}</div>;
    }
  };

  if (isLoading) {
    return <div className="module-loading">Loading module data...</div>;
  }

  if (error) {
    return (
      <div className="module-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (!module) {
    return <div className="module-not-found">Module not found</div>;
  }

  return (
    <div className="module-view-container">
      <div className="module-header">
        <button className="back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
        
        <h1 className="module-title">{module.title}</h1>
        
        <div className="module-actions">
          <button 
            className={`like-button ${userInteraction.hasLiked ? 'active' : ''}`}
            onClick={() => handleInteraction('like')}
          >
            {userInteraction.hasLiked ? <MdThumbUpAlt /> : <MdThumbUpOffAlt />}
            <span className="like-count">{module.upvotes}</span>
          </button>
          
          <button 
            className={`pin-button ${userInteraction.hasPinned ? 'active' : ''}`}
            onClick={() => handleInteraction('pin')}
          >
            {userInteraction.hasPinned ? <MdBookmark /> : <MdBookmarkBorder />}
          </button>
        </div>
      </div>
      
      <div className="module-description">
        <p>{module.description}</p>
      </div>
      
      {/* Module tags */}
      {module.tags && module.tags.length > 0 && (
        <div className="module-tags">
          {module.tags.map(tagId => (
            <span key={tagId} className="module-tag">
              {getTagName(tagId)}
            </span>
          ))}
        </div>
      )}
      
      {/* Tasks/quizzes section */}
      {tasks.length > 0 ? (
        <div className="module-content">
          <div className="tasks-navigation">
            <h3>Learning Components</h3>
            <ul>
              {tasks.map((task, index) => (
                <li 
                  key={task.contentID}
                  className={activeTaskIndex === index ? 'active' : ''}
                  onClick={() => setActiveTaskIndex(index)}
                >
                  {index + 1}. {QuizApiUtils.getUITypeFromAPIType(task.quiz_type)}
                </li>
              ))}
            </ul>
          </div>
          
          <div className="task-content">
            {tasks[activeTaskIndex] ? (
              <>
                <h2 className="task-title">
                  {QuizApiUtils.getUITypeFromAPIType(tasks[activeTaskIndex].quiz_type)}
                </h2>
                {renderQuiz(tasks[activeTaskIndex])}
              </>
            ) : (
              <div className="no-tasks-message">
                This module doesn't have any content yet.
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="no-tasks-message">
          This module doesn't have any content yet.
        </div>
      )}
    </div>
  );
};

export default ModuleView;