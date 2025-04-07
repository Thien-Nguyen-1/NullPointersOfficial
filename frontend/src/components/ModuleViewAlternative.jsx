import React, { useState, useEffect, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../services/AuthContext";
import { QuizApiUtils } from "../services/QuizApiUtils";
import DocumentService from "../services/DocumentService";
import AudioService from "../services/AudioService";
import VideoService from "../services/VideoService";
import ImageService from "../services/ImageService";
import { usePreviewMode } from "../services/PreviewModeContext";

import { SaveUserModuleInteract, GetUserModuleInteract } from "../services/api";
import { FaArrowLeft } from "react-icons/fa";
import { MdThumbUpAlt, MdThumbUpOffAlt, MdBookmark, MdBookmarkBorder } from "react-icons/md";

import ContentRenderer from "./module-content/ContentRenderer";
import TableOfContents from "./module-content/TableOfContents";
import ModuleCompletion from "./module-content/ModuleCompletion";

import "../styles/AlternativeModuleView.css";
import "../styles/Quizzes.css";
import "../styles/PreviewMode.css"

const ModuleViewAlternative = () => {
  const { moduleId } = useParams();
  const navigate = useNavigate();
  const { user, token } = useContext(AuthContext);
  
  const { isPreviewMode, previewData, exitPreviewMode } = usePreviewMode();
  
  const [module, setModule] = useState(null);
  const [moduleContent, setModuleContent] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInteraction, setUserInteraction] = useState({ hasLiked: false, pinned: false });
  const [completedContentIds, setCompletedContentIds] = useState(new Set());
  const [moduleCompleted, setModuleCompleted] = useState(false);
  const [activeSection, setActiveSection] = useState(null);


  // Handle preview mode data
  useEffect(() => {
    if (isPreviewMode && previewData) {
      setModule(previewData.module);
      setModuleContent(previewData.moduleContent);
      setAvailableTags(previewData.availableTags|| []);
      setIsLoading(false);
    }
  }, [isPreviewMode, previewData])

  // Fetch module data when component mounts (only in NON-PREVIEW MODE)
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
        const moduleVideos = await VideoService.getModuleVideos(moduleId);
        console.log("Videos for module:", moduleVideos);
        const moduleImages = await ImageService.getModuleImages(moduleId);
        console.log("Pictures for module:", moduleImages);

        // add future media ...

        // Combine all resources into a single array with a type identifier
        const allResources = [
          ...moduleDocuments.map(item => ({ ...item, mediaType: 'document' })),
          ...moduleAudios.map(item => ({ ...item, mediaType: 'audio' })),
          ...moduleVideos.map(item => ({ ...item, mediaType: 'video' })),
          ...moduleImages.map(item => ({ ...item, mediaType: 'image' }))
        ];
        // Sort all resources by creation time
        allResources.sort((a, b) => {
          const dateA = new Date(a.created_at);
          const dateB = new Date(b.created_at);
          return dateA - dateB;  // Oldest first
        });

        // Create a resources section if there are media types: documents, etc...
        // const resourcesItems = [
        //   // Documents
        //   ...moduleDocuments.map(doc => ({
        //     id: doc.contentID,
        //     type: 'infosheet',
        //     title: doc.title || doc.filename,
        //     content: `View or download: ${doc.filename}`,
        //     documents: [doc],
        //     moduleId: moduleId
        //   })),
          
        //   // Audio files
        //   ...moduleAudios.map(audio => ({
        //     id: audio.contentID,
        //     type: 'audio',
        //     title: audio.title || audio.filename,
        //     content: `Listen to: ${audio.filename}`,
        //     audioFiles: [audio],
        //     moduleId: moduleId
        //   })),
        //   // Avideos
        //   ...moduleVideos.map(video => ({
        //     id: video.contentID,
        //     type: 'video',
        //     title: video.title || 'Embedded Video',
        //     content: `Watch: ${video.title || 'Video'}`,
        //     video_url: video.video_url, // Platform video URL
        //     videos: [video], // Include full video data for downloads
        //     moduleId: moduleId
        //   })),
        //   // Image
        //   ...moduleImages.map(image => ({
        //     id: image.contentID,
        //     type: 'image',
        //     title: image.title || 'Image',
        //     content: `Check out: ${image.title || 'Image'}`,
        //     file_url: image.file_url,
        //     source: image.file_url ? 
        //     (image.file_url.startsWith('http') ? image.file_url : `http://localhost:8000${image.file_url}`) : null,
        //     // the image URLs in the system were relative paths -> need to be converted to absolute URLs for the browser to properly load them
        //     filename: image.filename,
        //     width: image.width,
        //     height: image.height,
        //     imageFiles: [image], 
        //     moduleId: moduleId
        //   // add future media
        //   })),
        // ];

        const resourcesItems = allResources.map(resource => {
          switch (resource.mediaType) {
            case 'document':
              return {
                id: resource.contentID,
                type: 'infosheet',
                title: resource.title || resource.filename,
                content: `View or download: ${resource.filename}`,
                documents: [resource],
                moduleId: moduleId
              };
            case 'audio':
              return {
                id: resource.contentID,
                type: 'audio',
                title: resource.title || resource.filename,
                content: `Listen to: ${resource.filename}`,
                audioFiles: [resource],
                moduleId: moduleId
              };
            case 'video':
              return {
                id: resource.contentID,
                type: 'video',
                title: resource.title || 'Embedded Video',
                content: `Watch: ${resource.title || 'Video'}`,
                video_url: resource.video_url,
                videos: [resource],
                moduleId: moduleId
              };
            case 'image':
              return {
                id: resource.contentID,
                type: 'image',
                title: resource.title || 'Image',
                content: `Check out: ${resource.title || 'Image'}`,
                file_url: resource.file_url,
                source: resource.file_url ? 
                  (resource.file_url.startsWith('http') ? resource.file_url : `http://localhost:8000${resource.file_url}`) : null,
                filename: resource.filename,
                width: resource.width,
                height: resource.height,
                imageFiles: [resource],
                moduleId: moduleId
              };
            default:
              return null;
          }
        }).filter(Boolean);

        const assessmentItems = [
          ...moduleTasks.map(task => ({
            id: task.contentID,
            type: 'quiz',
            quiz_type: task.quizType,
            title: task.type,
          }))
        ]
          

        
        // Create a structured content from the tasks
        // This transforms flat task data into sections with content
        const structuredContent = [
          {
            id: 'section-introduction',
            type: 'section',
            title: 'Introduction',
            content: [
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

        // Add Assessment section if there are assesment items 
        if (assessmentItems.length > 0) {
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
        }


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
  }, [moduleId, user, token, isPreviewMode]);

  // Handle liking/pinning the module
  const handleInteraction = async (action) => {
    if (isPreviewMode) return; // disable interactions iin preview mode

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
    if (isPreviewMode) return; // skip content completion in preview mode

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

  // In preview mode, handle the navigation differently
  const handleNavigation = () => {
    if (isPreviewMode) {
      exitPreviewMode(0); 
    } else {
      navigate(-1); // regular navigation
    }
  }

  

  if (isLoading) {
    return <div className="alt-module-container alt-loading">Loading module data...</div>;
  }

  if (error) {
    return (
      <div className="alt-module-container alt-error">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => {handleNavigation}}>Go Back</button>
      </div>
    );
  }

  if (!module) {
    return <div className="alt-module-container alt-not-found">Module not found</div>;
  }

  return (
    <div className={`alt-module-container ${isPreviewMode ? 'preview-mode' : ''}`}>
      {isPreviewMode && <div className="preview-banner">PREVIEW MODE</div>}
      
      {/* Module Header */}
      <div className="alt-module-header">
        <button className={`alt-back-button ${isPreviewMode ? 'preview-disabled' : ''}`}
          onClick={handleNavigation}>
          <FaArrowLeft /> {isPreviewMode ? "Exit Preview" : "Back"}
        </button>
        
        <h1 className="alt-module-title">{module.title}</h1>
        
        <div className="alt-module-actions">
          <button 
            className={`alt-like-button ${userInteraction.hasLiked ? 'active' : ''} ${isPreviewMode ? 'preview-disabled' : ''}`}
            onClick={() => handleInteraction('like')}
            disabled={isPreviewMode}
          >
            {userInteraction.hasLiked ? <MdThumbUpAlt /> : <MdThumbUpOffAlt />}
            <span className="alt-like-count">{module.upvotes}</span>
          </button>
          
          <button 
            className={`alt-pin-button ${userInteraction.pinned ? 'active' : ''} ${isPreviewMode ? 'preview-disabled' : ''}`}
            onClick={() => handleInteraction('pin')}
            disabled={isPreviewMode}
          >
            {userInteraction.pinned ? <MdBookmark /> : <MdBookmarkBorder />}
          </button>
        </div>
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
      
      {moduleCompleted&& !isPreviewMode ? (
        // When module is completed, show congratulations screen (and NOT in preview mode)
        <ModuleCompletion user={user} />
      ) : (
        // Otherwise show module content
        <div className="alt-content-layout">
          {/* Table of Contents */}
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
                        isPreviewMode={isPreviewMode}
                        />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {isPreviewMode && (
        <div className="preview-notice-container">
        <p className="preview-notice">
          This is a preview mode. In the published version, users will be able to interact 
          with content and track their progress.
        </p>
        <button 
          className="exit-preview-btn" 
          onClick={exitPreviewMode}
        >
          Exit Preview
        </button>
      </div>
      )}
    </div>
  );
};

export default ModuleViewAlternative;