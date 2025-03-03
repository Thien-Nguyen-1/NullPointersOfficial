import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import VisualFlashcardEditor from "../components/editors/VisualFlashcardEditor";
import VisualFillTheFormEditor from "../components/editors/VisualFillTheFormEditor";
import VisualFlowChartQuiz from "../components/editors/VisualFlowChartQuiz";

import api from "../services/api";
import { QuizApiUtils} from "../services/QuizApiUtils";
import "../styles/AddModule.css";

const AddModule = () => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]); // avoid duplication of tags
  const [modules, setModules] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const moduleOptions = {
    "Flashcard Quiz": { component: <VisualFlashcardEditor />, type: "flashcard" },
    "Fill in the Blanks": { component: <VisualFillTheFormEditor />, type: "text_input" },
    "Flowchart Quiz": { component: <VisualFlowChartQuiz />, type: "statement_sequence" },
  };  

  // fetch available tags when component mounts
  useEffect(() => {
    fetchTags();
  }, []);

  // fetch tags from the API
  const fetchTags = async () => {
    try {
      const response = await api.get('/api/tags/');
      setAvailableTags(response.data);
    } catch (err) {
      console.error("Error fetching tags:", err);
      setError("Failed to load tags. Please try again.");
    }
  };

  
  const addModule = (moduleType) => {
    setModules([...modules, {
      id: Date.now(), 
      type: moduleType,
      quizType: moduleOptions[moduleType].type,
      questions: [] }]);
    setShowDropdown(false);
  };

  const removeModule = (id) => {
    setModules(modules.filter((module) => module.id !== id));
  };

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
  
  // remove a tag from selection
  const removeTag = (tagId) => {
    setTags(tags.filter(t => t !== tagId));
  };

  // update module questions from child components
  const updateModuleQuestions = (moduleId, questions) => {
    setModules(modules.map(module => 
      module.id === moduleId ? { ...module, questions } : module
    ));
  };

  const publishModule = async () => {
    if (!title.trim() || modules.length === 0) {
      setError("Module title is required")
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try{
      // 1. create a module
      const moduleData = {
        title: title,
        description: description || title,
        tags: tags,
        pinned: false,
        upvotes: 0
      };

      const moduleResponse = await QuizApiUtils.createModule(moduleData);
      const createModuleId = moduleResponse.id;

      // 2. (optional) create content for each module

      // option : choose task/quiz
      for (const module of modules) {
        const taskData = {
          title: '${module.type} for ${title}',
          moduleID: createModuleId,
          description: `${module.type} content for ${title}`,
          quiz_type: module.quizType,
          text_content: "Generated by admin", 
          author: 1, // use the current user ID (temporarily) 
          is_published: true
        };

        // create the task/quiz
        const taskResponse = await QuizApiUtils.createTask(taskData);
        const taskId = taskResponse.contentID;

        // create questions for this task
        if (module.questions && module.questions.length > 0) {
          for (let i = 0; i < module.questions.length; i++) {
            const question = module.questions[i];
            await QuizApiUtils.createQuestion({
              task_id: taskId,
              question_text: question.question_text,
              hint_text: question.hint_text || "",
              order: i
            });
          }
        }
      }

      // successesfully published
      alert("Module published successfully!");
      navigate("/admin/courses");

    } catch (err) {
      console.error("Error publishing module:", err);
      setError(`Failed to publish module: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsLoading(false);
    }

  };

  return (
    <div className="module-editor-container">
      <h1 className="module-title">Add Module</h1>
      
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

      {!isPreview && (
        <div className="button-container">
          <button className="preview-btn" onClick={() => setIsPreview(true)} disabled={isLoading}>
            Preview
          </button>
          <button className="publish-btn" onClick={publishModule} disabled={isLoading}>
            {isLoading ? "Publishing..." : "Publish"}
          </button>
          <button className="edit-btn">Edit</button>
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
