// Main Component File: AddModule.jsx
// MAIN PAGE FOR CREATING AND EDITING COURSE MODULES 

/**
 * REFACTORED
 * 
 * How the refactored files work together:
 * 
 * - AddModule.jsx (this file): 
 *   - core orchestration of the module creation/editing flow
 *   - contains the main state and rendering logic
 *   - delegates specific functionality to child components and hooks
 * 
 * - Components:
 *   - ModuleEditorComponent: this renders the appropriate editor based on module type
 *     and handles the refs for accessing editor methods
 *   - ModuleDropdown: manages the dropdown menu for adding new components
 *   - TagsManager: handles tag display, addition and removal
 * 
 * - Custom Hooks:
 *   - useModuleData: manages module data fetching and state 
 *     (used for loading existing modules in edit mode)
 *   - useEditorRefs: manages references to editor components so we can call
 *     methods like getQuestions() on them
 *   - useTags: handles tag related API calls and state management
 *   - useMediaDeletions: tracks media items that need to be deleted when
 *     a user removes media in edit mode
 * 
 * TO ADD A NEW MODULE TYPE:
 * 1. Add your new module type to moduleOptions or media in this file
 * 2. Create the editor component in the components directory
 * 3. Update ModuleEditorComponent to render your new component
 * 4. Add any special processing logic to handleTemplateModule or handleMediaModule
 * 
 * to store new types of data, consider creating a new custom hook.
 */

import React, { useState, useEffect, useRef, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../services/AuthContext";
import { QuizApiUtils } from "../services/QuizApiUtils";
import DocumentService from "../services/DocumentService";
import AudioService from "../services/AudioService";
import ImageService from "../services/ImageService";
import VideoService from "../services/VideoService";
import { usePreviewMode } from "../services/PreviewModeContext";


import { ModuleEditorComponent } from "../components/module-builder/ModuleEditorComponent";
import { ModuleDropdown } from "../components/module-builder/ModuleDropdown";
import { TagsManager } from "../components/module-builder/TagsManager";

import { useModuleData } from "../hooks/useModuleData";
import { useEditorRefs } from "../hooks/useEditorRefs";
import { useTags } from "../hooks/useTags";
import { useMediaDeletions } from "../hooks/useMediaDeletions";

import styles from "../styles/AddModule.module.css";
import "../styles/AlternativeModuleView.css"; 
import ModuleViewAlternative from "../components/ModuleViewAlternative";
import RankingQuizEditor from "../components/editors/RankingQuizEditor";

const AddModule = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);
  const { user: currentUser } = useContext(AuthContext);
  
  const params = new URLSearchParams(location.search);
  const editId = params.get('edit');
  const isEditing = Boolean(editId);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [headingSize, setHeadingSize] = useState("heading1");
  const {isPreviewMode, enterPreviewMode, exitPreviewMode} = usePreviewMode(); // using context-based approach
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const { modules, setModules, fetchModuleData } = useModuleData(editId);
  const { editorRefs, initialQuestionsRef } = useEditorRefs();
  const { tags, setTags, availableTags, setAvailableTags, fetchTags, addTag, removeTag } = useTags();
  const { pendingDeletions, setPendingDeletions } = useMediaDeletions();

  const [cachedQuestions, setCachedQuestions] = useState({});
  const [cachedDocuments, setCachedDocuments] = useState({});
  const [cachedAudios, setCachedAudios] = useState({}); 
  const [cachedImages, setCachedImages] = useState({});
  const [cachedVideos, setCachedVideos] = useState({});

  // Module and component type definitions // 
  const moduleOptions = {
    "Flashcard Quiz": { component: "VisualFlashcardEditor", type: "flashcard" },
    "Fill in the Blanks": { component: "VisualFillTheFormEditor", type: "text_input" },
    "Flowchart Quiz": { component: "VisualFlowChartQuiz", type: "statement_sequence" },
    'Question and Answer Form': { component: "VisualQuestionAndAnswerFormEditor", type:'question_input'},
    'Matching Question Quiz': {component: "VisualMatchingQuestionsQuizEditor", type:'pair_input'},
    'Ranking Quiz': {component: "RankingQuizEditor", type:'ranking_quiz'}
  };

  const media = {
    'Upload Document': {component: "DocumentEditorWrapper", type:'document'},
    'Upload Audio': {component: "AudioEditorWrapper", type:'audio'},
    'Upload Image': {component: "InlinePictureEditorWrapper", type:'image'},
    'Link Video': {component: "EmbeddedVideoEditorWrapper", type:'video'}
    // future media
  };
  
  // initialize components
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (isEditing) {
      fetchModuleData(editId, initialQuestionsRef).then(moduleData => {
        if (moduleData) {
          setTitle(moduleData.title);
          setDescription(moduleData.description || "");
          setTags(moduleData.tags || []);
        }
      }).catch(error => {
        console.error("Error loading module data:", error);
        setError("Failed to load module data. Please try again.");
      });
    }

    fetchTags();
  }, [currentUser, navigate, isEditing, editId, fetchModuleData, fetchTags, initialQuestionsRef]);

  const handlePreview = () => {
    if (!title.trim()) {
      setError("Module title is required for preview");
      return;
    }
  
    // Temporarily store cached questions
    const tempCachedQuestions = {};
    
    // Create an introduction section
    const introductionSection = {
      id: 'section-introduction',
      type: 'section',
      title: 'Introduction',
      content: [
        {
          id: 'paragraph-intro',
          type: 'paragraph',
          text: description || "No description provided."
        }
      ]
    };
  
    // Arrays to hold resources and assessment content
    const resourceItems = [];
    const assessmentItems = [];
  
    // Process modules to build the content structure
    modules.forEach((module, index) => {
      // Process media components (Resources)
      if (module.componentType === "media") {
        if (module.mediaType === "document") {
          const editor = editorRefs.current[module.id];
          const tempFiles = editor?.getTempFiles?.() || [];

          // Cache document files
          setCachedDocuments(prev => ({
            ...prev,
            [module.id]: tempFiles
          }));
          
          tempFiles.forEach(fileData => {
            const fileUrl = fileData.originalDocument 
              ? fileData.originalDocument.file_url 
              : URL.createObjectURL(fileData.file);
  
            resourceItems.push({
              id: fileData.id || module.id,
              type: 'infosheet',
              title: fileData.file.name || "Document",
              content: `View or download: ${fileData.file.name}`,
              documents: [{
                contentID: fileData.id || module.id,
                filename: fileData.file.name,
                file_url: fileUrl,
                file_size: fileData.file.size
              }],
              moduleId: editId || "preview",
              order: index
            });
          });
        } 
        else if (module.mediaType === "audio") {
          const editor = editorRefs.current[module.id];
          const tempFiles = editor?.getTempFiles?.() || [];

          // Cache audio files
          setCachedAudios(prev => ({
            ...prev,
            [module.id]: tempFiles
          }));
          
          tempFiles.forEach(fileData => {
            const fileUrl = fileData.originalAudio 
              ? fileData.originalAudio.file_url 
              : URL.createObjectURL(fileData.file);
  
            resourceItems.push({
              id: fileData.id || module.id,
              type: 'audio',
              title: fileData.file.name || "Audio",
              content: `Listen to: ${fileData.file.name}`,
              audioFiles: [{
                contentID: fileData.id || module.id,
                filename: fileData.file.name,
                file_url: fileUrl,
                file_size: fileData.file.size
              }],
              moduleId: editId || "preview",
              order: index
            });
          });
        } 
        else if (module.mediaType === "image") {
          const editor = editorRefs.current[module.id];
          console.log("[CRITICAL DEBUG] Image Module Details:", {
            moduleId: module.id,
            mediaType: module.mediaType,
            editorRef: editor,
            editorRefExists: !!editor,
            getTempFilesFunctionExists: editor && typeof editor.getTempFiles === 'function'
          });
        
          // Check if getTempFiles method exists
          if (!editor || typeof editor.getTempFiles !== 'function') {
            console.error("[CRITICAL DEBUG] No getTempFiles method found for image module:", module);
            return; // Skip this module
          }
        
          const tempFiles = editor.getTempFiles() || [];
          console.log("[CRITICAL DEBUG] TempFiles for Image Module:", {
            moduleId: module.id,
            tempFilesCount: tempFiles.length,
            tempFiles: tempFiles.map(file => ({
              id: file.id,
              filename: file.filename,
              width: file.width,
              height: file.height,
              fileExists: !!file.file,
              fileType: file.file ? file.file.type : 'No file',
              fileSize: file.file ? file.file.size : 'No file'
            }))
          });
        
          // Cache image files
          setCachedImages(prev => ({
            ...prev,
            [module.id]: tempFiles.map(fileData => {
              console.log("[CRITICAL DEBUG] Caching Image File:", {
                id: fileData.id,
                filename: fileData.filename,
                width: fileData.width || fileData.originalWidth,
                height: fileData.height || fileData.originalHeight,
                fileData: fileData
              });
              return {
                ...fileData,
                width: fileData.width || fileData.originalWidth,
                height: fileData.height || fileData.originalHeight
              };
            })
          }));
          
          tempFiles.forEach(fileData => {
            let fileUrl;
        
            console.log("[CRITICAL DEBUG] Processing Image File URL:", {
              filename: fileData.filename,
              fileDataType: typeof fileData.file,
              isFile: fileData.file instanceof File,
              isBlob: fileData.file instanceof Blob,
              hasFileUrl: !!fileData.file_url
            });
        
            // Create the proper URL based on the file type
            if (fileData.file instanceof File || fileData.file instanceof Blob) {
              // For temporary files, create a blob URL
              fileUrl = URL.createObjectURL(fileData.file);
              console.log("[DEBUG] Created blob URL for preview:", fileUrl);
            } else if (fileData.file_url) {
              // For server files, ensure the URL is absolute
              fileUrl = fileData.file_url.startsWith('http') 
                ? fileData.file_url 
                : `http://localhost:8000${fileData.file_url}`;
              console.log("[DEBUG] Using server file URL for preview:", fileUrl);
            } else if (fileData.originalImage && fileData.originalImage.file_url) {
              // For files with originalImage reference
              fileUrl = fileData.originalImage.file_url.startsWith('http')
                ? fileData.originalImage.file_url
                : `http://localhost:8000${fileData.originalImage.file_url}`;
              console.log("[DEBUG] Using originalImage URL for preview:", fileUrl);
            }

            const imageWidth = fileData.width || 
                   (fileData.metadata && fileData.metadata.width) || 
                   fileData.originalWidth || null;
                   
            const imageHeight = fileData.height || 
                                (fileData.metadata && fileData.metadata.height) || 
                                fileData.originalHeight || null;

            
                                
            resourceItems.push({
              id: fileData.id || module.id,
              type: 'image',
              title: fileData.filename || "Image",
              content: `View image: ${fileData.filename || "Image"}`,
              // Match the structure ImageContent expects
              source: fileUrl,
              caption: fileData.filename || "Image",
              width: fileData.width || fileData.originalWidth,
              height: fileData.height || fileData.originalHeight,
              // Keep the original data for reference
              imageFiles: [{
                contentID: fileData.id || module.id,
                filename: fileData.filename || (fileData.file ? fileData.file.name : "image"),
                file_url: fileUrl,
                width: imageWidth,
                height: imageHeight,
              }],
              moduleId: editId || "preview"
            });
          });
        }
        else if (module.mediaType === "video") {
          const editor = editorRefs.current[module.id];
          console.log("[DEBUG] Video editor ref:", editor);
          console.log("[DEBUG] Video editor getVideoData exists:", editor && typeof editor.getVideoData === 'function');
  

          const videoData = editor?.getVideoData?.() || {};
          console.log("[DEBUG] Video data retrieved for preview:", videoData);
          
          // Cache video data
          setCachedVideos(prev => ({
            ...prev,
            [module.id]: videoData
          }));

          console.log("[DEBUG] Is video_url present:", Boolean(videoData.video_url));
          console.log("[DEBUG] Video URL value:", videoData.video_url);
          
          if (videoData.video_url) {
            resourceItems.push({
              id: module.id,
              type: 'video',
              title: videoData.title || "Embedded Video",
              content: videoData.video_url,
              videoData: videoData,
              moduleId: editId || "preview",
              order: index
            });
            console.log("[DEBUG] Added video to resourceItems:", videoData);
          } else {
            console.log("[DEBUG] Video NOT added to resourceItems - missing video_url");
          }
        }
      }
      // Process quiz templates (Assessment)
      else if (module.componentType === "template") {
        const editor = editorRefs.current[module.id];
        let questions = [];
        
        if (editor && typeof editor.getQuestions === 'function') {
          questions = editor.getQuestions() || [];
          // Cache the questions for this module
          tempCachedQuestions[module.id] = questions;
        } else {
          // Try from initialQuestionsRef as fallback
          questions = initialQuestionsRef.current[module.id] || [];
        }
        
        // Add a fallback test question if no questions found
        if (questions.length === 0) {
          questions = [{
            id: `test-${Date.now()}`,
            question_text: "This is a test question (no actual questions found)",
            hint_text: "This is a test hint",
            order: 0
          }];
        }
        
        // Format questions
        const formattedQuestions = questions.map(q => ({
          id: q.id || `temp-${Date.now()}-${Math.random()}`,
          question_text: q.question_text || q.text || "",
          hint_text: q.hint_text || q.hint || "",
          order: q.order || 0,
          answers: q.answers || []
        }));
        
        assessmentItems.push({
          id: module.id,
          type: 'quiz',
          quiz_type: module.quizType,
          title: module.type,
          taskData: {
            contentID: module.id,
            title: module.type,
            quiz_type: module.quizType,
            questions: formattedQuestions,
            isPreview: true
          },
          order: index
        });
      }
    });
  
    // Create structured content sections
    const structuredContent = [
      introductionSection
    ];
  
    // Add Resources section if there are any resources
    if (resourceItems.length > 0) {
      structuredContent.push({
        id: 'section-resources',
        type: 'section',
        title: 'Resources',
        content: resourceItems
      });
    }
  
    // Add Assessment section if there are assessment items
    if (assessmentItems.length > 0) {
      structuredContent.push({
        id: 'section-assessment',
        type: 'section',
        title: 'Assessment',
        content: assessmentItems
      });
    }
  
    // Create preview data
    const previewData = {
      module: {
        id: editId || 'preview',
        title: title,
        description: description || title,
        tags: tags,
        upvotes: 0,
        pinned: false
      },
      moduleContent: structuredContent,
      availableTags: availableTags
    };
    
    // Update the cachedQuestions state before entering preview mode
    setCachedQuestions(tempCachedQuestions);
    
    // Enter preview mode with generated data
    enterPreviewMode(previewData);
  };

  // Effect to restore QUESTIONS to editor components when exiting preview mode
  useEffect(() => {
    if (!isPreviewMode && Object.keys(cachedQuestions).length > 0) {
      console.log("Exited preview mode, restoring cached questions to editors");
      
      // Short delay to ensure components are mounted
      const timer = setTimeout(() => {
        modules.forEach(module => {
          if (module.componentType === "template" && cachedQuestions[module.id]) {
            const editor = editorRefs.current[module.id];
            
            if (module.componentType === "media" && module.mediaType === "video" && 
              cachedVideos[module.id]) {
              console.log("[DEBUG] Restoring video data:", cachedVideos[module.id]);
              console.log("[DEBUG] Video data has video_url:", Boolean(cachedVideos[module.id].video_url));
              const editor = editorRefs.current[module.id];
              
              if (editor && typeof editor.setVideoData === 'function') {
                console.log("[DEBUG] Calling setVideoData on video component");
                editor.setVideoData(cachedVideos[module.id]);
              } else {
                console.log("[DEBUG] Cannot restore video data - editor or setVideoData missing");
                console.log("[DEBUG] Editor exists:", Boolean(editor));
                console.log("[DEBUG] setVideoData exists:", editor && typeof editor.setVideoData === 'function');
              }
            }
          }
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isPreviewMode, modules, cachedQuestions]);

  // Effect to restore MEDIA files when exiting preview mode
  useEffect(() => {
    if (!isPreviewMode) {
      console.log("Exited preview mode, restoring cached media files to editors");
      
      // Short delay to ensure components are mounted
      const timer = setTimeout(() => {
        // restore documents
        modules.forEach(module => {
          if (module.componentType === "media" && module.mediaType === "document" && 
              cachedDocuments[module.id] && cachedDocuments[module.id].length > 0) {
            const editor = editorRefs.current[module.id];
            
            if (editor && typeof editor.setTempFiles === 'function') {
              console.log(`Restoring ${cachedDocuments[module.id].length} documents to editor for ${module.id}`);
              editor.setTempFiles(cachedDocuments[module.id]);
            }
          }
          
          // restore audio files
          if (module.componentType === "media" && module.mediaType === "audio" && 
              cachedAudios[module.id] && cachedAudios[module.id].length > 0) {
            const editor = editorRefs.current[module.id];
            
            if (editor && typeof editor.setTempFiles === 'function') {
              console.log(`Restoring ${cachedAudios[module.id].length} audio files to editor for ${module.id}`);
              editor.setTempFiles(cachedAudios[module.id]);
            }
          }

          // restore image files
          if (module.componentType === "media" && module.mediaType === "image" && 
            cachedImages[module.id] && cachedImages[module.id].length > 0) {
          const editor = editorRefs.current[module.id];

          if (editor && typeof editor.setTempFiles === 'function') {
            console.log(`Restoring ${cachedImages[module.id].length} images to editor for ${module.id}`);
            editor.setTempFiles(cachedImages[module.id]);
          }
          }

          // restore video data
          if (module.componentType === "media" && module.mediaType === "video" && 
            cachedVideos[module.id]) {
          const editor = editorRefs.current[module.id];

          if (editor && typeof editor.setVideoData === 'function') {
            console.log(`Restoring video data to editor for ${module.id}`);
            editor.setVideoData(cachedVideos[module.id]);
          }
          }
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [isPreviewMode, modules, cachedDocuments, cachedAudios]);

  // Add a module to the list
  const addModule = (moduleType, componentType) => {
    const newModuleId = `new-${Date.now()}`;
    let newModule = { id: newModuleId };

    if (componentType === "heading") {
      newModule = {
        ...newModule,
        componentType,
        size: moduleType.size,
      };
    } else if (componentType === "template") {
      newModule = {
        ...newModule,
        type: moduleType,
        componentType,
        quizType: QuizApiUtils.getQuizTypeValue(moduleType),
      };
    } else if (componentType === "media") {
      newModule = {
        ...newModule, 
        type: moduleType,
        componentType,
        mediaType: media[moduleType].type,
        moduleId: editId || null
      };
    }

    setModules([...modules, newModule]);
    initialQuestionsRef.current[newModuleId] = [];
    setShowDropdown(false);
  };

  // Clean up refs when component unmounts or modules change
  useEffect(() => {
    return () => {
      // Clean up any references when a module is removed
      const currentIds = modules.map(m => m.id);
      Object.keys(editorRefs.current).forEach(id => {
        if (!currentIds.includes(id)) {
          delete editorRefs.current[id];
        }
      });
      
      Object.keys(initialQuestionsRef.current).forEach(id => {
        if (!currentIds.includes(id)) {
          delete initialQuestionsRef.current[id];
        }
      });
    };
  }, [modules]);

  // Remove a module
  const removeModule = (id) => {
    const moduleToRemove = modules.find(module => module.id === id);
    
    if (moduleToRemove && moduleToRemove.componentType === "media") {
      handleMediaModuleRemoval(moduleToRemove, id);
    }
    
    setModules(modules.filter(module => module.id !== id));
    delete editorRefs.current[id];
    delete initialQuestionsRef.current[id];
  };

  // Handle media module removal
  const handleMediaModuleRemoval = (module, id) => {
    // Only mark for deletion if in edit mode and not a new module
    if (!editId || id.toString().startsWith('new-')) return;
    
    if (module.mediaType === "document") {
      setPendingDeletions(prev => ({
        ...prev,
        document: [...prev.document, id]
      }));
    } else if (module.mediaType === "audio") {
      setPendingDeletions(prev => ({
        ...prev,
        audio: [...prev.audio, id]
      }));
    } else if (module.mediaType === "image") {
      setPendingDeletions(prev => ({
        ...prev,
        image: [...prev.image, id]
      }));
    } else if (module.mediaType === "video") {
      setPendingDeletions(prev => ({
        ...prev,
        video : [...prev.video, id]
      }));
    }
      // future media ...
  };

  // Publish or update the module
  const publishModule = async () => {
    // Validate inputs
    if (!validateModuleInputs()) return;
    
    const authorId = getAuthorId();
    if (!authorId) return;
    
    setIsLoading(true);
    setError(null);

    try {
      const moduleId = await handleModuleCreationOrUpdate(authorId);
      
      alert(isEditing ? "Module updated successfully!" : "Module published successfully!");
      navigate("/admin/all-courses");
    } catch (err) {
      console.error(isEditing ? "Error updating module:" : "Error publishing module:", err);
      setError(`Failed to ${isEditing ? 'update' : 'publish'} module: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Input validation
  const validateModuleInputs = () => {
    if (!title.trim()) {
      setError("Module title is required");
      return false;
    }

    if (modules.length === 0) {
      setError("At least one template is required");
      return false;
    }

    return true;
  };

  // Gets current user's ID for authorship of the module
  const getAuthorId = () => {
    if (!currentUser) {
      setError("Unable to determine user identity");
      return null;
    }
    
    const authorId = currentUser.id || currentUser.user_id || currentUser.pk;
    
    if (!authorId) {
      console.error("Could not extract user ID from:", currentUser);
      setError("Unable to determine user identity");
      return null;
    }
    
    return authorId;
  };

  // Handle module creation or update
  const handleModuleCreationOrUpdate = async (authorId) => {
    if (isEditing) {
      return await updateExistingModule(editId, authorId);
    } else {
      return await createNewModule(authorId);
    }
  };

  // Update an existing module
  const updateExistingModule = async (moduleId, authorId) => {
    const moduleData = {
      title,
      description: description || title,
      tags
    };
    
    await QuizApiUtils.updateModule(moduleId, moduleData);
    
    // process pending media deletions
    await processMediaDeletions(moduleId);
    
    // update or create tasks for each module
    const updatedTaskIds = await processModules(moduleId, authorId);
    
    // clean up orphaned tasks and media
    await cleanupOrphanedContent(moduleId, updatedTaskIds);
    
    return moduleId;
  };

  // Process media deletions
  const processMediaDeletions = async (moduleId) => {
    // process DOCUMENT deletions
    if (pendingDeletions.document.length > 0) {
      for (const docId of pendingDeletions.document) {
        try {
          const allDocs = await DocumentService.getModuleDocuments(moduleId);
          const docsToDelete = allDocs.filter(doc => doc.contentID === docId);
          
          for (const doc of docsToDelete) {
            await DocumentService.deleteDocument(doc.contentID);
          }
        } catch (err) {
          console.error(`[ERROR] Failed to delete documents for component ${docId}:`, err);
        }
      }
    }
    
    // process AUDIO deletions
    if (pendingDeletions.audio.length > 0) {
      for (const audioId of pendingDeletions.audio) {
        try {
          const allAudios = await AudioService.getModuleAudios(moduleId);
          const audiosToDelete = allAudios.filter(audio => audio.contentID === audioId);
          
          for (const audio of audiosToDelete) {
            await AudioService.deleteAudio(audio.contentID);
          }
        } catch (err) {
          console.error(`[ERROR] Failed to delete audio files for component ${audioId}:`, err);
        }
      }

    }

    // process IMAGE deletions
    if (pendingDeletions.image.length > 0) {
      for (const imageId of pendingDeletions.image) {
        try {
          const allImages = await ImageService.getModuleImages(moduleId);
          const imagesToDelete = allImages.filter(image => image.contentID === imageId);

          for (const image of imagesToDelete) {
            await ImageService.deleteImage(image.contentID);
          }
        } catch (err) {
          console.error(`[ERROR] Failed to delete images for component ${imageId}:`, err);
        }
      }
  }

  // process VIDEO deletions
  if (pendingDeletions.video.length > 0) {
      for (const videoId of pendingDeletions.video) {
        try {
          const allVideos = await VideoService.getModuleVideos(moduleId);
          const videosToDelete = allVideos.filter(video => video.contentID === videoId);

          for (const video of videosToDelete) {
            await VideoService.deleteVideo(video.contentID);
          }
        } catch (err) {
          console.error(`[ERROR] Failed to delete videos for component ${videoId}:`, err);
        }
      }
  }

    
    // Clear pending deletions
    setPendingDeletions({ document: [], audio: [], images: [], videos: [] });
  };

  // Create a new module
  const createNewModule = async (authorId) => {
    const moduleData = {
      title,
      description: description || title,
      tags,
      pinned: false,
      upvotes: 0
    };
    
    const moduleResponse = await QuizApiUtils.createModule(moduleData);
    const moduleId = moduleResponse.id;
    
    // create tasks for each module
    await processModules(moduleId, authorId);
    
    return moduleId;
  };

  // Process all modules to create/update tasks and questions
  const processModules = async (moduleId, authorId) => {
    // track updated task IDs
    const updatedTaskIds = [];
    
    // get existing tasks if in 'edit' mode
    let existingTasks = [];
    if (isEditing) {
      existingTasks = await QuizApiUtils.getModuleTasks(moduleId);
    }
    
    // for (const module of modules) {
    //   // handle media components separately
    //   if (module.componentType === "media") {
    //     await handleMediaModule(module, moduleId);
    //     continue;
    //   }
      
    //   // handle regular module (QUIZ) components
    //   if (module.componentType === "template") {
    //     const taskId = await handleTemplateModule(module, moduleId, authorId, existingTasks);
    //     if (taskId) updatedTaskIds.push(taskId);
    //   }
    // }
    // Process modules in order (iterate with index to track order)
  for (let i = 0; i < modules.length; i++) {
    const module = modules[i];
    const orderIndex = i; // Capture the order index
    
    // handle media components separately
    if (module.componentType === "media") {
      await handleMediaModule(module, moduleId, orderIndex);
      continue;
    }
    
    // handle regular module (QUIZ) components
    if (module.componentType === "template") {
      const taskId = await handleTemplateModule(module, moduleId, authorId, existingTasks, orderIndex);
      if (taskId) updatedTaskIds.push(taskId);
    }
  }
    
    return updatedTaskIds;
  };

  // Handle MEDIA module processing
  const handleMediaModule = async (module, moduleId, orderIndex = 0) => {
    const editor = editorRefs.current[module.id];
    if (!editor || !editor.getTempFiles) return;
    
    const tempFiles = editor.getTempFiles();
    if (!tempFiles || tempFiles.length === 0) return;
    
    try {
      const formData = new FormData();
      formData.append('module_id', moduleId);

      formData.append('order_index', orderIndex.toString());

      // if module has an ID and its not a temporary ID
      if (module.id && !module.id.toString().startsWith('new-')) {
        formData.append('component_id', module.id);
      }

      
      // special handling for image files
      if (module.mediaType === "image") {
        // Add each file to FormData
        for (let i = 0; i < tempFiles.length; i++) {
          const fileData = tempFiles[i];
          formData.append('files', fileData.file);

          // Add dimensions as separate fields only for image media type
          if (module.mediaType === "image" && fileData.width && fileData.height) {
            formData.append(`width_${i}`, fileData.width.toString());
            formData.append(`height_${i}`, fileData.height.toString());
            console.log(`[DEBUG] Adding dimensions for ${fileData.filename}: ${fileData.width}×${fileData.height}`);
          }
        }

        // Add component_id for existing (not new) image modules
        if (module.id && !module.id.toString().startsWith('new-')) {
          formData.append('component_id', module.id);
        }
        
      } else {
        let hasNewFiles = false;
        tempFiles.forEach(fileData => {
          // only append actual file object, not references to existing files
          if (fileData.file instanceof File && !fileData.originalDocument && !fileData.originalAudio) {
            formData.append('files', fileData.file);
            hasNewFiles = true;
          }
        });

        // Add component_id for existing (not new) modules
        if (module.id && !module.id.toString().startsWith('new-')) {
          formData.append('component_id', module.id);
        }

        // only upload when there is new Files for non image media (since media has its own handling)
        if (!hasNewFiles) return;
      }
      
      
      if (module.mediaType === "document") {
        await DocumentService.uploadDocuments(formData);
      } else if (module.mediaType === "audio") {
        await AudioService.uploadAudios(formData);
      } else if (module.mediaType === "image") {
        await ImageService.uploadImages(formData);
      } else if (module.mediaType === "video") {
        await VideoService.uploadVideos(formData);
      }
      // add future media ..


    } catch (error) {
      console.error(`Error uploading ${module.mediaType}:`, error);
      setError(`Failed to upload ${module.mediaType}: ${error.message}`);
    }
  };

  // Handle template module processing
  const handleTemplateModule = async (module, moduleId, authorId, existingTasks) => {
    // Get questions from editor component
    let currentQuestions = getQuestionsFromEditor(module.id);
    
    // Determine if this is an existing task
    const isExistingTask = !module.id.toString().startsWith("new-");
    const existingTask = isExistingTask 
      ? existingTasks.find(task => task.contentID === module.id)
      : null;
    
    const taskData = {
      title: `${module.type} for ${title}`,
      moduleID: moduleId,
      description: `${module.type} content for ${title}`,
      quiz_type: module.quizType,
      text_content: isEditing ? "Updated by admin interface" : "Generated by admin interface",
      author: authorId,
      is_published: true,
      order_index: orderIndex
    };

    // Special handling for ranking quizzes
    if (module.quizType === 'ranking_quiz') {
      console.log("Special handling for ranking quiz");
      let rankingTaskId;
      
      if (existingTask) {
        // Update existing task
        await QuizApiUtils.updateTask(existingTask.contentID, taskData);
        rankingTaskId = existingTask.contentID;
        
        // Get existing questions and delete them
        const existingQuestions = await QuizApiUtils.getQuestions(existingTask.contentID);
        for (const question of existingQuestions) {
          await QuizApiUtils.deleteQuestion(question.id);
        }
      } else {
        // Create new task
        const taskResponse = await QuizApiUtils.createModuleTask(moduleId, taskData);
        rankingTaskId = taskResponse.contentID;
      }

      // Create questions for ranking quiz - with special handling for tiers
      for (let i = 0; i < currentQuestions.length; i++) {
        const question = currentQuestions[i];
        const questionData = {
          task_id: rankingTaskId,
          question_text: question.question_text || question.text || "",
          hint_text: question.hint_text || question.hint || "",
          order: i,
          answers: question.tiers || [] // Use tiers for ranking quiz
        };
        
        try {
          await QuizApiUtils.createQuestion(questionData);
        } catch (questionError) {
          console.error(`Error creating ranking quiz question:`, questionError);
        }
      }
      
      return rankingTaskId;

    } else { // OTHER QUIZ TYPES - ELSE THAN RANKING 

      if (existingTask) {
        // Update existing task
        await QuizApiUtils.updateTask(existingTask.contentID, taskData);
        
        // Get existing questions and delete them
        const existingQuestions = await QuizApiUtils.getQuestions(existingTask.contentID);
        for (const question of existingQuestions) {
          await QuizApiUtils.deleteQuestion(question.id);
        }
  
        console.log("Questions to save:", currentQuestions);
  
        
        // Create new questions
        for (let i = 0; i < currentQuestions.length; i++) {
          const question = currentQuestions[i];
  
          console.log(`Processing question ${i+1}/${currentQuestions.length}:`, question);
          
          const questionData = {
            task: existingTask.contentID,
            question_text: question.question_text || question.text || "",
            hint_text: question.hint_text || question.hint || "",
            order: i,
            answers: question.answers || []
          };
          console.log(`Prepared question data for API:`, questionData);
          
          try {
            await QuizApiUtils.createQuestion(questionData);
            console.log(`Question created successfully:`, response);
          } catch (questionError) {
            console.error(`Error creating question ${i+1}:`, questionError);
            console.error(`Failed question data:`, questionData);
          }
        }
        
        return existingTask.contentID;
      } else {
        // Create new task
        const taskResponse = await QuizApiUtils.createModuleTask(moduleId, taskData);
        const taskId = taskResponse.contentID;
        
        // Create questions for this new task
        for (let i = 0; i < currentQuestions.length; i++) {
          const question = currentQuestions[i];
          const questionData = {
            task_id: taskId,
            question_text: question.question_text || question.text || "",
            hint_text: question.hint_text || question.hint || "",
            order: i,
            answers: question.answers || []
          };
          await QuizApiUtils.createQuestion(questionData);
        }
        
        return taskId;
      }
    }

  };

  // Get questions from editor component
  const getQuestionsFromEditor = (moduleId) => {
    const editorComponent = editorRefs.current[moduleId];
    let questions = [];
    
    if (editorComponent && typeof editorComponent.getQuestions === 'function') {
      questions = editorComponent.getQuestions();
      
      // Format questions if needed
      if (Array.isArray(questions) && questions.length > 0 && 
          !questions[0].question_text && questions[0].text) {
        questions = questions.map(q => ({
          ...q,
          question_text: q.text,
          hint_text: q.hint || "",
          answers: q.answers || []
        }));
      }
    } else {
      questions = initialQuestionsRef.current[moduleId] || [];
    }
    
    return questions;
  };

  // Clean up orphaned content (quiz)
  const cleanupOrphanedContent = async (moduleId, updatedTaskIds) => {
    // Clean up orphaned tasks
    try {
      await QuizApiUtils.cleanupOrphanedTasks(moduleId, updatedTaskIds);
    } catch (cleanupError) {
      console.error(`[ERROR] Error cleaning up orphaned tasks: ${cleanupError}`);
    }
    
    // Clean up orphaned documents if no document components are left
    await cleanupOrphanedMedia(
      moduleId, 
      "document", 
      modules.filter(m => m.componentType === "media" && m.mediaType === "document"),
      DocumentService.getModuleDocuments,
      DocumentService.deleteDocument
    );
    
    // Clean up orphaned audio if no audio components are left
    await cleanupOrphanedMedia(
      moduleId,
      "audio",
      modules.filter(m => m.componentType === "media" && m.mediaType === "audio"),
      AudioService.getModuleAudios,
      AudioService.deleteAudio
    );

    // Clean up orphaned images if no image components are left
    await cleanupOrphanedMedia(
      moduleId,
      "image",
      modules.filter(m => m.componentType === "media" && m.mediaType === "image"),
      ImageService.getModuleImages,
      ImageService.deleteImage
    );

    // Clean up orphaned videos if no image components are left
    await cleanupOrphanedMedia(
      moduleId,
      "video",
      modules.filter(m => m.componentType === "media" && m.mediaType === "video"),
      VideoService.getModuleVideos,
      VideoService.deleteVideo
    );

    // add future mediaa
  };

  // Clean up orphaned media (documents or audio)
  const cleanupOrphanedMedia = async (moduleId, mediaType, remainingComponents, getMediaFn, deleteMediaFn) => {
    if (remainingComponents.length > 0) return;
    
    try {
      const existingMedia = await getMediaFn(moduleId);
      
      if (existingMedia.length > 0) {
        for (const media of existingMedia) {
          await deleteMediaFn(media.contentID);
        }
      }
    } catch (error) {
      console.error(`Error cleaning up orphaned ${mediaType} files:`, error);
    }
  };

  // Render function
  return (
    <div className={styles["module-editor-container"]}>

      {/* Display either editor or preview */}
      {isPreviewMode ? (
        <ModuleViewAlternative/> 
      ) : (
        // Normal edit mode
        <>
          <h1 className="page-title">{isEditing ? "Edit Module" : "Add Course"}</h1>
          
          {isLoading && <div className="loading-overlay">Loading...</div>}
          
          <div className={styles["module-creator-container"]}>
            {/* Module Title */}
            <div className={styles["module-title-container"]}>
              <input
                type="text"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={styles["module-title-input"]}
              />
            </div>
            
            {/* Module Description */}
            <input
              placeholder="Module Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={styles["description-input"]}
            />

            {/* Tags */}
            <TagsManager 
              tags={tags} 
              availableTags={availableTags} 
              addTag={addTag} 
              removeTag={removeTag}
              styles={styles}
            />

            {/* Error Display */}
            {error && (
              <div className={styles["error-message"]}>
                <p>{error}</p>
                <button onClick={() => setError(null)}>×</button>
              </div>
            )}

            {/* Modules List */}
            <div className={styles["modules-list"]}>
              {modules.map((module) => (
                <ModuleEditorComponent
                  key={module.id}
                  module={module}
                  editorRefs={editorRefs}
                  initialQuestionsRef={initialQuestionsRef}
                  removeModule={removeModule}
                  moduleOptions={moduleOptions}
                  media={media}
                  styles={styles}
                  title={title}
                />
              ))}
            </div>

            {/* Add Module Templates Button */}
            <ModuleDropdown
              showDropdown={showDropdown}
              setShowDropdown={setShowDropdown}
              dropdownRef={dropdownRef}
              moduleOptions={moduleOptions}
              media={media}
              addModule={addModule}
              styles={styles}
            />
            
            {/* Action Buttons */}
            
              {/* Action Buttons */}
              <div className={styles["button-container"]}>
                <div className={styles["preview-container"]}>
                  <button 
                    onClick={isPreviewMode ? exitPreviewMode : handlePreview}
                    className={styles[isPreviewMode ? "edit-mode-btn" : "preview-btn"]}
                  >
                    {isPreviewMode ? "Back to Editor" : "Preview"}
                  </button>
                </div>
                <button 
                  className={styles["publish-btn"]} 
                  onClick={publishModule} 
                  disabled={isLoading}
                >
                  {isLoading ? 
                    (isEditing ? "Updating..." : "Publishing...") : 
                    (isEditing ? "Update" : "Publish")
                  }
                </button>
                {isEditing && <button className={styles["edit-btn"]}>Edit</button>}
              </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AddModule;