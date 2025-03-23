import React from "react";

/**
 * Component for rendering image content in the module
 * 
 * @param {Object} imageData - The image data to render
 * @param {Set} completedContentIds - Set of IDs of completed content items
 * @param {Function} onComplete - Callback function when content is completed
 */
const ImageContent = ({ imageData, completedContentIds, onComplete }) => {
  return (
    <div className="alt-component">
      <div className="alt-component-header">
        <h3>{imageData.title}</h3>
        {completedContentIds.has(imageData.id) && (
          <span className="completed-check">✓</span>
        )}
      </div>
      <div className="alt-component-content">
        <div className="alt-image-container">
          <img 
            src={imageData.source} 
            alt={imageData.title}
            className="alt-image"
          />
        </div>
        
        {imageData.caption && (
          <div className="alt-image-caption">
            <p>{imageData.caption}</p>
          </div>
        )}
        
        <div className="alt-mark-complete">
          {!completedContentIds.has(imageData.id) && (
            <button 
              className="mark-complete-button"
              onClick={() => onComplete(imageData.id, { viewed: true })}
            >
              Mark as Viewed
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImageContent;