import React, { useState, useRef, useEffect } from "react";
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
  
  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Module types and their corresponding components
  const moduleOptions = {
    "Flashcard Quiz": { component: <VisualFlashcardEditor />, type: "flashcard" },
    "Fill in the Blanks": { component: <VisualFillTheFormEditor />, type: "text_input" },
    "Flowchart Quiz": { component: <VisualFlowChartQuiz />, type: "statement_sequence" },
  };

  // Check for edit mode on component mount
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const editModuleId = params.get('edit');
    
    if (editModuleId) {
      setEditId(editModuleId);
      setIsEditing(true);
      fetchModuleData(editModuleId);
    }
    
    fetchTags();
  }, [location]);

  // Fetch module data for editing
  const fetchModuleData = async (moduleId) => {
    try {
      setIsLoading(true);
      
      // Fetch module details
      const moduleData = await QuizApiUtils.getModule(moduleId);
      
      // Set basic module info
      setTitle(moduleData.title);
      setDescription(moduleData.description || "");
      setTags(moduleData.tags || []);
      
      // Fetch tasks associated with this module
      const tasks = await QuizApiUtils.getModuleTasks(moduleId);
      
      // Fetch questions for each task
      const moduleTemplates = await Promise.all(tasks.map(async (task) => {
        let type = "";
        
        // Map API quiz_type to frontend type
        switch(task.quiz_type) {
          case "flashcard":
            type = "Flashcard Quiz";
            break;
          case "text_input":
            type = "Fill in the Blanks";
            break;
          case "statement_sequence":
            type = "Flowchart Quiz";
            break;
          default:
            type = "Flashcard Quiz";
        }
        
        // Fetch questions for this task
        try {
          const questions = await QuizApiUtils.getQuestions(task.contentID);
          
          return {
            id: task.contentID,
            type: type,
            quizType: task.quiz_type,
            questions: questions
          };
        } catch (error) {
          console.error(`Error fetching questions for task ${task.contentID}:`, error);
          return {
            id: task.contentID,
            type: type,
            quizType: task.quiz_type,
            questions: []
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
  };

  // Fetch available tags
  const fetchTags = async () => {
    try {
      const response = await api.get('/api/tags/');
      setAvailableTags(response.data);
    } catch (err) {
      console.error("Error fetching tags:", err);
      setError("Failed to load tags. Please try again.");
    }
  };

  // Add a module to the list
  const addModule = (moduleType) => {
    setModules([...modules, { 
      id: Date.now(), // This will be replaced with the API-generated ID when saved
      type: moduleType, 
      quizType: QuizApiUtils.getQuizTypeValue(moduleType),
      questions: []
    }]);
    setShowDropdown(false);
  };

  // Remove a module from the list
  const removeModule = (id) => {
    setModules(modules.filter((module) => module.id !== id));
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

  // Update module questions from child components
  const updateModuleQuestions = (moduleId, questions) => {
    // setModules(modules.map(module => 
    //   module.id === moduleId ? { ...module, questions } : module
    // ));
  };

  // Publish/Update the module
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

    setIsLoading(true);
    setError(null);

    try {
      let moduleId;
      
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
        const existingTasks = await QuizApiUtils.getModuleTasks(editId);
        
        // Keep track of tasks we're updating
        const updatedTaskIds = [];
        
        // Update or create tasks
        for (const module of modules) {
          // If the module has an ID that matches an existing task, update it
          const existingTask = existingTasks.find(task => task.contentID === module.id);
          
          if (existingTask) {
            // Update existing task
            const taskData = {
              title: `${module.type} for ${title}`,
              moduleID: moduleId,
              description: `${module.type} content for ${title}`,
              quiz_type: module.quizType,
              text_content: "Updated by admin interface",
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
            for (let i = 0; i < module.questions.length; i++) {
              const question = module.questions[i];
              await QuizApiUtils.createQuestion({
                task_id: existingTask.contentID,
                question_text: question.question_text || question.text || "",
                hint_text: question.hint_text || question.hint || "",
                order: i
              });
            }
          } else {
            // Create new task
            const taskData = {
              title: `${module.type} for ${title}`,
              moduleID: moduleId,
              description: `${module.type} content for ${title}`,
              quiz_type: module.quizType,
              text_content: "Generated by admin interface",
              author: 1, // Use the current user ID or a default admin ID
              is_published: true
            };
            
            const taskResponse = await QuizApiUtils.createTask(taskData);
            const taskId = taskResponse.contentID;
            updatedTaskIds.push(taskId);
            
            // Create questions for this new task
            for (let i = 0; i < module.questions.length; i++) {
              const question = module.questions[i];
              await QuizApiUtils.createQuestion({
                task_id: taskId,
                question_text: question.question_text || question.text || "",
                hint_text: question.hint_text || question.hint || "",
                order: i
              });
            }
          }
        }
        
        // Delete tasks that weren't updated
        for (const task of existingTasks) {
          if (!updatedTaskIds.includes(task.contentID)) {
            await QuizApiUtils.deleteTask(task.contentID);
          }
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
          const taskData = {
            title: `${module.type} for ${title}`,
            moduleID: moduleId,
            description: `${module.type} content for ${title}`,
            quiz_type: module.quizType,
            text_content: "Generated by admin interface",
            author: 1, // Use the current user ID or a default admin ID
            is_published: true
          };
          
          // Create the task
          const taskResponse = await QuizApiUtils.createTask(taskData);
          const taskId = taskResponse.contentID;
          
          // Create questions for this task
          if (module.questions && module.questions.length > 0) {
            for (let i = 0; i < module.questions.length; i++) {
              const question = module.questions[i];
              await QuizApiUtils.createQuestion({
                task_id: taskId,
                question_text: question.question_text || question.text || "",
                hint_text: question.hint_text || question.hint || "",
                order: i
              });
            }
          }
        }
      }
      
      // Success message
      alert(isEditing ? "Module updated successfully!" : "Module published successfully!");
      navigate("/admin/courses");
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
        {modules.map((module) => (
          <div key={module.id} className="module-item">
            <h3>{module.type}</h3>
            {React.cloneElement(moduleOptions[module.type].component, {
              moduleId: module.id,
              quizType: module.quizType,
              initialQuestions: module.questions,
              onUpdateQuestions: (questions) => updateModuleQuestions(module.id, questions)
            })}
            <button onClick={() => removeModule(module.id)} className="remove-module-btn">Remove</button>
          </div>
        ))}
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
            {modules.map((module, index) => (
              <div key={module.id} className="preview-module">
                <h3>{module.type} {index + 1}</h3>
                <p>Questions: {module.questions?.length || 0}</p>
              </div>
            ))}
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