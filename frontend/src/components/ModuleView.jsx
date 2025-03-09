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
import "../styles/Quizzes.css";

const ModuleView = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  
  const [module, setModule] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [moduleContent, setModuleContent] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [activeContentIndex, setActiveContentIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInteraction, setUserInteraction] = useState({ hasLiked: false, hasPinned: false });

  const [moduleCompleted, setModuleCompleted] = useState(false);
  const [completedContentIds, setCompletedContentIds] = useState(new Set());

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
        

        // ==== For demonstration, we'll add some dummy content ==== //

        // Combine all module content (tasks, images, videos, infosheets)
        const allContent = [
          // Example image content
          {
            id: 'image-1',
            type: 'image',
            title: 'Why is it important?',
            source: 'https://i.pinimg.com/736x/71/62/72/716272f31e9f3d286bf6a26fcf1ea8be.jpg',
            caption: 'Key concepts illustrated in a visual format'
          },
          // Example video content
          {
            id: 'video-1',
            type: 'video',
            title: 'Introduction Video',
            source: 'https://www.example.com/video.mp4',
            duration: '3:45'
          },
          // Example infosheet
          {
            id: 'infosheet-1',
            type: 'infosheet',
            title: 'Key Concepts',
            content: 'This infosheet explains the key concepts covered in this module...'
          }
        ];
        
        // Add tasks as content with 'task' type
        const taskContent = moduleTasks.map(task => ({
          id: task.contentID,
          type: 'task',
          title: QuizApiUtils.getUITypeFromAPIType(task.quiz_type),
          quiz_type: task.quiz_type,
          taskData: task
        }));

        // ==== END DUMMY CONTENT ==== //
        
        // Combine all content types and sort as needed
        setModuleContent([...taskContent, ...allContent]);
        
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
    
    // Move to next content if available
    if (activeContentIndex < moduleContent.length - 1) {
      setActiveContentIndex(activeContentIndex + 1);
    }
  };

  // Get tag name from tag ID
  const getTagName = (tagId) => {
    const tag = availableTags.find(t => t.id === tagId);
    return tag ? tag.tag : `Tag ${tagId}`;
  };


  // Handle content completion
  // const handleContentComplete = (contentId, results) => {
  //   // Add this content to completed set
  //   setCompletedContentIds(prev => {
  //     const updated = new Set(prev);
  //     updated.add(contentId);
  //     return updated;
  //   });
    
  //   // Check if all content is completed
  //   const allContentIds = moduleContent.map(content => content.id);
  //   const updatedCompletedSet = new Set([...completedContentIds, contentId]);
    
  //   // If all content items are completed, mark the module as completed
  //   if (allContentIds.length === updatedCompletedSet.size && 
  //       allContentIds.every(id => updatedCompletedSet.has(id))) {
  //     setModuleCompleted(true);
  //   } else {
  //     // Move to next content if available
  //     if (activeContentIndex < moduleContent.length - 1) {
  //       setActiveContentIndex(activeContentIndex + 1);
  //     }
  //   }
  // };
  const handleContentComplete = (contentId, results) => {
    console.log(`Content completed: ${contentId}`);
    
    // Add this content to completed set
    setCompletedContentIds(prev => {
      const updated = new Set(prev);
      updated.add(contentId);
      console.log("Updated completed IDs:", Array.from(updated));
      return updated;
    });
    
    // Check if all content is completed
    const allContentIds = moduleContent.map(content => content.id);
    console.log("All content IDs:", allContentIds);
    
    const updatedCompletedSet = new Set([...completedContentIds, contentId]);
    console.log("Current completion set:", Array.from(updatedCompletedSet));
    
    // Log the completion check
    const isComplete = allContentIds.length === updatedCompletedSet.size && 
                      allContentIds.every(id => updatedCompletedSet.has(id));
    console.log("Is module complete?", isComplete);
    
    // If all content items are completed, mark the module as completed
    if (isComplete) {
      console.log("Setting module as completed!");
      setModuleCompleted(true);
    } else {
      // Move to next content if available
      if (activeContentIndex < moduleContent.length - 1) {
        setActiveContentIndex(activeContentIndex + 1);
      }
    }
  };
  
  // You can also add a useEffect to monitor the moduleCompleted state:
  useEffect(() => {
    console.log("Module completed state changed:", moduleCompleted);
  }, [moduleCompleted]);

  // Module completion congratulations screen
  const renderModuleCompletion = () => {

    // Get the user role from the AuthContext
    const role = user?.user_type || 'worker'; // Default to 'worker' if role is undefined
    // Create the correct path based on role
    const coursesPath = role === 'admin' ? '/admin/all-courses' : '/worker/all-courses';
    
    return (
      <div className="module-completion">
        <div className="congratulations-icon">🎉</div>
        <h2>Congratulations!</h2>
        <p>You have successfully completed all content in this module.</p>
        <p className="completion-message">
          Your progress has been saved. You can now continue to explore other modules.
        </p>
        <div className="completion-actions">
          <button 
            className="back-to-modules-button"
            onClick={() => navigate(coursesPath)} // TO BE EDITED LATER
          >
            Back to Modules
          </button>
        </div>
      </div>
    );
  };
  
  // Render appropriate content based on type
  const renderContent = (content) => {
    if (!content) return null;
    
    const contentId = content.id || `${content.type}-${Math.random().toString(36).substr(2, 9)}`;
    
    switch (content.type) {
      case 'task':
        return renderTask(content.taskData, contentId);
      case 'image':
        return renderImage(content, contentId);
      case 'video':
        return renderVideo(content, contentId);
      case 'infosheet':
        return renderInfosheet(content, contentId);
      default:
        return <div className="error-message">Unknown content type: {content.type}</div>;
    }
  };
  
  // Render a task (quiz)
  const renderTask = (taskData, contentId) => {
    if (!taskData) return null;
    
    let quizComponent = null;
    
    switch (taskData.quiz_type) {
      case 'flashcard':
        quizComponent = <FlashcardQuiz 
          taskId={taskData.contentID} 
          onComplete={(results) => handleContentComplete(contentId, results)}
        />;
        break;
      case 'text_input':
        quizComponent = <FillInTheBlanksQuiz 
          taskId={taskData.contentID} 
          onComplete={(results) => handleContentComplete(contentId, results)}
        />;
        break;
      case 'statement_sequence':
        quizComponent = <FlowchartQuiz 
          taskId={taskData.contentID} 
          onComplete={(results) => handleContentComplete(contentId, results)}
        />;
        break;
      default:
        return <div className="error-message">Unknown quiz type: {taskData.quiz_type}</div>;
    }
    
    
    // Wrap quiz component in the component wrapper
    return (
      <div className="component-wrapper">
        {quizComponent}
      </div>
    );
  };


  // Render an image component
  const renderImage = (imageData, contentId) => {
    return (
      <div className="component-wrapper">
        <div className="image-component">
          <div className="image-instructions">
            <h3>{imageData.title}</h3>
            <p>Insert your image below.</p>
          </div>
          
          <div className="image-container">
            <img 
              src={imageData.source} 
              alt={imageData.title}
              style={{ maxWidth: '100%', height: 'auto', borderRadius: '8px' }}
            />
          </div>
          
          <div className="image-caption">
            <p><strong>Figure:</strong> {imageData.caption}</p>
          </div>
  
          <div className="mark-complete-section">
            <button 
              className="mark-complete-button"
              onClick={() => handleContentComplete(contentId, { viewed: true })}
            >
              Mark as Viewed
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Render a video component
  const renderVideo = (videoData, contentId) => {
    return (
      <div className="component-wrapper">
        <div className="video-component">
          <h3>{videoData.title}</h3>
          <div className="video-container">
            <video controls>
              <source src={videoData.source} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </div>
          <div className="video-duration">
            <p>Duration: {videoData.duration}</p>
          </div>
  
          <div className="mark-complete-section">
            <button 
              className="mark-complete-button"
              onClick={() => handleContentComplete(contentId, { viewed: true })}
            >
              Mark as Viewed
            </button>
          </div>
        </div>
      </div>
    );
  };
  

  // Render an infosheet component
  const renderInfosheet = (infosheetData, contentId) => {
    return (
      <div className="component-wrapper">
        <div className="infosheet-component">
          <h3 className="infosheet-title">{infosheetData.title}</h3>
          <div className="infosheet-content">
            <p>{infosheetData.content}</p>
          </div>
  
          <div className="mark-complete-section">
            <button 
              className="mark-complete-button"
              onClick={() => handleContentComplete(contentId, { viewed: true })}
            >
              Mark as Viewed
            </button>
          </div>
        </div>
      </div>
    );
  };



  if (isLoading) {
    return <div className="module-view-container module-loading">Loading module data...</div>;
  }

  if (error) {
    return (
      <div className="module-view-container module-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (!module) {
    return <div className="module-view-container module-not-found">Module not found</div>;
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
      
      {/* Module content section */}
      {moduleContent.length > 0 ? (
        <div className="module-content"> 
          {moduleCompleted ? (
            // When module is completed, show ONLY the congratulations screen
            renderModuleCompletion()
          ) : (
            // Otherwise show regular content with navigation and content
            <>
              {/* Sidebar */}
              <div className="tasks-navigation">
                <h3>Module Contents</h3>
                <ul>
                  {moduleContent.map((content, index) => (
                    <li 
                      key={content.id}
                      className={`
                        ${activeContentIndex === index ? 'active' : ''} 
                        ${completedContentIds.has(content.id) ? 'completed' : ''}
                      `}
                      onClick={() => setActiveContentIndex(index)}
                    >
                      {index + 1}. {content.title}
                      {completedContentIds.has(content.id) && (
                        <span className="completed-check">✓</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="task-content">
                {moduleContent[activeContentIndex] ? (
                  <>
                    <h2 className="task-title">
                      {moduleContent[activeContentIndex].title}
                    </h2>
                    {renderContent(moduleContent[activeContentIndex])}
                  </>
                ) : (
                  <div className="no-tasks-message">
                    This module doesn't have any content yet.
                  </div>
                )}
              </div>
            </>
          )}
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