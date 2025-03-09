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
import "../styles/AlternativeModuleView.css";
import "../styles/Quizzes.css";

const ModuleViewAlternative = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  
  const [module, setModule] = useState(null);
  const [moduleContent, setModuleContent] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInteraction, setUserInteraction] = useState({ hasLiked: false, hasPinned: false });
  const [completedContentIds, setCompletedContentIds] = useState(new Set());
  const [moduleCompleted, setModuleCompleted] = useState(false);
  const [activeSection, setActiveSection] = useState(null);

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
        
        // ==== For demonstration, we'll create structured module content ==== //        
        // Create sections with different content types
        const structuredContent = [
          {
            id: 'section-introduction',
            type: 'section',
            title: 'Introduction',
            content: [
              {
                id: 'heading-intro',
                type: 'heading',
                level: 1,
                text: 'Welcome to this Module'
              },
              {
                id: 'paragraph-intro',
                type: 'paragraph',
                text: 'This module will guide you through important concepts and allow you to test your knowledge through various interactive elements. Take your time to go through each section carefully.'
              },
              {
                id: 'image-1',
                type: 'image',
                title: 'Overview',
                source: 'https://i.pinimg.com/736x/71/62/72/716272f31e9f3d286bf6a26fcf1ea8be.jpg',
                caption: 'Visual overview of concepts covered in this module'
              }
            ]
          },
          {
            id: 'section-concepts',
            type: 'section',
            title: 'Key Concepts',
            content: [
              {
                id: 'heading-concepts',
                type: 'heading',
                level: 2,
                text: 'Core Principles'
              },
              {
                id: 'paragraph-concepts',
                type: 'paragraph',
                text: 'Understanding these core principles is essential before proceeding to more advanced topics.'
              },
              {
                id: 'infosheet-1',
                type: 'infosheet',
                title: 'Important Information',
                content: 'This infosheet explains the key concepts covered in this module. Make sure you understand these before proceeding to the assessment section.'
              },
              {
                id: 'video-1',
                type: 'video',
                title: 'Concept Explanation',
                source: 'https://www.example.com/video.mp4',
                duration: '3:45',
                thumbnail: 'https://via.placeholder.com/640x360?text=Video+Thumbnail'
              }
            ]
          },
          {
            id: 'section-assessment',
            type: 'section',
            title: 'Assessment',
            content: moduleTasks.map(task => ({
              id: task.contentID,
              type: 'quiz',
              quiz_type: task.quiz_type,
              title: QuizApiUtils.getUITypeFromAPIType(task.quiz_type),
              taskData: task
            }))
          }
        ];
        
        setModuleContent(structuredContent);
        
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

  // Get tag name from tag ID
  const getTagName = (tagId) => {
    const tag = availableTags.find(t => t.id === tagId);
    return tag ? tag.tag : `Tag ${tagId}`;
  };

  // Handle content completion
  const handleContentComplete = (contentId, results) => {
    console.log(`Content completed: ${contentId}`);
    
    // Add this content to completed set
    setCompletedContentIds(prev => {
      const updated = new Set(prev);
      updated.add(contentId);
      console.log("Updated completed IDs:", Array.from(updated));
      return updated;
    });
    
    // Calculate all content IDs that need to be completed
    let allContentIds = [];
    
    // Go through each section and gather all completable content IDs
    moduleContent.forEach(section => {
      if (section.content) {
        section.content.forEach(item => {
          if (['quiz', 'image', 'video', 'infosheet'].includes(item.type)) {
            allContentIds.push(item.id);
          }
        });
      }
    });
    
    console.log("All content IDs:", allContentIds);
    
    const updatedCompletedSet = new Set([...completedContentIds, contentId]);
    console.log("Current completion set:", Array.from(updatedCompletedSet));
    
    // Check if all content is completed
    const isComplete = allContentIds.length === updatedCompletedSet.size && 
                      allContentIds.every(id => updatedCompletedSet.has(id));
    console.log("Is module complete?", isComplete);
    
    // If all content items are completed, mark the module as completed
    if (isComplete) {
      console.log("Setting module as completed!");
      setModuleCompleted(true);
    }
  };
  
  // Monitor module completion state
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
      <div className="alt-module-completion">
        <div className="congratulations-icon">🎉</div>
        <h2>Congratulations!</h2>
        <p>You have successfully completed all content in this module.</p>
        <p className="completion-message">
          Your progress has been saved. You can now continue to explore other modules.
        </p>
        <div className="completion-actions">
          <button 
            className="back-to-modules-button"
            onClick={() => navigate(coursesPath)}
          >
            Back to Modules
          </button>
        </div>
      </div>
    );
  };
  
  // Render a quiz component
  const renderQuiz = (quizData) => {
    if (!quizData || !quizData.taskData) return null;
    
    let quizComponent = null;
    
    switch (quizData.quiz_type) {
      case 'flashcard':
        quizComponent = <FlashcardQuiz 
          taskId={quizData.taskData.contentID} 
          onComplete={(results) => handleContentComplete(quizData.id, results)}
        />;
        break;
      case 'text_input':
        quizComponent = <FillInTheBlanksQuiz 
          taskId={quizData.taskData.contentID} 
          onComplete={(results) => handleContentComplete(quizData.id, results)}
        />;
        break;
      case 'statement_sequence':
        quizComponent = <FlowchartQuiz 
          taskId={quizData.taskData.contentID} 
          onComplete={(results) => handleContentComplete(quizData.id, results)}
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

  // Render an image component
  const renderImage = (imageData) => {
    return (
      <div className="alt-component">
        <div className="alt-component-header">
          <h3>{imageData.title}</h3>
          {completedContentIds.has(imageData.id) && (
            <span className="completed-check">✓</span>
          )}
        </div>
        <div className="alt-component-content">
          <div className="alt-image-container">
            <img 
              src={imageData.source} 
              alt={imageData.title}
              className="alt-image"
            />
          </div>
          
          {imageData.caption && (
            <div className="alt-image-caption">
              <p>{imageData.caption}</p>
            </div>
          )}
          
          <div className="alt-mark-complete">
            {!completedContentIds.has(imageData.id) && (
              <button 
                className="mark-complete-button"
                onClick={() => handleContentComplete(imageData.id, { viewed: true })}
              >
                Mark as Viewed
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render a video component
  const renderVideo = (videoData) => {
    return (
      <div className="alt-component">
        <div className="alt-component-header">
          <h3>{videoData.title}</h3>
          {completedContentIds.has(videoData.id) && (
            <span className="completed-check">✓</span>
          )}
        </div>
        <div className="alt-component-content">
          <div className="alt-video-container">
            {videoData.source ? (
              <video controls className="alt-video">
                <source src={videoData.source} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="alt-video-placeholder">
                <img src={videoData.thumbnail} alt="Video thumbnail" />
                <div className="alt-video-play-button">▶</div>
              </div>
            )}
          </div>
          
          {videoData.duration && (
            <div className="alt-video-duration">
              <p>Duration: {videoData.duration}</p>
            </div>
          )}
          
          <div className="alt-mark-complete">
            {!completedContentIds.has(videoData.id) && (
              <button 
                className="mark-complete-button"
                onClick={() => handleContentComplete(videoData.id, { viewed: true })}
              >
                Mark as Viewed
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render an infosheet component
  const renderInfosheet = (infosheetData) => {
    return (
      <div className="alt-component">
        <div className="alt-component-header">
          <h3>{infosheetData.title}</h3>
          {completedContentIds.has(infosheetData.id) && (
            <span className="completed-check">✓</span>
          )}
        </div>
        <div className="alt-component-content">
          <div className="alt-infosheet">
            <p>{infosheetData.content}</p>
          </div>
          
          <div className="alt-mark-complete">
            {!completedContentIds.has(infosheetData.id) && (
              <button 
                className="mark-complete-button"
                onClick={() => handleContentComplete(infosheetData.id, { viewed: true })}
              >
                Mark as Viewed
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render heading
  const renderHeading = (headingData) => {
    const HeadingTag = `h${headingData.level}`;
    return (
      <div className="alt-heading">
        <HeadingTag>{headingData.text}</HeadingTag>
      </div>
    );
  };

  // Render paragraph
  const renderParagraph = (paragraphData) => {
    return (
      <div className="alt-paragraph">
        <p>{paragraphData.text}</p>
      </div>
    );
  };

  // Render content item based on type
  const renderContentItem = (item) => {
    switch (item.type) {
      case 'heading':
        return renderHeading(item);
      case 'paragraph':
        return renderParagraph(item);
      case 'image':
        return renderImage(item);
      case 'video':
        return renderVideo(item);
      case 'infosheet':
        return renderInfosheet(item);
      case 'quiz':
        return renderQuiz(item);
      default:
        return <div className="alt-error">Unknown content type: {item.type}</div>;
    }
  };

  // Table of Contents
  const renderTableOfContents = () => {
    return (
      <div className="alt-table-of-contents">
        <h3>Table of Contents</h3>
        <ul>
          {moduleContent.map((section) => (
            <li 
              key={section.id}
              className={activeSection === section.id ? 'active' : ''}
              onClick={() => {
                document.getElementById(section.id).scrollIntoView({ behavior: 'smooth' });
                setActiveSection(section.id);
              }}
            >
              {section.title}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  if (isLoading) {
    return <div className="alt-module-container alt-loading">Loading module data...</div>;
  }

  if (error) {
    return (
      <div className="alt-module-container alt-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate(-1)}>Go Back</button>
      </div>
    );
  }

  if (!module) {
    return <div className="alt-module-container alt-not-found">Module not found</div>;
  }

  return (
    <div className="alt-module-container">
      {/* Module Header */}
      <div className="alt-module-header">
        <button className="alt-back-button" onClick={() => navigate(-1)}>
          <FaArrowLeft /> Back
        </button>
        
        <h1 className="alt-module-title">{module.title}</h1>
        
        <div className="alt-module-actions">
          <button 
            className={`alt-like-button ${userInteraction.hasLiked ? 'active' : ''}`}
            onClick={() => handleInteraction('like')}
          >
            {userInteraction.hasLiked ? <MdThumbUpAlt /> : <MdThumbUpOffAlt />}
            <span className="alt-like-count">{module.upvotes}</span>
          </button>
          
          <button 
            className={`alt-pin-button ${userInteraction.hasPinned ? 'active' : ''}`}
            onClick={() => handleInteraction('pin')}
          >
            {userInteraction.hasPinned ? <MdBookmark /> : <MdBookmarkBorder />}
          </button>
        </div>
      </div>
      
      {/* Module Description */}
      <div className="alt-module-description">
        <p>{module.description}</p>
      </div>
      
      {/* Module Tags */}
      {module.tags && module.tags.length > 0 && (
        <div className="alt-module-tags">
          {module.tags.map(tagId => (
            <span key={tagId} className="alt-module-tag">
              {getTagName(tagId)}
            </span>
          ))}
        </div>
      )}
      
      {moduleCompleted ? (
        // When module is completed, show congratulations screen
        renderModuleCompletion()
      ) : (
        // Otherwise show module content
        <div className="alt-content-layout">
          {/* Table of Contents (fixed on scroll) */}
          <div className="alt-sidebar">
            {renderTableOfContents()}
          </div>
          
          {/* Main Content Area */}
          <div className="alt-content-area">
            {moduleContent.map((section) => (
              <div key={section.id} id={section.id} className="alt-section">
                <div className="alt-section-header">
                  <h2>{section.title}</h2>
                </div>
                
                <div className="alt-section-content">
                  {section.content && section.content.map((item) => (
                    <div key={item.id} className="alt-content-item">
                      {renderContentItem(item)}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ModuleViewAlternative;