import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback  } from "react";
import { FiPlay, FiPause, FiCheck, FiLink, FiVideo } from "react-icons/fi";
import VideoService from "../../services/VideoService";

import styles from "../../styles/EmbeddedVideoEditor.module.css";

// Wrapper for AddModule
const EmbeddedVideoEditorWrapper = forwardRef((props, ref) => {
  const { moduleId, documentId } = props;
  const videoEditorRef = useRef(null);
  const [internalDocumentId, setInternalDocumentId] = useState(documentId);

  // Pass the actual module ID to the EmbeddedVideoEditor (not the CONTENT ID)
  const actualModuleId = moduleId && typeof moduleId === 'string' && moduleId.startsWith('new-') ? null : moduleId;

  console.log("[DEBUG] EmbeddedVideoEditorWrapper props:", { moduleId, documentId });
  console.log("[DEBUG] EmbeddedVideoEditorWrapper actualModuleId:", actualModuleId);

  // This matches the API expected by AddModule.jsx
  useImperativeHandle(ref, () => ({
    getTempFiles: () => {
      console.log("[DEBUG] getTempFiles called in EmbeddedVideoEditorWrapper");

      if (videoEditorRef.current && typeof videoEditorRef.current.getVideoData === 'function') {
        const videoData = videoEditorRef.current.getVideoData() || {};
        console.log("[DEBUG] Video data returned:", videoData);

        // Convert the video data to the expected format for the module builder
        if (videoData.video_url) {
          return [{
            file: new File(
              [JSON.stringify(videoData)],
              "video_data.json",
              { type: "application/json" }
            ),
            filename: "video_data.json",
            videoData: videoData // Keep the original data for reference
          }];
        }
        return [];
      } else {
        console.warn("[DEBUG] getVideoData function not found on videoEditorRef.current");
        return [];
      }
    }
  }));

  return (
    <div>
      <EmbeddedVideoEditor
        ref={videoEditorRef}
        moduleId={actualModuleId}
        documentId={internalDocumentId}
        temporaryMode={moduleId === null || (typeof moduleId === 'string' && moduleId.startsWith("new-")) || (typeof documentId === 'string' && documentId.startsWith("new-"))}
      />
    </div>
  );
});

const EmbeddedVideoEditor = forwardRef(({ moduleId, documentId, existingVideo = null, temporaryMode = false }, ref) => {
  const [videoUrl, setVideoUrl] = useState("");
  const [videoTitle, setVideoTitle] = useState("");
  const [videoDescription, setVideoDescription] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [videoData, setVideoData] = useState(existingVideo);
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewVisible, setIsPreviewVisible] = useState(false);

  console.log("[DEBUG] EmbeddedVideoEditor received moduleId:", moduleId);
  console.log("[DEBUG] EmbeddedVideoEditor received documentId:", documentId);
  console.log("[DEBUG] EmbeddedVideoEditor temporaryMode:", temporaryMode);
  console.log("[DEBUG] EmbeddedVideoEditor initial videoData:", existingVideo);

  // Fetch existing video data if available
  useEffect(() => {
    if (moduleId && documentId && !temporaryMode && !documentId.toString().startsWith('new-')) {
      console.log("[DEBUG] Fetching video data because moduleId and documentId exist and not in temporaryMode");
      fetchVideo();
    } else {
      console.log("[DEBUG] Not fetching video. Reason:",
        !moduleId ? "No moduleId" : !documentId ? "No documentId" :
        documentId.toString().startsWith('new-') ? "Document ID is temporary" : "In temporaryMode");
    }
  }, [moduleId, documentId, temporaryMode]);

  // Expose getVideoData method for parent component
  useImperativeHandle(ref, () => ({
    getVideoData: () => {
      console.log("[DEBUG] getVideoData called, returning:", {
        video_url: videoUrl,
        title: "Embedded Video",
        description: ""
      });
      return {
        video_url: videoUrl,
        title: "Embedded Video", // Default title
        description: "" // Empty description
      };
    }
  }));

  const fetchVideo = async () => {
    console.log("[DEBUG] fetchVideo called with moduleId:", moduleId, "documentId:", documentId);

    setIsLoading(true);
    try {
      // Don't try to fetch data for IDs that start with "new-"
      if (documentId.toString().startsWith('new-')) {
        console.log('[DEBUG] Skipping fetch for temporary ID:', documentId);
        return;
      }

      // Fetch video for this specific document ID
      try {
        const response = await VideoService.getEmbeddedVideo(documentId);
        console.log('[DEBUG] Video data for document:', response);

        if (response) {
          setVideoData(response);
          setVideoUrl(response.video_url || "");
          setVideoTitle(response.title || "");
          setVideoDescription(response.description || "");
          if (response.video_url) {
            setIsPreviewVisible(true);
          }
        }
      } catch (err) {
        // If we get a 404, the video might have been deleted
        if (err.response && err.response.status === 404) {
          console.log('[DEBUG] Video not found, treating as a new video');
          setVideoData(null);
          // We'll continue with an empty form
        } else {
          // For other errors, show the error message
          console.error("[ERROR] Error fetching video data:", err);
          setErrorMessage("Failed to load video data. Please try again.");
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isValidUrl = (url) => {
    // Basic URL validation - can be enhanced for specific platforms
    try {
      new URL(url);

      // Check for common video platforms
      const supportedDomains = [
        "youtube.com", "youtu.be", "vimeo.com",
        "dailymotion.com", "wistia.com", "loom.com"
      ];

      const urlObj = new URL(url);
      return supportedDomains.some(domain => urlObj.hostname.includes(domain));
    } catch (e) {
      return false;
    }
  };

  const isPreviewableUrl = (url) => {
    if (!url) return false;

    try {
      const urlObj = new URL(url);

      // Check specifically for YouTube and Vimeo which we can embed
      if (urlObj.hostname.includes('youtube.com') ||
          urlObj.hostname.includes('youtu.be') ||
          urlObj.hostname.includes('vimeo.com')) {

        // For YouTube, ensure it has a video ID
        if (urlObj.hostname.includes('youtube.com') && !urlObj.searchParams.get('v')) {
          return false;
        }

        return true;
      }

      return false;
    } catch (e) {
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!videoUrl) {
      setErrorMessage("Please enter a video URL");
      return;
    }

    if (!isValidUrl(videoUrl)) {
      setErrorMessage("Please enter a valid video URL from a supported platform (YouTube, Vimeo, etc.)");
      return;
    }

    // Show preview regardless of whether we're saving to server
    setIsPreviewVisible(true);

    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const videoDataToSubmit = {
        video_url: videoUrl,
        title: "Embedded Video", // Default title
        description: "", // Empty description
        moduleID: moduleId
      };

      console.log("[DEBUG] Submitting video data:", videoDataToSubmit);

      let response;

      if (temporaryMode) {
        // In temporary mode, just store the data locally
        console.log("[DEBUG] In temporary mode, storing data locally");
        setVideoData({
          ...videoDataToSubmit,
          contentID: documentId || `temp-${Date.now()}`
        });
        setSuccessMessage("Video successfully saved!");
      } else if (documentId && !documentId.toString().startsWith('new-') && videoData?.contentID) {
        // Only try to update if we have videoData and the contentID matches documentId
        // This ensures we don't try to update a video that's been deleted
        if (videoData.contentID === documentId) {
          console.log(`[DEBUG] Updating video with ID: ${documentId}`);
          try {
            response = await VideoService.updateEmbeddedVideo(documentId, videoDataToSubmit);
            setVideoData(response);
            setSuccessMessage("Video updated successfully!");
          } catch (updateError) {
            console.error("[ERROR] Error updating video, will try to create instead:", updateError);
            // If update fails with 404, the video might have been deleted
            // Fall back to creating a new video
            console.log(`[DEBUG] Creating new video for module: ${moduleId}`);
            response = await VideoService.createEmbeddedVideo(videoDataToSubmit);
            setVideoData(response);
            setSuccessMessage("Video added successfully!");
          }
        } else {
          // Create a new video if contentID doesn't match
          console.log(`[DEBUG] Creating new video for module: ${moduleId}`);
          response = await VideoService.createEmbeddedVideo(videoDataToSubmit);
          setVideoData(response);
          setSuccessMessage("Video added successfully!");
        }
      } else {
        // Create new video
        console.log(`[DEBUG] Creating new video for module: ${moduleId}`);
        response = await VideoService.createEmbeddedVideo(videoDataToSubmit);
        setVideoData(response);
        setSuccessMessage("Video added successfully!");
      }

      // Show preview after successful submission
      setIsPreviewVisible(true);

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);

    } catch (err) {
      console.error("[ERROR] Error saving video:", err);
      setErrorMessage(`Failed to save video: ${err.response?.data?.detail || err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Get embed URL for different platforms
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

      // For other platforms, return the original URL
      return url;
    } catch (e) {
      return url;
    }
  };

  return (
    <div className={styles.videoEditor}>
      <h3 className={styles.title}>Course Video</h3>

      {errorMessage && (
        <div className={styles.errorMessage}>
          <p>{errorMessage}</p>
          <button onClick={() => setErrorMessage("")}>×</button>
        </div>
      )}

      {successMessage && (
        <div className={styles.successMessage}>
          <FiCheck /> {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className={styles.videoForm}>
        <div className={styles.formGroup}>
          <label htmlFor="videoUrl">Video URL</label>
          <div className={styles.inputButtonGroup}>
            <div className={styles.urlInputWrapper}>
              <span className={styles.urlIcon}><FiLink size={16} /></span>
              <input
                type="url"
                id="videoUrl"
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
                placeholder="Enter YouTube, Vimeo or other video URL"
                className={styles.urlInput}
                required
              />
            </div>
            <button
              type="submit"
              className={styles.saveButton}
              disabled={isLoading}
            >
              {isLoading ? "Saving..." : videoData ? "Update" : "Save Video"}
            </button>
          </div>
        </div>
      </form>

      {isPreviewVisible && videoUrl && (
        <div className={styles.videoPreview}>
          <h4 className={styles.previewTitle}>Video Preview</h4>

          {isPreviewableUrl(videoUrl) ? (
            <div className={styles.embedContainer}>
              <iframe
                src={getEmbedUrl(videoUrl)}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Embedded Video"
                className={styles.embedFrame}
              ></iframe>
            </div>
          ) : (
            <div className={styles.noPreviewMessage}>
              <FiVideo /> No preview available for this link. Please ensure the entire URL has been pasted correctly.
            </div>
          )}
        </div>
      )}
    </div>
  );
});

export { EmbeddedVideoEditorWrapper };
export default EmbeddedVideoEditor;