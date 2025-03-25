import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import VisualFlashcardEditor from "../components/editors/VisualFlashcardEditor";
import VisualFillTheFormEditor from "../components/editors/VisualFillTheFormEditor";
import VisualFlowChartQuiz from "../components/editors/VisualFlowChartQuiz";
import VisualQuestionAndAnswerFormEditor from "../components/editors/VisualQuestionAndAnswerFormEditor";
import HeadingsComponent from "../components/editors/Headings";
import DocumentUploader, {DocumentEditorWrapper} from "../components/editors/DocumentUploader";
import api from "../services/api";
import { QuizApiUtils } from "../services/QuizApiUtils";
import { AuthContext } from "../services/AuthContext";
import DocumentService from "../services/DocumentService";

import styles from "../styles/AddModule.module.css";
import VisualMatchingQuestionsQuizEditor from "../components/editors/VisualMatchingQuestionsQuizEditor";

const AddModule = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [modules, setModules] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  const [error, setError] = useState(null);
  // const [currentUser, setCurrentUser] = useState(null);
  const [headingSize, setHeadingSize] = useState("heading1");

  
  // Use AuthContext to get the current user
  const { user: currentUser } = useContext(AuthContext);
  
  // Create a ref to store references to editor components
  const editorRefs = useRef({});
  // Store initial questions for each module
  const initialQuestionsRef = useRef({});
  
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

//to change size of heading for title
  const handleHeadingChange = (event) => {
    setHeadingSize(event.target.value);
  };


  // Module types and their corresponding components
  const moduleOptions = {
    "Flashcard Quiz": { component: VisualFlashcardEditor, type: "flashcard" },
    "Fill in the Blanks": { component: VisualFillTheFormEditor, type: "text_input" },
    "Flowchart Quiz": { component: VisualFlowChartQuiz, type: "statement_sequence" },
    'Question and Answer Form': { component: VisualQuestionAndAnswerFormEditor, type:'question_input'},
    'Matching Question Quiz': {component: VisualMatchingQuestionsQuizEditor, type:'pair_input'}
  };

  const headings = [
    {name:"Heading 1", size: "heading1"},
    {name:"Heading 2", size: "heading2"},
    {name:"Heading 3", size: "heading3"}
  ];

  const media = {
    'Upload Document': {component: DocumentEditorWrapper, type:'document'}
  };

  useEffect(() => {
    if (!currentUser)
      navigate('/login')
    // Rely on AuthContext to provide the user
    console.log("Current user from AuthContext:", currentUser);
  }, [currentUser, navigate]);

  // Fetch available tags
  const fetchTags = useCallback(async () => {
    try {
      const response = await api.get('/api/tags/');
      setAvailableTags(response.data);
    } catch (err) {
      console.error("Error fetching tags:", err);
      setError("Failed to load tags. Please try again.");
    }
  }, []);

  // Fetch module data for editing
  const fetchModuleData = useCallback(async (moduleId) => {
    try {
      setIsLoading(true);

      // fetch module data first
      const moduleData = await QuizApiUtils.getModule(moduleId);
      console.log("[DEBUG] Fetched Module Data:", moduleData);
      setTitle(moduleData.title);
      setDescription(moduleData.description || "");
      setTags(moduleData.tags || []);

      // // fetch TASK/QUIZ
      // const tasks = await QuizApiUtils.getModule(moduleId);
      // console.log("[DEBUG] Fetched Tasks for Module:", tasks);
      // // fetch MEDIA Content (other than quiz)
      // const documents = await QuizApiUtils.getModuleContents(moduleId);
      // console.log("[DEBUG] Fetched Documents for Module:", documents);

      const [tasksResponse, documentsResponse] = await Promise.all([
        QuizApiUtils.getModuleSpecificTasks(moduleId).catch(error => {
          console.error("Error fetching tasks:", error);
          return []; // Return empty array on error
        }),
        QuizApiUtils.getModuleContents(moduleId).catch(error => {
          console.error("Error fetching documents:", error);
          return []; // Return empty array on error
        })
      ]);

      const tasks = tasksResponse || [];
      const documents = documentsResponse || [];

      console.log("[DEBUG] Fetched Tasks for Module:", tasks);
      console.log("[DEBUG] Fetched Documents for Module:", documents);

      // Reset the initialQuestionsRef to avoid any stale data
      initialQuestionsRef.current = {};

      const taskTemplates = await Promise.all(tasks.map(async (task) => {
        const componentType = QuizApiUtils.getComponentType(task.quiz_type);
  
        // Get the appropriate type based on component type
        let type;
        console.log(`Task quiz_type: ${task.quiz_type}`);
        console.log(`Component type determined: ${componentType}`);

        if (componentType === 'media') {
          console.log(`UI media type: ${QuizApiUtils.getUIMediaTypeFromAPIType(task.quiz_type)}`);
          type = QuizApiUtils.getUIMediaTypeFromAPIType(task.quiz_type);
        } else {
          type = QuizApiUtils.getUITypeFromAPIType(task.quiz_type);
        }

        try {
          const questions = await QuizApiUtils.getQuestions(task.contentID);
          console.log(`[DEBUG] Fetched Questions for Task ID (${task.contentID}) - Type: ${task.quiz_type}:`, questions);

          // Store initial questions in the ref using task.contentID as the key
          initialQuestionsRef.current[task.contentID] = questions;
          
          return {
            id: task.contentID,
            type,
            quizType: task.quiz_type,
            componentType,
            taskId: task.contentID, // Store the actual task ID for referencing
            moduleId: moduleId // Store the module ID to maintain relationship
          };
        } catch (error) {
          console.error(`Error fetching questions for task ${task.contentID}:`, error);
          initialQuestionsRef.current[task.contentID] = [];
          
          return {
            id: task.contentID,
            type,
            quizType: task.quiz_type,componentType,
            taskId: task.contentID,
            moduleId: moduleId
          };
        }
      }));

      // Process documents
      const documentTemplates = documents.map(doc => ({
        id: doc.contentID,
        type: 'Upload Document',
        quizType: 'document',
        componentType: 'media',
        moduleId: moduleId, // Store the document ID separately
        actualModuleId: moduleId // Store the actual module ID
      }));

      setModules([...taskTemplates, ...documentTemplates]);
      console.log("[DEBUG] Final Module Templates :",[...taskTemplates, ...documentTemplates]);

      setIsLoading(false);
    } catch (err) {
      console.error("Error fetching module data:", err);
      setError(`Failed to load module data: ${err.response?.data?.detail || err.message}`);
      setIsLoading(false);
    }
  }, []);

  // Load data when the component mounts
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editModuleId = params.get('edit');

    if (editModuleId) {
      setEditId(editModuleId);
      setIsEditing(true);
      fetchModuleData(editModuleId);
    }

    fetchTags();
  }, [location, fetchModuleData, fetchTags]);

  // Add a module to the list
  const addModule = (moduleType, componentType) => {
    const newModuleId = `new-${Date.now()}`;

    if (componentType == "heading") {
      const newHeading = {
        id: newModuleId,
        componentType: componentType,
        size: moduleType.size,
      }

      setModules([...modules, newHeading]);
    } else if (componentType === "template") {
      console.log(`[DEBUG] Adding template module: ${moduleType}, with quizType: ${QuizApiUtils.getQuizTypeValue(moduleType)}`);
      const newModule = { 
        id: newModuleId,
        type: moduleType,
        componentType: componentType, 
        quizType: QuizApiUtils.getQuizTypeValue(moduleType),
      };

      setModules([...modules, newModule]);
    } else if (componentType === "media") {
      const newModule = { 
        id: newModuleId,
        type: moduleType,
        componentType: componentType, 
        mediaType: media[moduleType].type,
        moduleId: editId || null
      };
      setModules([...modules, newModule]);
    }
    
    

    // Initialize empty questions for this module
    initialQuestionsRef.current[newModuleId] = [];

    setShowDropdown(false);
  };

  // Remove a module
  const removeModule = (id) => {
    setModules(modules.filter(module => module.id !== id));

    // Clean up refs
    delete editorRefs.current[id];
    delete initialQuestionsRef.current[id];
  };

  // Add a new tag
  const addTag = async () => {
    const newTag = prompt('Enter a new tag:');
    if (!newTag || newTag.trim() === '') return;
    
    // Convert to lowercase for case-insensitive comparison
    const newTagLower = newTag.toLowerCase().trim();
    
    // Check if the tag already exists in availableTags (case-insensitive)
    const existingTag = availableTags.find(
      tag => tag.tag.toLowerCase() === newTagLower
    );
    
    if (existingTag) {
      // Check if this tag is already selected
      if (tags.includes(existingTag.id)) {
        alert("This tag is already added to the module.");
        return;
      }
      // Add the existing tag
      setTags([...tags, existingTag.id]);
    } else {
      // Create a new tag
      try {
        const response = await api.post('/api/tags/', { tag: newTagLower });
        setAvailableTags([...availableTags, response.data]);
        setTags([...tags, response.data.id]);
      } catch (err) {
        // Handle errors including unique constraint violations
        if (err.response?.data?.tag?.includes("already exists")) {
          alert("This tag already exists in the system.");
          
          // Try to fetch all tags again to get the updated list
          fetchTags();
        } else {
          console.error("Error creating tag:", err);
          setError(`Failed to create tag: ${err.response?.data?.detail || err.message}`);
        }
      }
    }
  };

  // Remove a tag
  const removeTag = (tagId) => {
    setTags(tags.filter(t => t !== tagId));
  };

  const publishModule = async () => {
    // Validate inputs
    if (!title.trim()) {
      setError("Module title is required");
      return;
    }

    if (modules.length === 0) {
      setError("At least one template is required");
      return;
    }

    // Make sure we have a valid author ID
    let authorId = 1; // Default fallback
    if (currentUser) {
      console.log("[DEBUG] Current User Object:", currentUser);
      
      
      if (currentUser.id) {
        authorId = currentUser.id;
      } else if (currentUser.user_id) {
        authorId = currentUser.user_id;
      } else if (currentUser.pk) {
        authorId = currentUser.pk;
      } else {
        console.error("Could not extract user ID from:", currentUser);
        setError("Unable to determine user identity");
        return;
      }

    } else {
      console.error("[DEBUG]Could not extract user ID from:", currentUser);
      setError("Unable to determine user identity");
      return;
    }
    
    console.log("[DEBUG] Using Author ID:", authorId);

  
    setIsLoading(true);
    setError(null);

    try {
      let moduleId;
      // Array to track updated task IDs
      const updatedTaskIds = [];
      
      if (isEditing) {
        // Update existing module
        const moduleData = {
          title: title,
          description: description || title,
          tags: tags
        };
        
        await QuizApiUtils.updateModule(editId, moduleData);
        moduleId = editId;
        
        // Handle existing tasks/modules
        // First, get current tasks
        const existingTasks = await QuizApiUtils.getModuleTasks(moduleId);
        
          // Update or create tasks
          for (const module of modules) {
            // Get the current questions from the editor component using the ref
            let currentQuestions = [];
            const editorComponent = editorRefs.current[module.id];
            

            // Special handling for MEDIA components (document, audio, images, videos)
            if (module.componentType === "media") {
              console.log(`Processing media module: ${module.type}, mediaType: ${module.mediaType}`);
              // Handle document uploads using DocumentService
              if (module.mediaType === "document") {
                const documentEditor = editorRefs.current[module.id];
                console.log("Document editor ref:", documentEditor);
                console.log("Has getTempFiles method:", documentEditor && typeof documentEditor.getTempFiles === 'function');
    
                if (documentEditor && documentEditor.getTempFiles) {
                  const tempFiles = documentEditor.getTempFiles();
                  console.log("Temp files retrieved:", tempFiles);
                  console.log("Number of temp files:", tempFiles ? tempFiles.length : 0);
      
                  
                  if (tempFiles && tempFiles.length > 0) {
                    try {
                      // Create a FormData object to upload the files
                      const formData = new FormData();
                      formData.append('module_id', moduleId);
                      
                      // Add each temp file to the form data
                      tempFiles.forEach(fileData => {
                        formData.append('files', fileData.file);
                      });
                      
                      // Use DocumentService to upload directly
                      const uploadedDocs = await DocumentService.uploadDocuments(formData);
                      console.log("[DEBUG] Uploaded documents:", uploadedDocs);
                    } catch (docError) {
                      console.error("Error uploading documents:", docError);
                      setError(`Failed to upload documents: ${docError.message}`);
                    }
                  } else {
                    console.log("No temp files to upload");
                  }
                } else {
                  console.log("Cannot get temp files from editor");
                }
              }
              // Future media types would go here (audio, images, videos)
              // For example, if module.mediaType === "audio_clip" etc

              // Skip the regular task creation process for all media components
              continue; // This goes to the next iteration of the loop

            }
      
          // Regular non-media task handling continues below
          if (editorComponent && typeof editorComponent.getQuestions === 'function') {
            // If the editor component exposes a getQuestions method, use it
            currentQuestions = editorComponent.getQuestions();
            
            // Make sure we have valid data
            if (Array.isArray(currentQuestions) && currentQuestions.length > 0) {
              // Check if the questions have the expected format
              if (!currentQuestions[0].question_text && currentQuestions[0].text) {
                // Convert from {text: "..."} format to {question_text: "..."} format
                currentQuestions = currentQuestions.map(q => ({
                  ...q,
                  question_text: q.text,
                  hint_text: q.hint || "",
                  answers: q.answers || []
                }));
              }
            }
          } else {
            // Fallback to the initial questions if we can't get them from the component
            currentQuestions = initialQuestionsRef.current[module.id] || [];
          }
          
          // Determine if this is an existing task or a new one
          const isExistingTask = !module.id.toString().startsWith("new-");
          const existingTask = isExistingTask 
            ? existingTasks.find(task => task.contentID === module.id)
            : null;
          
          
          if (existingTask) {
            // Update existing task
            const taskData = {
              title: `${module.type} for ${title}`,
              moduleID: moduleId, // Explicitly set module ID to maintain relationship
              description: `${module.type} content for ${title}`,
              // Use mediaType if it's a media component, otherwise use quizType
              quiz_type: module.quizType,
              text_content: "Updated by admin interface",
              author: authorId, // Use the retrieved user ID
              is_published: true
            };
            
            await QuizApiUtils.updateTask(existingTask.contentID, taskData);
            updatedTaskIds.push(existingTask.contentID);
            
            // Get existing questions
            const existingQuestions = await QuizApiUtils.getQuestions(existingTask.contentID);
            
            // Delete all existing questions (simpler than trying to update)
            for (const question of existingQuestions) {
              await QuizApiUtils.deleteQuestion(question.id);
            }
            
            // Inside the for loop where you process currentQuestions
            console.log("[DEBUG] Processing questions for task:", existingTask.contentID);
            console.log("[DEBUG] Current questions:", currentQuestions);

            // Create new questions
            for (let i = 0; i < currentQuestions.length; i++) {
              const question = currentQuestions[i];
              console.log("[DEBUG] Creating question:", i + 1);
              console.log("[DEBUG] Question data:", question);

              const questionData = {
                task: existingTask.contentID,
                question_text: question.question_text || question.text || "",
                hint_text: question.hint_text || question.hint || "",
                order: i,
                answers: question.answers || []
              };

              console.log("[DEBUG] Formatted question data for API:", questionData);

              try {
                await QuizApiUtils.createQuestion(questionData);
              } catch (questionError) {
                console.error(`Error creating question ${i+1}:`, questionError);
              }


            }
          } else {
            // Create new task
            const taskData = {
              title: `${module.type} for ${title}`,
              moduleID: moduleId,
              description: `${module.type} content for ${title}`,
              // Use mediaType if it's a media component, otherwise use quizType
              quiz_type: module.quizType,
              text_content: "Generated by admin interface",
              author: authorId, // Use the retrieved user ID
              is_published: true
            };
            
            // Use the new function that ensures module-task relationship
            const taskResponse = await QuizApiUtils.createModuleTask(moduleId, taskData);
            const taskId = taskResponse.contentID;
            updatedTaskIds.push(taskId);
            
            // Create questions for this new task
            for (let i = 0; i < currentQuestions.length; i++) {
              const question = currentQuestions[i];
              const questionData = {
                task_id: taskId,
                question_text: question.question_text || question.text || "",
                hint_text: question.hint_text || question.hint || "",
                order: i,
                answers:question.answers || []
              };
              await QuizApiUtils.createQuestion(questionData);
            }
          }
        }
        
        // Delete tasks that weren't updated
        try {
          const deletedCount = await QuizApiUtils.cleanupOrphanedTasks(moduleId, updatedTaskIds);
        } catch (cleanupError) {
          console.error(`[ERROR] Error cleaning up orphaned tasks: ${cleanupError}`);
        }
        
      } else {
        // Create a new module
        const moduleData = {
          title: title,
          description: description || title,
          tags: tags,
          pinned: false,
          upvotes: 0
        };
        
        const moduleResponse = await QuizApiUtils.createModule(moduleData);
        moduleId = moduleResponse.id;
        
        // Create tasks for each module
        for (const module of modules) {
          // Get the current questions from the editor component using the ref
          let currentQuestions = [];
          const editorComponent = editorRefs.current[module.id];
          
          // Special handling for media components (document, audio, images, videos)
          if (module.componentType === "media") {
            // Handle document uploads
            if (module.mediaType === "document") {
              const documentEditor = editorRefs.current[module.id];
              if (documentEditor && documentEditor.getTempFiles) {
                const tempFiles = documentEditor.getTempFiles();
                
                if (tempFiles && tempFiles.length > 0) {
                  try {
                    // Create a FormData object to upload the files
                    const formData = new FormData();
                    // Pass moduleId directly instead of an object
                    formData.append('module_id', moduleId);
                    
                    // Add each temp file to the form data
                    tempFiles.forEach(fileData => {
                      formData.append('files', fileData.file);
                    });
                    
                    // Use DocumentService to upload directly
                    const uploadedDocs = await DocumentService.uploadDocuments(formData);
                    console.log("[DEBUG] Uploaded documents:", uploadedDocs);
                  } catch (docError) {
                    console.error("Error uploading documents:", docError);
                    setError(`Failed to upload documents: ${docError.message}`);
                  }
                }
              }
            }
            // Future media types would go here (audio, images, videos)
    
            // Skip the regular task creation process for all media components
            continue;
          }

          if (editorComponent && typeof editorComponent.getQuestions === 'function') {
            // If the editor component exposes a getQuestions method, use it
            currentQuestions = editorComponent.getQuestions();
          } else {
            // Fallback to the initial questions if we can't get them from the component
            currentQuestions = initialQuestionsRef.current[module.id] || [];
          }
          
          const taskData = {
            title: `${module.type} for ${title}`,
            moduleID: moduleId,
            description: `${module.type} content for ${title}`,
            quiz_type:module.quizType,
            text_content: "Generated by admin interface",
            author: authorId, // Use the retrieved user ID
            is_published: true
          };
          
          // Create the task
          const taskResponse = await QuizApiUtils.createModuleTask(moduleId, taskData);
          const taskId = taskResponse.contentID;
          
          // Create questions for this task
          if (currentQuestions && currentQuestions.length > 0) {
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
          }
        }
      }
      
      // Verify the data by fetching it again
      try {
        const verifyTasks = await QuizApiUtils.getModuleTasks(moduleId);
        
        for (const task of verifyTasks) {
          const questions = await QuizApiUtils.getQuestions(task.contentID);
        }
      } catch (verifyErr) {
      }
      // for (const module of modules) {
      //   if (module.type === 'Question and Answer Form') {
      //     const editorRef = editorRefs.current[module.id];
      //     const questionAnswers = editorRef?.getSubmittedData?.() || [];
      //     for (const qa of questionAnswers){
      //     let formData = {
      //       title: `${module.type} for ${title}`,
      //       description: `${module.type} content for ${title}`,
      //       question:qa.question,
      //       answer:qa.answer,
      //       moduleID: moduleId,
      //       author: authorId
      //     };
      //     try {
      //       await QuizApiUtils.createQuestionAnswerFormTask(formData);
      //       console.log('Question Answer Form task created successfully');
      //     } catch (error) {
      //       console.error('Error creating Question Answer Form task:', error);
      //     }
      //   }
      //   }
      // }

      // for (const module of modules) {
      //   if (module.type === 'Matching Question Quiz') {
      //     const editorRef = editorRefs.current[module.id];
      //     const matchingQuestionAnswers = editorRef?.getPairs?.() || [];
      //     console.log(`[DEBUG] Saving Matching Question Pairs for Module ID: ${moduleId}`, matchingQuestionAnswers);

      //     for (const qa of matchingQuestionAnswers){
      //     let pairData = {
      //       title: `${module.type} for ${title}`,
      //       description: `${module.type} content for ${title}`,
      //       question:qa.question,
      //       answer:qa.answer,
      //       moduleID: moduleId,
      //       author: authorId
      //     };
      //     try {
      //       await QuizApiUtils.createMatchingQuestionsTask(pairData);
      //       console.log('matching question pairs task created successfully');
      //     } catch (error) {
      //       console.error('Error creating matching question pairs task:', error);
      //     }
      //   }
      //   }
      // }





      alert(isEditing ? "Module updated successfully!" : "Module published successfully!");
      navigate("/admin/all-courses");
    } catch (err) {
      console.error(isEditing ? "Error updating module:" : "Error publishing module:", err);
      setError(`Failed to ${isEditing ? 'update' : 'publish'} module: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

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
        <div className={styles["tags-container"]}>
          {tags.map((tagId) => {
            const tagObj = availableTags.find(t => t.id === tagId);
            return tagObj ? (
              <span key={tagId} className={styles["tag"]}>
                {tagObj.tag} <button className={styles["remove-tag-btn"]} onClick={() => removeTag(tagId)}>x</button>
              </span>
            ) : null;
          })}
          <div className={styles["tag-button-wrapper"]}>
            <button className={styles["plus-button"]} onClick={addTag}>+</button>
            <span className={styles["tag-label"]}>Add module tags</span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className={styles["error-message"]}>
            <p>{error}</p>
            <button onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Modules List */}
        <div className={styles["modules-list"]}>
          {modules.map((module) => {
            let EditorComponent = null;
            if (module.componentType === "template") {
              EditorComponent = moduleOptions[module.type]?.component
            } else if (module.componentType === "heading") {
              EditorComponent = HeadingsComponent;
            } else if (module.componentType === "media") {
              EditorComponent = media[module.type]?.component;
            }

            // Skip if no component is found for this type
            if (!EditorComponent) {
              console.error(`[ERROR] No editor component found for type: ${module.type}`);
              return (
                <div key={module.id} className={`${styles["module-item"]} ${styles["error"]}`}>
                  <h3>{module.type} (ID: {module.id.substring(0, 6)}...) - Error: No editor found</h3>
                </div>
              );
            } 
            
            if (module.componentType === "heading") {
              return (
                <div key={module.id} className={styles["module-item"]}>
                    <EditorComponent
                      headingSize={module.size}
                      key={`editor-${module.id}`}
                    />  
                    <button onClick={() => removeModule(module.id)} className={styles["remove-module-btn"]}>Remove</button>
                </div>
              )
            }
            
            return (
              <div key={module.id} className={styles["module-item"]}>
                <h3>{module.type} (ID: {module.id.substring(0, 6)}...)</h3>
                <EditorComponent
                  ref={(el) => { 
                    editorRefs.current[module.id] = el;
                  }}
                  moduleId={module.moduleId }  // Use moduleId if available, otherwise fall back to id
                  documentId={module.id}           // Pass document ID separately if needed
                  quizType={module.componentType === "media" ? module.mediaType : module.quizType}
                  initialQuestions={initialQuestionsRef.current[module.id] || []}
                  key={`editor-${module.id}`} // Add a key to force re-render when questions change
                />
                <button onClick={() => removeModule(module.id)} className={styles["remove-module-btn"]}>Remove</button>
              </div>
            );
          })}
        </div>

        {/* Add Module Templates Button */}
        <div className={styles["dropdown-wrapper"]}>
          <div className={styles["templates-button-wrapper"]}>
            <button ref={dropdownRef} onClick={() => setShowDropdown(!showDropdown)} className={styles["plus-button"]}>+</button>
            <span className={styles["templates-label"]}>Add Template</span>
          </div>

          {/* Templates Dropdown */}
          {showDropdown && (
            <div className={styles["dropdown-menu"]} style={{ position: "absolute", top: dropdownRef.current?.offsetTop + 40, left: dropdownRef.current?.offsetLeft }}>
              <h4 className={styles["dropdown-title"]}>Headings</h4>
              <div className={styles["dropdown-options"]}>
                {headings.map((heading, index) => (
                  <div
                    key={index}
                    className={styles["dropdown-item"]}
                    onClick={() => addModule(heading, "heading")}
                  >
                    {heading.name}
                  </div> 
                ))}
              </div>           
              <h4 className={styles["dropdown-title"]}>Basic Blocks</h4>
              <div className={styles["dropdown-options"]}>
                {Object.keys(moduleOptions).map((moduleType, index) => (
                  <div
                    key={index}
                    value={index}
                    className={styles["dropdown-item"]}
                    onClick={() => addModule(moduleType, "template")}
                  >
                    {moduleType}
                  </div>
                ))}
              </div>
              <h4 className={styles["dropdown-title"]}>Media</h4>
              <div className={styles["dropdown-options"]}>
                {Object.keys(media).map((mediaType, index) => (
                  <div
                    key={index}
                    className={styles["dropdown-item"]}
                    onClick={() => addModule(mediaType, "media")}
                  >
                    {mediaType}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Action Buttons */}
      {!isPreview && (
        <div className={styles["button-container"]}>
          <div className={styles["preview-container"]}>
            <button className={styles["preview-btn"]} onClick={() => setIsPreview(true)} disabled={isLoading}>
              Preview
            </button>
          </div>
          <button className={styles["publish-btn"]} onClick={publishModule} disabled={isLoading}>
            {isLoading ? 
              (isEditing ? "Updating..." : "Publishing...") : 
              (isEditing ? "Update" : "Publish")
            }
          </button>
          {!isEditing && <button className={styles["edit-btn"]}>Edit</button>}
        </div>
      )}

      {/* Preview Mode */}
      {isPreview && (
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
          <button className={styles["exit-preview-btn"]} onClick={() => setIsPreview(false)}>
            Exit Preview
          </button>
        </div>
      )}
    </div>
  );
};

export default AddModule;