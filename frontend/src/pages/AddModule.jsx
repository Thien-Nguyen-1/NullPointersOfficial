import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import VisualFlashcardEditor from "../components/editors/VisualFlashcardEditor";
import VisualFillTheFormEditor from "../components/editors/VisualFillTheFormEditor";
import VisualFlowChartQuiz from "../components/editors/VisualFlowChartQuiz";

import "../styles/AddModule.css";

const AddModule = () => {
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState([]);
  const [modules, setModules] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const moduleOptions = {
    "Flashcard Quiz": <VisualFlashcardEditor />, 
    "Fill in the Blanks": <VisualFillTheFormEditor />, 
    "Flowchart Quiz": <VisualFlowChartQuiz />, 
  };

  const addModule = (moduleType) => {
    setModules([...modules, { id: Date.now(), type: moduleType }]);
    setShowDropdown(false);
  };

  const removeModule = (id) => {
    setModules(modules.filter((module) => module.id !== id));
  };

  const publishModule = () => {
    if (!title.trim() || modules.length === 0) {
      alert("Title and at least one module are required.");
      return;
    }
    alert("Module Published!");
    navigate("/admin/courses");
  };

  return (
    <div className="module-editor-container">
      <h1 className="module-title">Add Module</h1>
      
      <input
        type="text"
        placeholder="Module Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="module-input heading-input"
      />

      <div className="tags-container">
        {tags.map((tag, index) => (
          <span key={index} className="tag">
            {tag} <button onClick={() => setTags(tags.filter((t) => t !== tag))}>x</button>
          </span>
        ))}
        <div className="tag-button-wrapper">
          <button className="plus-button tag-button" onClick={() => {
            const newTag = prompt('Enter a new tag:');
            if (newTag) setTags([...tags, newTag]);
          }}>+
          </button>
          <span className="tag-label">Add module tags</span>
        </div>
      </div>

      <div className="modules-list">
        {modules.map((module) => (
          <div key={module.id} className="module-item">
            <h3>{module.type}</h3>
            {moduleOptions[module.type]}
            <button onClick={() => removeModule(module.id)}>Remove</button>
          </div>
        ))}
      </div>

      <div className="add-module">
        <div className="templates-button-wrapper">
          <button ref={dropdownRef} onClick={() => setShowDropdown(!showDropdown)} className="plus-button">+</button>
          <span className="templates-label">Add Templates</span>
        </div>
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
          <button className="preview-btn" onClick={() => setIsPreview(true)}>Preview</button>
          <button className="publish-btn" onClick={publishModule}>Publish</button>
          <button className="edit-btn">Edit</button>
        </div>
      )}

      {isPreview && (
        <div className="preview-container">
          <button className="exit-preview-btn" onClick={() => setIsPreview(false)}>Exit Preview</button>
        </div>
      )}
    </div>
  );
};

export default AddModule;
