import React from "react";
import { FiVideo } from "react-icons/fi";

const VideoContent = ({ 
  videoData, 
  completedContentIds, 
  onComplete, 
  isPreviewMode = false 
}) => {
  // Supported domains from the editor
  const supportedDomains = [
    "youtube.com", "youtu.be", 
    "vimeo.com", "dailymotion.com", 
    "wistia.com", "loom.com"
  ];

  // Embed URL for platform-specific videos
  const getEmbedUrl = (url) => {
    try {
      const urlObj = new URL(url);

      // YouTube
      if (urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be')) {
        let videoId;
        if (urlObj.hostname.includes('youtube.com')) {
          videoId = urlObj.searchParams.get('v');
        } else {
          videoId = urlObj.pathname.substring(1);
        }
        return `https://www.youtube.com/embed/${videoId}`;
      }

      // Vimeo
      if (urlObj.hostname.includes('vimeo.com')) {
        const videoId = urlObj.pathname.substring(1);
        return `https://player.vimeo.com/video/${videoId}`;
      }

      // Dailymotion
      if (urlObj.hostname.includes('dailymotion.com')) {
        const videoId = urlObj.pathname.split('/').pop();
        return `https://www.dailymotion.com/embed/video/${videoId}`;
      }

      // Wistia
      if (urlObj.hostname.includes('wistia.com')) {
        const videoId = urlObj.pathname.split('/').pop().split('.')[0];
        return `https://fast.wistia.net/embed/iframe/${videoId}`;
      }

      // Loom
      if (urlObj.hostname.includes('loom.com')) {
        const videoId = urlObj.pathname.split('/').pop();
        return `https://www.loom.com/embed/${videoId}`;
      }

      // For other platforms, return the original URL
      return url;
    } catch (e) {
      return url;
    }
  };

  // Check if video URL is embeddable
  const isEmbeddableUrl = (url) => {
    try {
      const urlObj = new URL(url);
      return supportedDomains.some(domain => urlObj.hostname.includes(domain));
    } catch (e) {
      return false;
    }
  };

  // If in preview mode and no video URL, return null
  if (isPreviewMode && !videoData.video_url) {
    return null;
  }

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
          {/* Embedded video preview for platform videos */}
          {videoData.video_url && isEmbeddableUrl(videoData.video_url) ? (
            <div className="embedded-video-preview">
              <iframe
                src={getEmbedUrl(videoData.video_url)}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Embedded Video"
                className="w-full aspect-video"
              ></iframe>
              {isPreviewMode && (
                <div className="preview-overlay">
                  <p className="preview-message">
                    Video playback available in published version
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="no-preview-message">
              <FiVideo className="text-4xl text-gray-400" />
              <p className="text-gray-600 mt-2">
                {isPreviewMode 
                  ? "Video interaction available in published version" 
                  : "Video preview is not available for this link."
                }
              </p>
            </div>
          )}
        </div>
        
        <div className="alt-mark-complete">
          {!completedContentIds.has(videoData.id) && !isPreviewMode && (
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