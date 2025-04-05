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

import { ModuleEditorComponent } from "../components/module-builder/ModuleEditorComponent";
import { ModuleDropdown } from "../components/module-builder/ModuleDropdown";
import { TagsManager } from "../components/module-builder/TagsManager";

import { useModuleData } from "../hooks/useModuleData";
import { useEditorRefs } from "../hooks/useEditorRefs";
import { useTags } from "../hooks/useTags";
import { useMediaDeletions } from "../hooks/useMediaDeletions";

import styles from "../styles/AddModule.module.css";

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
  const [isPreview, setIsPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);

  const { modules, setModules, fetchModuleData } = useModuleData(editId);
  const { editorRefs, initialQuestionsRef } = useEditorRefs();
  const { tags, setTags, availableTags, setAvailableTags, fetchTags, addTag, removeTag } = useTags();
  const { pendingDeletions, setPendingDeletions } = useMediaDeletions();

  // Module and component type definitions // 
  const moduleOptions = {
    "Flashcard Quiz": { component: "VisualFlashcardEditor", type: "flashcard" },
    "Fill in the Blanks": { component: "VisualFillTheFormEditor", type: "text_input" },
    "Flowchart Quiz": { component: "VisualFlowChartQuiz", type: "statement_sequence" },
    'Question and Answer Form': { component: "VisualQuestionAndAnswerFormEditor", type:'question_input'},
    'Matching Question Quiz': {component: "VisualMatchingQuestionsQuizEditor", type:'pair_input'},
    'Ranking Quiz': {component: "RankingQuizEditor", type:'ranking_quiz'}
  };

  const headings = [
    {name:"Heading 1", size: "heading1"},
    {name:"Heading 2", size: "heading2"},
    {name:"Heading 3", size: "heading3"}
  ];

  const media = {
    'Upload Document': {component: "DocumentEditorWrapper", type:'document'},
    'Upload Audio': {component: "AudioEditorWrapper", type:'audio'},
    'Upload Image': {component: "InlinePictureEditorWrapperr", type:'image'},
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
      fetchModuleData(editId).then(moduleData => {
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
  }, [currentUser, navigate, isEditing, editId, fetchModuleData, fetchTags]);

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
  // this checks if all required fields are filled before saving!
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

  // Gets the current user's ID for authorship of the module
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
    
    for (const module of modules) {
      // handle media components separately
      if (module.componentType === "media") {
        await handleMediaModule(module, moduleId);
        continue;
      }
      
      // handle regular module (QUIZ) components
      if (module.componentType === "template") {
        const taskId = await handleTemplateModule(module, moduleId, authorId, existingTasks);
        if (taskId) updatedTaskIds.push(taskId);
      }
      
      // Headings don't require backend processing
    }
    
    return updatedTaskIds;
  };

  // Handle MEDIA module processing
  const handleMediaModule = async (module, moduleId) => {
    const editor = editorRefs.current[module.id];
    if (!editor || !editor.getTempFiles) return;
    
    const tempFiles = editor.getTempFiles();
    if (!tempFiles || tempFiles.length === 0) return;
    
    try {
      const formData = new FormData();
      formData.append('module_id', moduleId);
      
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
      is_published: true
    };
    
    if (existingTask) {
      // Update existing task
      await QuizApiUtils.updateTask(existingTask.contentID, taskData);
      
      // Get existing questions and delete them
      const existingQuestions = await QuizApiUtils.getQuestions(existingTask.contentID);
      for (const question of existingQuestions) {
        await QuizApiUtils.deleteQuestion(question.id);
      }
      
      // Create new questions
      for (let i = 0; i < currentQuestions.length; i++) {
        const question = currentQuestions[i];
        const questionData = {
          task: existingTask.contentID,
          question_text: question.question_text || question.text || "",
          hint_text: question.hint_text || question.hint || "",
          order: i,
          answers: question.answers || []
        };
        
        try {
          await QuizApiUtils.createQuestion(questionData);
        } catch (questionError) {
          console.error(`Error creating question ${i+1}:`, questionError);
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

  // Clean up orphaned content
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

    // add future media
  };

  // Render function
  return (
    <div className={styles["module-editor-container"]}>
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
          headings={headings}
          moduleOptions={moduleOptions}
          media={media}
          addModule={addModule}
          styles={styles}
        />
      </div>
      
      {/* Action Buttons */}
      {!isPreview ? (
        <div className={styles["button-container"]}>
          <div className={styles["preview-container"]}>
            <button 
              className={styles["preview-btn"]} 
              onClick={() => setIsPreview(true)} 
              disabled={isLoading}
            >
              Preview
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
          {!isEditing && <button className={styles["edit-btn"]}>Edit</button>}
        </div>
      ) : (
        <div className={styles["preview-container"]}>
          <h2>{title}</h2>
          <p>{description}</p>
          <div className={styles["preview-tags"]}>
            {tags.map((tagId) => {
              const tagObj = availableTags.find(t => t.id === tagId);
              return tagObj ? (
                <span key={tagId} className={styles["preview-tag"]}>{tagObj.tag}</span>
              ) : null;
            })}
          </div>
          <div className={styles["preview-modules"]}>
            {modules.map((module, index) => {
              // For preview, try to get current question count if possible
              let questionCount = 0;
              const editorComponent = editorRefs.current[module.id];
              
              if (editorComponent && typeof editorComponent.getQuestions === 'function') {
                questionCount = editorComponent.getQuestions().length;
              } else {
                questionCount = initialQuestionsRef.current[module.id]?.length || 0;
              }
              
              return (
                <div key={module.id} className={styles["preview-module"]}>
                  <h3>{module.type} {index + 1}</h3>
                  <p>Questions: {questionCount}</p>
                </div>
              );
            })}
          </div>
          <button 
            className={styles["exit-preview-btn"]} 
            onClick={() => setIsPreview(false)}
          >
            Exit Preview
          </button>
        </div>
      )}
    </div>
  );
};

export default AddModule;