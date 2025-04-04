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
import RankingQuestionEditor from "../components/editors/RankingQuestionEditor";

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

  // Module and component type definitions // 
  const moduleOptions = {
    "Flashcard Quiz": { component: "VisualFlashcardEditor", type: "flashcard" },
    "Fill in the Blanks": { component: "VisualFillTheFormEditor", type: "text_input" },
    "Flowchart Quiz": { component: "VisualFlowChartQuiz", type: "statement_sequence" },
    'Question and Answer Form': { component: "VisualQuestionAndAnswerFormEditor", type:'question_input'},
    'Matching Question Quiz': {component: "VisualMatchingQuestionsQuizEditor", type:'pair_input'},
    'Ranking Question': {component: RankingQuestionEditor, type:''}
  };

  // const headings = [
  //   {name:"Heading 1", size: "heading1"},
  //   {name:"Heading 2", size: "heading2"},
  //   {name:"Heading 3", size: "heading3"}
  // ];

  const media = {
    'Upload Document': {component: "DocumentEditorWrapper", type:'document'},
    'Upload Audio': {component: "AudioEditorWrapper", type:'audio'}
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

  // Handle Preview button click
  const handlePreview = () => {
    if (!title.trim()) {
      setError("Module title is required for preview");
      return;
    }

    // Generate preview content structure (similar to ModuleViewAlternative)
    const documentItems = [];
    const audioItems = [];
    // add future media
    const quizItems = [];

    
    // Process modules to build the content structure
    modules.forEach(module => {
      if (module.componentType === "media") {
        // Handle media modules
        if (module.mediaType === "document") {
          const editor = editorRefs.current[module.id];

          const tempFiles = editor?.getTempFiles?.() || [];
          
          tempFiles.forEach(fileData => {
            // Handle both new files and existing files
            const fileUrl = fileData.originalDocument 
            ? fileData.originalDocument.file_url 
            : URL.createObjectURL(fileData.file);

            documentItems.push({
              id: fileData.id || module.id,
              type: 'infosheet',
              title: fileData.file.name || "Document",
              content: `View or download: ${fileData.file.name}`,
              documents: [{
                contentID: fileData.id || module.id,
                filename: fileData.file.name,
                // file_url: URL.createObjectURL(fileData.file),
                file_url: fileUrl,
                file_size: fileData.file.size
              }],
              moduleId: editId || "preview"
            });
          });
        } 
        else if (module.mediaType === "audio") {
          const editor = editorRefs.current[module.id];

          
          const tempFiles = editor?.getTempFiles?.() || [];
          
          tempFiles.forEach(fileData => {
            // Handle both new files and existing files
            const fileUrl = fileData.originalAudio 
              ? fileData.originalAudio.file_url 
              : URL.createObjectURL(fileData.file);

            audioItems.push({
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
              moduleId: editId || "preview"
            });
          });
        }
      } 
      else if (module.componentType === "template") {
        // Handle quiz templates
        const questions = getQuestionsFromEditor(module.id);
        
        quizItems.push({
          id: module.id,
          type: 'quiz',
          quiz_type: module.quizType,
          title: module.type,
          taskData: {
            contentID: module.id,
            title: module.type,
            quiz_type: module.quizType,
            questions: questions
          }
        });
      }
    });
    console.log("Document items being added:", documentItems);
    console.log("Audio items being added:", audioItems);
    
    // Structured content for preview
    const structuredContent = [
      {
        id: 'section-introduction',
        type: 'section',
        title: 'Introduction',
        content: [
          {
            id: 'paragraph-intro',
            type: 'paragraph',
            text: description || title
          }
        ]
      }
    ];

    // Add Resources section if there are any resources
    if (documentItems.length > 0 || audioItems.length > 0) {
      structuredContent.push({
        id: 'section-resources',
        type: 'section',
        title: 'Resources',
        content: [...documentItems, ...audioItems]
      });
    }

    // Add Assessment section if there are quizzes
    if (quizItems.length > 0) {
      structuredContent.push({
        id: 'section-assessment',
        type: 'section',
        title: 'Assessment',
        content: quizItems
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
    
    // Enter preview mode with generated data
    enterPreviewMode(previewData);
  };

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
      // future media ...
    }
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

      // add future media... 
    }
    
    // Clear pending deletions
    setPendingDeletions({ document: [], audio: [] });
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
      
      // tempFiles.forEach(fileData => {
      //   formData.append('files', fileData.file);
      // });

      // if module has an ID and its not a temporary ID
      if (module.id && !module.id.toString().startsWith('new-')) {
        formData.append('component_id', module.id);
      }

      let hasNewFiles = false;
      tempFiles.forEach(fileData => {
        // only append actual file objext, not references to existing files
        if (fileData.file instanceof File && !fileData.originalDocument && !fileData.originalAudio) {
          formData.append('files', fileData.file);
          hasNewFiles = true;
        }
      });

      // only upload when there is new Files
      if (!hasNewFiles) return;
      
      if (module.mediaType === "document") {
        await DocumentService.uploadDocuments(formData);
      } else if (module.mediaType === "audio") {
        await AudioService.uploadAudios(formData);
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
      {/* in preview mode, show ModuleViewAlternative iwith preview data */}
      {isPreviewMode ? (<ModuleViewAlternative/> 
        // normal mode
        ): (
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
              <div className={styles["button-container"]}>
                <div className={styles["preview-container"]}>
                  <button 
                    className={styles["preview-btn"]} 
                    onClick={handlePreview} 
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
            </div>
          </>
        )}
    </div>
  );
};

export default AddModule;