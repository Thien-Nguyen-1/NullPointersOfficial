import React from "react";

/**
 * Component for rendering video content in the module
 * 
 * @param {Object} videoData - The video data to render
 * @param {Set} completedContentIds - Set of IDs of completed content items
 * @param {Function} onComplete - Callback function when content is completed
 */
const VideoContent = ({ videoData, completedContentIds, onComplete }) => {
  return (
    <div className="alt-component">
      <div className="alt-component-header">
        <h3>{videoData.title}</h3>
        {completedContentIds.has(videoData.id) && (
          <span className="completed-check">✓</span>
        )}
      </div>
      <div className="alt-component-content">
        <div className="alt-video-container">
          {videoData.source ? (
            <video controls className="alt-video">
              <source src={videoData.source} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          ) : (
            <div className="alt-video-placeholder">
              <img src={videoData.thumbnail} alt="Video thumbnail" />
              <div className="alt-video-play-button">▶</div>
            </div>
          )}
        </div>
        
        {videoData.duration && (
          <div className="alt-video-duration">
            <p>Duration: {videoData.duration}</p>
          </div>
        )}
        
        <div className="alt-mark-complete">
          {!completedContentIds.has(videoData.id) && (
            <button 
              className="mark-complete-button"
              onClick={() => onComplete(videoData.id, { viewed: true })}
            >
              Mark as Viewed
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoContent;