// this component displays the dropdown menu for adding different types of module components
// it organizes module options into categories: Headings, Quiz(Basic Blocks), and Media

import React from 'react';

export const ModuleDropdown = ({ 
  showDropdown, 
  setShowDropdown, 
  dropdownRef, 
  moduleOptions, 
  media, 
  addModule, 
  styles 
}) => {
  return (
    <div className={styles["dropdown-wrapper"]}>
      <div className={styles["templates-button-wrapper"]}>
        <button 
          ref={dropdownRef} 
          onClick={() => setShowDropdown(!showDropdown)} 
          className={styles["plus-button"]}
        >
          +
        </button>
        <span className={styles["templates-label"]}>Add Template</span>
      </div>

      {showDropdown && (
        <div 
          className={styles["dropdown-menu"]} 
          style={{ 
            position: "absolute", 
            top: dropdownRef.current?.offsetTop + 40, 
            left: dropdownRef.current?.offsetLeft 
          }}
        >
          

          
          {/* Media section */}
          <h4 className={styles["dropdown-title"]}>Resources</h4>
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

                    
          {/* Basic blocks section */}
          <h4 className={styles["dropdown-title"]}>Assessment</h4>
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
        </div>
      )}
    </div>
  );
};

