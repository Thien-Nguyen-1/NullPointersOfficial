import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import VisualFlashcardEditor from "../components/editors/VisualFlashcardEditor";
import VisualFillTheFormEditor from "../components/editors/VisualFillTheFormEditor";
import VisualFlowChartQuiz from "../components/editors/VisualFlowChartQuiz";
import api from "../services/api";
import { QuizApiUtils } from "../services/QuizApiUtils";

import "../styles/AddModule.css";

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
  const [currentUser, setCurrentUser] = useState(null);
  
  // Create a ref to store references to editor components
  const editorRefs = useRef({});
  // Store initial questions for each module
  const initialQuestionsRef = useRef({});
  
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Module types and their corresponding components
  const moduleOptions = {
    "Flashcard Quiz": { component: VisualFlashcardEditor, type: "flashcard" },
    "Fill in the Blanks": { component: VisualFillTheFormEditor, type: "text_input" },
    "Flowchart Quiz": { component: VisualFlowChartQuiz, type: "statement_sequence" },
  };

  // For development, use a prototype author
  useEffect(() => {
    // Set a prototype author for development
    const prototypeAuthor = { id: 1, user_id: 1 };
    setCurrentUser(prototypeAuthor);
    console.log("Using prototype author for development:", prototypeAuthor);
    
    // Optional: Still try to load from localStorage if available
    try {
      const userString = localStorage.getItem('user');
      if (userString) {
        const userData = JSON.parse(userString);
        setCurrentUser(userData);
        console.log("Loaded user from localStorage:", userData);
      }
    } catch (err) {
      console.warn("Could not parse user data from localStorage:", err);
    }
  }, []);

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
      
      const moduleData = await QuizApiUtils.getModule(moduleId);
      setTitle(moduleData.title);
      setDescription(moduleData.description || "");
      setTags(moduleData.tags || []);
      
      // Use the new module-specific task function
      const tasks = await QuizApiUtils.getModuleSpecificTasks(moduleId);
      

      // Reset the initialQuestionsRef to avoid any stale data
      initialQuestionsRef.current = {};

      const moduleTemplates = await Promise.all(tasks.map(async (task) => {
        let type = QuizApiUtils.getUITypeFromAPIType(task.quiz_type);

        try {
          const questions = await QuizApiUtils.getQuestions(task.contentID);
          
          // Store initial questions in the ref using task.contentID as the key
          initialQuestionsRef.current[task.contentID] = questions;
          
          return {
            id: task.contentID,
            type,
            quizType: task.quiz_type,
            taskId: task.contentID, // Store the actual task ID for referencing
            moduleId: moduleId // Store the module ID to maintain relationship
          };
        } catch (error) {
          console.error(`Error fetching questions for task ${task.contentID}:`, error);
          initialQuestionsRef.current[task.contentID] = [];
          
          return {
            id: task.contentID,
            type,
            quizType: task.quiz_type,
            taskId: task.contentID,
            moduleId: moduleId
          };
        }
      }));

      setModules(moduleTemplates);
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
  const addModule = (moduleType) => {
    const newModuleId = `new-${Date.now()}`;
    
    const newModule = { 
      id: newModuleId,
      type: moduleType, 
      quizType: QuizApiUtils.getQuizTypeValue(moduleType),
    };
  
    
    setModules([...modules, newModule]);

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
    if (currentUser && currentUser.id) {
      authorId = currentUser.id;
    } else if (currentUser && currentUser.user_id) {
      authorId = currentUser.user_id;
    }
    
  
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
                  hint_text: q.hint || ""
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
            
            // Create new questions
            for (let i = 0; i < currentQuestions.length; i++) {
              const question = currentQuestions[i];
              const questionData = {
                task_id: existingTask.contentID,
                question_text: question.question_text || question.text || "",
                hint_text: question.hint_text || question.hint || "",
                order: i
              };
              await QuizApiUtils.createQuestion(questionData);
            }
          } else {
            // Create new task
            const taskData = {
              title: `${module.type} for ${title}`,
              moduleID: moduleId,
              description: `${module.type} content for ${title}`,
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
                order: i
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
            quiz_type: module.quizType,
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
                order: i
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
    <div className="module-editor-container">
      <h1 className="page-title">{isEditing ? "Edit Module" : "Add Module"}</h1>
      
      {isLoading && <div className="loading-overlay">Loading...</div>}
      
      {/* Module Title */}
      <input
        type="text"
        placeholder="Module Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="module-input heading-input"
      />
      
      {/* Module Description */}
      <textarea
        placeholder="Module Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="module-input description-input"
      />

      {/* Tags */}
      <div className="tags-container">
        {tags.map((tagId) => {
          const tagObj = availableTags.find(t => t.id === tagId);
          return tagObj ? (
            <span key={tagId} className="tag">
              {tagObj.tag} <button onClick={() => removeTag(tagId)}>x</button>
            </span>
          ) : null;
        })}
        <div className="tag-button-wrapper">
          <button className="plus-button tag-button" onClick={addTag}>+</button>
          <span className="tag-label">Add module tags</span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Modules List */}
      <div className="modules-list">
        {modules.map((module) => {
          const EditorComponent = moduleOptions[module.type]?.component;
          
          // Skip if no component is found for this type
          if (!EditorComponent) {
            console.error(`[ERROR] No editor component found for type: ${module.type}`);
            return (
              <div key={module.id} className="module-item error">
                <h3>{module.type} (ID: {module.id.substring(0, 6)}...) - Error: No editor found</h3>
              </div>
            );
          }
          
          return (
            <div key={module.id} className="module-item">
              <h3>{module.type} (ID: {module.id.substring(0, 6)}...)</h3>
              <EditorComponent
                ref={(el) => { 
                  editorRefs.current[module.id] = el;
                }}
                moduleId={module.id}
                quizType={module.quizType}
                initialQuestions={initialQuestionsRef.current[module.id] || []}
                key={`editor-${module.id}`} // Add a key to force re-render when questions change
              />
              <button onClick={() => removeModule(module.id)} className="remove-module-btn">Remove</button>
            </div>
          );
        })}
      </div>

      {/* Add Module Templates Button */}
      <div className="add-module templates-button-wrapper">
        <button ref={dropdownRef} onClick={() => setShowDropdown(!showDropdown)} className="plus-button">+</button>
        <span className="templates-label">Add Templates</span>
      </div>

      {/* Templates Dropdown */}
      {showDropdown && (
        <div className="dropdown-menu" style={{ position: "absolute", top: dropdownRef.current?.offsetTop + 40, left: dropdownRef.current?.offsetLeft }}>
          <h4 className="dropdown-title">Add Templates</h4>
          <div className="dropdown-options">
            {Object.keys(moduleOptions).map((moduleType, index) => (
              <div
                key={index}
                className="dropdown-item"
                onClick={() => addModule(moduleType)}
              >
                {moduleType}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isPreview && (
        <div className="button-container">
          <button className="preview-btn" onClick={() => setIsPreview(true)} disabled={isLoading}>
            Preview
          </button>
          <button className="publish-btn" onClick={publishModule} disabled={isLoading}>
            {isLoading ? 
              (isEditing ? "Updating..." : "Publishing...") : 
              (isEditing ? "Update" : "Publish")
            }
          </button>
          {!isEditing && <button className="edit-btn">Edit</button>}
        </div>
      )}

      {/* Preview Mode */}
      {isPreview && (
        <div className="preview-container">
          <h2>{title}</h2>
          <p>{description}</p>
          <div className="preview-tags">
            {tags.map((tagId) => {
              const tagObj = availableTags.find(t => t.id === tagId);
              return tagObj ? (
                <span key={tagId} className="preview-tag">{tagObj.tag}</span>
              ) : null;
            })}
          </div>
          <div className="preview-modules">
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
                <div key={module.id} className="preview-module">
                  <h3>{module.type} {index + 1}</h3>
                  <p>Questions: {questionCount}</p>
                </div>
              );
            })}
          </div>
          <button className="exit-preview-btn" onClick={() => setIsPreview(false)}>
            Exit Preview
          </button>
        </div>
      )}
    </div>
  );
};

export default AddModule;