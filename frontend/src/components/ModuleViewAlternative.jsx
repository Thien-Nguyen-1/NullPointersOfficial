import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../services/AuthContext";
import { QuizApiUtils } from "../services/QuizApiUtils";
import DocumentService from "../services/DocumentService";
import AudioService from "../services/AudioService";
import { SaveUserModuleInteract, GetUserModuleInteract } from "../services/api";
import { FaArrowLeft } from "react-icons/fa";
import { MdThumbUpAlt, MdThumbUpOffAlt, MdBookmark, MdBookmarkBorder } from "react-icons/md";

import ContentRenderer from "./module-content/ContentRenderer";
import TableOfContents from "./module-content/TableOfContents";
import ModuleCompletion from "./module-content/ModuleCompletion";

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
  const [userInteraction, setUserInteraction] = useState({ hasLiked: false, pinned: false });
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
      const moduleDocuments = await DocumentService.getModuleDocuments(moduleId);
      console.log("Documents for module:", moduleDocuments);
      const moduleAudios = await AudioService.getModuleAudios(moduleId);
      console.log("Audio files for module:", moduleAudios);
      // add future media ...


      // Create a resources section if there are media types: documents, etc...
      const resourcesItems = [
        // Documents
        ...moduleDocuments.map(doc => ({
          id: doc.contentID,
          type: 'infosheet',
          title: doc.title || doc.filename,
          content: `View or download: ${doc.filename}`,
          documents: [doc],
          moduleId: moduleId
        })),
        
        // Audio files
        ...moduleAudios.map(audio => ({
          id: audio.contentID,
          type: 'audio',
          title: audio.title || audio.filename,
          content: `Listen to: ${audio.filename}`,
          audioFiles: [audio],
          moduleId: moduleId
        }))
        // add future media
      ];
      
      // Create a structured content from the tasks
      // This transforms flat task data into sections with content
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
              text: moduleData.title
            },
            {
              id: 'paragraph-intro',
              type: 'paragraph',
              text: moduleData.description
            }
          ]
        },

      ];

      // Add Resources section if there are any resources
      if (resourcesItems.length > 0) {
        structuredContent.push({
          id: 'section-resources',
          type: 'section',
          title: 'Resources',
          content: resourcesItems
        });
      }

      // Add Assessment section
      structuredContent.push({
        id: 'section-assessment',
        type: 'section',
        title: 'Assessment',
        content: moduleTasks.map(task => ({
          id: task.contentID,
          type: 'quiz',
          quiz_type: task.quiz_type,
          title: task.title || QuizApiUtils.getUITypeFromAPIType(task.quiz_type),
          taskData: task
        }))
      });


      

      
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
              pinned: moduleInteraction.pinned
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
        updatedInteraction.pinned = !userInteraction.pinned;
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
  
// Handle content completion
const handleContentComplete = async (contentId, results) => {    
    // Add this content to completed set
    setCompletedContentIds(prev => {
      const updated = new Set(prev);
      updated.add(contentId);
      return updated;
    });
    
    // Find the completed quiz data
    const completedContent = moduleContent.flatMap(section => 
      section.content?.filter(item => item.id === contentId) || [] // Find the content item matching contentId
    )[0];
    
    // If this is a quiz, submit the answers to the backend
    if (completedContent && completedContent.type === 'quiz' && completedContent.taskData) {
      try {        
        if (user && token) {
          const saveResult = await QuizApiUtils.submitQuizAnswers(
            completedContent.taskData.contentID, 
            results,
            token
          );
        } else {
          console.warn("User not logged in - quiz answers will not be saved to backend");
        }
      } catch (err) {
        console.error("Failed to save quiz answers:", err);
        // Don't block completion if saving fails
      }
    }
    
    // Calculate all content IDs that need to be completed
    let allContentIds = [];
    
    // Go through each section and gather all completable content IDs
    moduleContent.forEach(section => {
      if (section.content) {
        section.content.forEach(item => {
            // Check if the content type is one that requires completion tracking
          if (['quiz', 'image', 'video', 'infosheet', 'audio'].includes(item.type)) { // add future media
            allContentIds.push(item.id);
          }
        });
      }
    });
    
    
    const updatedCompletedSet = new Set([...completedContentIds, contentId]);
    
    // Check if all content is completed
    const isComplete = allContentIds.length === updatedCompletedSet.size && 
                       allContentIds.every(id => updatedCompletedSet.has(id));
    
    // If all content items are completed, mark the module as completed
    if (isComplete) {
      setModuleCompleted(true);
    }
  };
  
  // Monitor module completion state
  useEffect(() => {
  }, [moduleCompleted]);

  

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
            className={`alt-pin-button ${userInteraction.pinned ? 'active' : ''}`}
            onClick={() => handleInteraction('pin')}
          >
            {userInteraction.pinned ? <MdBookmark /> : <MdBookmarkBorder />}
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
        <ModuleCompletion user={user} />
      ) : (
        // Otherwise show module content
        <div className="alt-content-layout">
          {/* Table of Contents (fixed on scroll) */}
          <div className="alt-sidebar">
            <TableOfContents 
                moduleContent={moduleContent} 
                activeSection={activeSection}
                setActiveSection={setActiveSection}
            />
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
                        <ContentRenderer 
                        item={item}
                        completedContentIds={completedContentIds}
                        onContentComplete={handleContentComplete}
                        />
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