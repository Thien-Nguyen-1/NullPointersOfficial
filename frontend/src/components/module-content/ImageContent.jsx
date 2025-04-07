import React from "react";

const ImageContent = ({ imageData, completedContentIds, onComplete }) => {
  console.log("ImageContent rendering with source:", imageData.source);
  console.log("Image dimensions:", imageData.width, "x", imageData.height);
  
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
            style={{
              width: imageData.width ? `${imageData.width}px` : 'auto',
              height: imageData.height ? `${imageData.height}px` : 'auto',
              maxWidth: '100%' // Ensure image doesn't overflow container
            }}
            onError={(e) => {
              console.error("Image failed to load:", imageData.source);
              e.target.onerror = null;
              e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23f0f0f0'/%3E%3Cpath d='M35,30 L65,70 M65,30 L35,70' stroke='%23999' stroke-width='2'/%3E%3C/svg%3E";
              e.target.style.opacity = "0.5";
            }}
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