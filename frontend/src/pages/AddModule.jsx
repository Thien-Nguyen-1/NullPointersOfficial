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

import React, { useState, useEffect, useRef, useContext, useCallback } from "react";
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

// this component has multiple responsibilities:
// 1. module creation and editing
// 2. media upload and management
// 3. task and question processing
// 4. preview functionality
// 5. error handling and state management

// Utility object to handle different types of media cleanup
// helps manage deleting documents, audio, images, and videos consistently
const mediaCleanupHandlers = {
  document: { 
    getMedia: DocumentService.getModuleDocuments, 
    deleteMedia: DocumentService.deleteDocument 
  },
  audio: { 
    getMedia: AudioService.getModuleAudios, 
    deleteMedia: AudioService.deleteAudio 
  },
  image: { 
    getMedia: ImageService.getModuleImages, 
    deleteMedia: ImageService.deleteImage 
  },
  video: { 
    getMedia: VideoService.getModuleVideos, 
    deleteMedia: VideoService.deleteVideo 
  }
};

// notes on code complexity:
// this component has multiple responsibilities:
// 1. module creation and editing
// 2. media upload and management
// 3. task and question processing
// 4. preview functionality
// 5. error handling and state management

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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const { isPreviewMode, enterPreviewMode, exitPreviewMode } = usePreviewMode();
  const { modules, setModules, fetchModuleData } = useModuleData(editId);
  const { editorRefs, initialQuestionsRef } = useEditorRefs();
  const { tags, setTags, availableTags, fetchTags, addTag, removeTag } = useTags();
  const { pendingDeletions, setPendingDeletions } = useMediaDeletions();

  // Module and component type definitions // 
  // Media and module type definitions
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
  };

  // Cached media and questions state
  const [cachedQuestions, setCachedQuestions] = useState({});
  const [cachedMedia, setCachedMedia] = useState({
    document: {},
    audio: {},
    image: {},
    video: {}
  });

  // initialize components
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (isEditing) {
      fetchModuleData(editId, initialQuestionsRef)
        .then(moduleData => {
          if (moduleData) {
            setTitle(moduleData.title);
            setDescription(moduleData.description || "");
            setTags(moduleData.tags || []);
          }
        })
        .catch(error => {
          console.error("Error loading module data:", error);
          setError("Failed to load module data. Please try again.");
        });
    }

    fetchTags();
  }, [currentUser, navigate, isEditing, editId, fetchModuleData, fetchTags, initialQuestionsRef]);

  // Helper function to get media cache key
  const getMediaCacheKey = (module) => {
    return module.id || `new-${module.type}-${Date.now()}`;
  };

  // Process media upload
  const handleMediaUpload = async (module, moduleId, orderIndex = 0) => {
    const editor = editorRefs.current[module.id];
    if (!editor || !editor.getTempFiles) return null;
    
    const tempFiles = editor.getTempFiles();
    if (!tempFiles || tempFiles.length === 0) return null;
    
    try {
      const formData = new FormData();
      formData.append('module_id', moduleId);
      formData.append('order_index', orderIndex.toString());

      // Handle existing component ID
      if (module.id && !module.id.toString().startsWith('new-')) {
        formData.append('component_id', module.id);
      }

      // Special handling for image files with dimension metadata
      if (module.mediaType === "image") {
        tempFiles.forEach((fileData, i) => {
          formData.append('files', fileData.file);
          
          if (fileData.width && fileData.height) {
            formData.append(`width_${i}`, fileData.width.toString());
            formData.append(`height_${i}`, fileData.height.toString());
          }
        });
      } else {
        const newFiles = tempFiles.filter(fileData => 
          fileData.file instanceof File && 
          !fileData.originalDocument && 
          !fileData.originalAudio
        );
        
        if (newFiles.length === 0) return null;
        
        newFiles.forEach(fileData => {
          formData.append('files', fileData.file);
        });
      }

      // Upload using appropriate media upload handler
      const uploadHandler = mediaUploadHandlers[module.mediaType];
      return await uploadHandler(formData);
    } catch (error) {
      console.error(`Error uploading ${module.mediaType}:`, error);
      setError(`Failed to upload ${module.mediaType}: ${error.message}`);
      return null;
    }
  };

  // Media upload handlers mapping
  const mediaUploadHandlers = {
    document: DocumentService.uploadDocuments,
    audio: AudioService.uploadAudios,
    image: ImageService.uploadImages,
    video: VideoService.uploadVideos
  };

  // Process media deletion
  const processMediaDeletions = async (moduleId) => {
    for (const [mediaType, mediaIds] of Object.entries(pendingDeletions)) {
      if (mediaIds.length > 0) {
        try {
          const { getMedia, deleteMedia } = mediaCleanupHandlers[mediaType];
          const existingMedia = await getMedia(moduleId);
          
          for (const mediaId of mediaIds) {
            const mediaToDel = existingMedia.filter(m => m.contentID === mediaId);
            for (const media of mediaToDel) {
              await deleteMedia(media.contentID);
            }
          }
        } catch (error) {
          console.error(`Error cleaning up ${mediaType} files:`, error);
        }
      }
    }

    // Reset pending deletions
    setPendingDeletions({ 
      document: [], 
      audio: [], 
      image: [], 
      video: [] 
    });
  };

  // Process questions for template modules (ITS FOR QUIZZES)
  const processTemplateQuestions = async (task, questions) => {
    // Delete existing questions first
    const existingQuestions = await QuizApiUtils.getQuestions(task.contentID);
    for (const question of existingQuestions) {
      await QuizApiUtils.deleteQuestion(question.id);
    }

    // Create new questions
    for (let i = 0; i < questions.length; i++) {
      const question = questions[i];
      const questionData = {
        task_id: task.contentID,
        question_text: question.question_text || question.text || "",
        hint_text: question.hint_text || question.hint || "",
        order: i,
        answers: question.answers || 
                question.tiers || // For ranking quizzes
                []
      };
      
      try {
        await QuizApiUtils.createQuestion(questionData);
      } catch (questionError) {
        console.error(`Error creating question ${i+1}:`, questionError);
      }
    }
  };

  // Create or update a module's tasks
  const processModuleTasks = async (moduleId, authorId) => {
    const updatedTaskIds = [];
    const existingTasks = isEditing 
      ? await QuizApiUtils.getModuleTasks(moduleId) 
      : [];

    // Process modules in order
    for (let i = 0; i < modules.length; i++) {
      const module = modules[i];
      
      // Skip non-template modules
      if (module.componentType !== "template") continue;
      
      // Get questions from editor
      const questions = getQuestionsFromEditor(module.id);
      
      // Skip if no questions
      if (questions.length === 0) continue;
      
      // Prepare task data
      const taskData = {
        title: `${module.type} for ${title}`,
        moduleID: moduleId,
        description: `${module.type} content for ${title}`,
        quiz_type: module.quizType,
        text_content: isEditing ? "Updated by admin interface" : "Generated by admin interface",
        author: authorId,
        is_published: true,
        order_index: i
      };

      // Find or create task
      let task;
      const existingTask = existingTasks.find(t => t.contentID === module.id);
      
      if (existingTask) {
        // Update existing task
        await QuizApiUtils.updateTask(existingTask.contentID, taskData);
        task = { contentID: existingTask.contentID };
      } else {
        // Create new task
        const taskResponse = await QuizApiUtils.createModuleTask(moduleId, taskData);
        // task = taskResponse;
        task = { contentID: taskResponse.contentID || taskResponse.id };
      }

      // Process questions for the task
      await processTemplateQuestions(task, questions);
      
      updatedTaskIds.push(task.contentID);
    }

    return updatedTaskIds;
  };

  // Get questions from editor component
  const getQuestionsFromEditor = (moduleId) => {
    const editorComponent = editorRefs.current[moduleId];
    const module = modules.find(m => m.id === moduleId);
    
    if (!editorComponent || typeof editorComponent.getQuestions !== 'function') {
      return initialQuestionsRef.current[moduleId] || [];
    }

    try {
      const questions = editorComponent.getQuestions();
      
      // Format questions based on quiz type
      return questions.map(q => ({
        ...q,
        question_text: q.question_text || q.text || "",
        hint_text: q.hint_text || q.hint || "",
        answers: q.answers || q.tiers || []
      }));
    } catch (error) {
      console.error(`Failed to get questions for module ${moduleId}:`, error);
      return initialQuestionsRef.current[moduleId] || [];
    }
  };

  // Prepare module for publishing
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

  // Validate module inputs
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

  // Get author ID
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
    const moduleData = {
      title,
      description: description || title,
      tags,
      ...(isEditing ? {} : { pinned: false, upvotes: 0 })
    };

    let moduleId;
    if (isEditing) {
      await QuizApiUtils.updateModule(editId, moduleData);
      moduleId = editId;
      
      // Process pending media deletions
      await processMediaDeletions(moduleId);
      // Clean up orphaned components
      await cleanupOrphanedComponents(moduleId, modules);
    } else {
      const moduleResponse = await QuizApiUtils.createModule(moduleData);
      moduleId = moduleResponse.id;
    }

    // Process modules and media
    await Promise.all(
      modules.map(async (module, index) => {
        if (module.componentType === "media") {
          await handleMediaUpload(module, moduleId, index);
        }
      })
    );

    // Process tasks for template modules
    const updatedTaskIds = await processModuleTasks(moduleId, authorId);

    return moduleId;
  };

  // Add a module to the list
  const addModule = (moduleType, componentType) => {
    const newModuleId = `new-${Date.now()}`;
    let newModule = { id: newModuleId };

    if (componentType === "template") {
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

  const cleanupOrphanedComponents = async (moduleId, currentModules) => {
    try {
      // Fetch existing components for the module
      const existingTasks = await QuizApiUtils.getModuleTasks(moduleId);
      const existingDocuments = await DocumentService.getModuleDocuments(moduleId);
      const existingAudios = await AudioService.getModuleAudios(moduleId);
      const existingImages = await ImageService.getModuleImages(moduleId);
      const existingVideos = await VideoService.getModuleVideos(moduleId);
  
      // Combine all existing components
      const allExistingComponents = [
        ...existingTasks.map(task => ({ 
          id: task.contentID, 
          type: 'template',
          quizType: task.quiz_type 
        })),
        ...existingDocuments.map(doc => ({ 
          id: doc.contentID, 
          type: 'document' 
        })),
        ...existingAudios.map(audio => ({ 
          id: audio.contentID, 
          type: 'audio' 
        })),
        ...existingImages.map(image => ({ 
          id: image.contentID, 
          type: 'image' 
        })),
        ...existingVideos.map(video => ({ 
          id: video.contentID, 
          type: 'video' 
        }))
      ];
  
      // Find components to delete (those in existing components but not in current modules)
      const componentsToDelete = allExistingComponents.filter(existingComp => 
        !currentModules.some(currentModule => currentModule.id === existingComp.id)
      );
  
      // Delete each orphaned component
      for (const component of componentsToDelete) {
        try {
          if (component.type === 'template') {
            // Delete task and its questions
            await QuizApiUtils.deleteTask(component.id);
          } else if (component.type === 'document') {
            await DocumentService.deleteDocument(component.id);
          } else if (component.type === 'audio') {
            await AudioService.deleteAudio(component.id);
          } else if (component.type === 'image') {
            await ImageService.deleteImage(component.id);
          } else if (component.type === 'video') {
            await VideoService.deleteVideo(component.id);
          }
          
          console.log(`Deleted orphaned component: ${component.id}`);
        } catch (deleteError) {
          console.error(`Error deleting component ${component.id}:`, deleteError);
        }
      }
    } catch (error) {
      console.error("Error cleaning up orphaned components:", error);
    }
  };

  // Handle media module removal
  const handleMediaModuleRemoval = (module, id) => {
    // Only mark for deletion if in edit mode and not a new module
    if (!editId || id.toString().startsWith('new-')) return;
    
    setPendingDeletions(prev => ({
      ...prev,
      [module.mediaType]: [...prev[module.mediaType], id]
    }));
  };

  // Preview module
  const handlePreview = () => {
    if (!title.trim()) {
      setError("Module title is required for preview");
      return;
    }
  
    // prepare preview data
    const previewData = preparePreviewData();
    
    // update cached questions and media
    updateCachedData(previewData);
    
    enterPreviewMode(previewData);
  };

  // Create an introduction section (description)
  const preparePreviewData = () => {
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

    // Process modules
    modules.forEach((module, index) => {
      if (module.componentType === "media") {
        processMediaPreview(module, index, resourceItems);
      } else if (module.componentType === "template") {
        processTemplatePreview(module, index, assessmentItems);
      }
    });

    // create a structured component
    const structuredContent = [introductionSection];

    // Sort and add resources section
    resourceItems.sort((a, b) => a.order - b.order);
    if (resourceItems.length > 0) {
      structuredContent.push({
        id: 'section-resources',
        type: 'section',
        title: 'Resources',
        content: resourceItems
      });
    }

    // Sort and add assessment section
    assessmentItems.sort((a, b) => a.order - b.order);
    if (assessmentItems.length > 0) {
      structuredContent.push({
        id: 'section-assessment',
        type: 'section',
        title: 'Assessment',
        content: assessmentItems
      });
    }

    return {
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
  };

  // Process media for preview
  const processMediaPreview = (module, index, resourceItems) => {
    const editor = editorRefs.current[module.id];
    if (!editor || !editor.getTempFiles) return;

    const tempFiles = editor.getTempFiles();
    if (!tempFiles || tempFiles.length === 0) return;

    // Media-specific preview processing
    const mediaPreviewHandlers = {
      document: processDocumentPreview,
      audio: processAudioPreview,
      image: processImagePreview,
      video: processVideoPreview
    };

    const processHandler = mediaPreviewHandlers[module.mediaType];
    if (processHandler) {
      tempFiles.forEach(fileData => {
        const previewItem = processHandler(module, fileData, index);
        if (previewItem) resourceItems.push(previewItem);
      });
    }
  };

  // Process document preview
  const processDocumentPreview = (module, fileData, index) => {
    const fileUrl = fileData.originalDocument 
      ? fileData.originalDocument.file_url 
      : URL.createObjectURL(fileData.file);

    return {
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
    };
  };

  // Process audio preview
  const processAudioPreview = (module, fileData, index) => {
    const fileUrl = fileData.originalAudio 
      ? fileData.originalAudio.file_url 
      : URL.createObjectURL(fileData.file);

    return {
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
    };
  };

  // Process image preview
  const processImagePreview = (module, fileData, index) => {
    let fileUrl;
    if (fileData.file instanceof File || fileData.file instanceof Blob) {
      fileUrl = URL.createObjectURL(fileData.file);
    } else if (fileData.file_url) {
      fileUrl = fileData.file_url.startsWith('http') 
        ? fileData.file_url 
        : `http://localhost:8000${fileData.file_url}`;
    } else if (fileData.originalImage && fileData.originalImage.file_url) {
      fileUrl = fileData.originalImage.file_url.startsWith('http')
        ? fileData.originalImage.file_url
        : `http://localhost:8000${fileData.originalImage.file_url}`;
    }

    const imageWidth = fileData.width || 
                     (fileData.metadata && fileData.metadata.width) || 
                     fileData.originalWidth || null;
                     
    const imageHeight = fileData.height || 
                      (fileData.metadata && fileData.metadata.height) || 
                      fileData.originalHeight || null;

    return {
      id: fileData.id || module.id,
      type: 'image',
      title: fileData.filename || "Image",
      content: `View image: ${fileData.filename || "Image"}`,
      source: fileUrl,
      caption: fileData.filename || "Image",
      width: imageWidth,
      height: imageHeight,
      imageFiles: [{
        contentID: fileData.id || module.id,
        filename: fileData.filename || (fileData.file ? fileData.file.name : "image"),
        file_url: fileUrl,
        width: imageWidth,
        height: imageHeight,
      }],
      moduleId: editId || "preview",
      order: index
    };
  };

  // Process video preview
  const processVideoPreview = (module, fileData, index) => {
    const editor = editorRefs.current[module.id];
    const videoData = editor?.getVideoData?.() || {};

    if (videoData.video_url) {
      return {
        id: module.id,
        type: 'video',
        title: videoData.title || "Embedded Video",
        content: videoData.video_url,
        videoData: videoData,
        moduleId: editId || "preview",
        order: index
      };
    }
    return null;
  };

  // Process template for preview
  const processTemplatePreview = (module, index, assessmentItems) => {
    const editor = editorRefs.current[module.id];
    let questions = [];
    
    if (editor && typeof editor.getQuestions === 'function') {
      questions = editor.getQuestions() || [];
    } else {
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
  };

  // Update cached data when entering preview
  const updateCachedData = (previewData) => {
    const tempCachedQuestions = {};
    const tempCachedMedia = {
      document: {},
      audio: {},
      image: {},
      video: {}
    };

    modules.forEach(module => {
      if (module.componentType === "template") {
        const editor = editorRefs.current[module.id];
        if (editor && typeof editor.getQuestions === 'function') {
          tempCachedQuestions[module.id] = editor.getQuestions();
        }
      } else if (module.componentType === "media") {
        const editor = editorRefs.current[module.id];
        if (editor && editor.getTempFiles) {
          const files = editor.getTempFiles();

          // Special handling for image files to preserve dimensions
          if (module.mediaType === "image") {
            tempCachedMedia[module.mediaType][module.id] = files.map(file => ({
              ...file,
              // Ensure dimensions are preserved
              width: file.width || file.originalWidth || (file.metadata && file.metadata.width),
              height: file.height || file.originalHeight || (file.metadata && file.metadata.height)
            }));
          } else {
            tempCachedMedia[module.mediaType][module.id] = files;
          }
        }
      }
    });

    setCachedQuestions(tempCachedQuestions);
    setCachedMedia(tempCachedMedia);
  };

  // Restore questions and media when exiting preview
  useEffect(() => {
    if (!isPreviewMode) {
      // Restore questions
      Object.entries(cachedQuestions).forEach(([moduleId, questions]) => {
        const module = modules.find(m => m.id === moduleId);
        if (module && module.componentType === "template") {
          const editor = editorRefs.current[moduleId];
          if (editor && typeof editor.setQuestions === 'function') {
            editor.setQuestions(questions);
          }
        }
      });

      // Restore media
      Object.entries(cachedMedia).forEach(([mediaType, mediaItems]) => {
        Object.entries(mediaItems).forEach(([moduleId, files]) => {
          const module = modules.find(m => m.id === moduleId);
          if (module && module.componentType === "media" && module.mediaType === mediaType) {
            const editor = editorRefs.current[moduleId];
            if (editor && typeof editor.setTempFiles === 'function') {
              editor.setTempFiles(files);
            }
          }
        });
      });
    }
  }, [isPreviewMode, modules, cachedQuestions, cachedMedia]);

  // Render function
  return (
    <div className={styles["module-editor-container"]}>
      {isPreviewMode ? (
        <ModuleViewAlternative/> 
      ) : (
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