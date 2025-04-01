// this component handles the display and management of tags for the module
// it allows adding new tags, removing tags, and shows existing tags
// 

import React from 'react';

export const TagsManager = ({ 
  tags, 
  availableTags, 
  addTag, 
  removeTag, 
  styles 
}) => {
  return (
    <div className={styles["tags-container"]}>
      {tags.map((tagId) => {
        const tagObj = availableTags.find(t => t.id === tagId);
        return tagObj ? (
          <span key={tagId} className={styles["tag"]}>
            {tagObj.tag} 
            <button 
              className={styles["remove-tag-btn"]} 
              onClick={() => removeTag(tagId)}
            >
              x
            </button>
          </span>
        ) : null;
      })}
      <div className={styles["tag-button-wrapper"]}>
        <button 
          className={styles["plus-button"]} 
          onClick={addTag}
        >
          +
        </button>
        <span className={styles["tag-label"]}>Add module tags</span>
      </div>
    </div>
  );
};