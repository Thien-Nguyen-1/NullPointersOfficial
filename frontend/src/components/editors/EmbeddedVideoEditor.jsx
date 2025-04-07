import React, { useState, useEffect, forwardRef, useImperativeHandle, useRef, useCallback  } from "react";
import { FiPlay, FiPause, FiCheck, FiLink, FiVideo, FiTrash2 } from "react-icons/fi";import VideoService from "../../services/VideoService";
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
      console.log("[DEBUG] videoEditorRef exists:", Boolean(videoEditorRef.current));
      console.log("[DEBUG] getVideoData function exists:", videoEditorRef.current && typeof videoEditorRef.current.getVideoData === 'function');

      if (videoEditorRef.current && typeof videoEditorRef.current.getVideoData === 'function') {
        const videoData = videoEditorRef.current.getVideoData() || {};
        console.log("[DEBUG] Video data returned from getVideoData:", videoData);

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
    },

    getVideoData: () => {
      if (videoEditorRef.current && typeof videoEditorRef.current.getVideoData === 'function') {
        return videoEditorRef.current.getVideoData();
      }
      return null;
    },

    setVideoData: (data) => {
      if (videoEditorRef.current && typeof videoEditorRef.current.setVideoData === 'function') {
        videoEditorRef.current.setVideoData(data);
      }
    }
  }));

  return (
    <div>
      <EmbeddedVideoEditor
        ref={videoEditorRef}
        moduleId={actualModuleId}
        documentId={internalDocumentId}
        temporaryMode={
          moduleId === null || 
          (typeof moduleId === 'string' && moduleId.startsWith("new-")) ||
          (typeof documentId === 'string' && documentId.startsWith("new-"))
         
        }      />
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
  const [tempVideoData, setTempVideoData] = useState(null);
  const [tempFiles, setTempFiles] = useState([]);
  const isTemporaryMode = temporaryMode || !moduleId || (typeof moduleId === 'string' && moduleId.startsWith("new-"));
  const displayedVideos = isTemporaryMode ? tempFiles : [videoData].filter(Boolean);


  console.log("[DEBUG] EmbeddedVideoEditor received moduleId:", moduleId);
  console.log("[DEBUG] EmbeddedVideoEditor received documentId:", documentId);
  console.log("[DEBUG] EmbeddedVideoEditor temporaryMode:", temporaryMode);
  console.log("[DEBUG] EmbeddedVideoEditor initial videoData:", existingVideo);

  // Fetch existing video data if available
  useEffect(() => {
    if (moduleId && documentId && !temporaryMode && !documentId.toString().startsWith('new-')) {
      console.log("[DEBUG] Fetching video data because moduleId and documentId exist and not in temporaryMode");
      fetchVideo();
    } else if (temporaryMode && videoUrl) {
      // for temporary mode set the data directly
      setVideoData({
        video_url: videoUrl,
        title: "Temporary Video",
        description: ""
      });
      setIsPreviewVisible(true);
      // console.log("[DEBUG] Not fetching video. Reason:",
      //   !moduleId ? "No moduleId" : !documentId ? "No documentId" :
      //   documentId.toString().startsWith('new-') ? "Document ID is temporary" : "In temporaryMode");
    }
  }, [moduleId, documentId, temporaryMode, videoUrl]);


  useImperativeHandle(ref, () => ({
    // Converts video data to a file-like object for module builder
    getTempFiles: () => {
      if (videoUrl) {
        return [{
          file: new File(
            [JSON.stringify({ 
              video_url: videoUrl, 
              title: videoTitle || "Embedded Video",
              description: videoDescription || ""
            })],
            "video_data.json",
            { type: "application/json" }
          ),
          filename: "video_data.json",
          videoData: { 
            video_url: videoUrl, 
            title: videoTitle || "Embedded Video",
            description: videoDescription || ""
          }
        }];
      }
      return [];
    },
  
    // Provides raw video data for external components
    getVideoData: () => {
      console.log("[DEBUG] getVideoData called with values:", {
        videoUrl,
        videoTitle,
        videoDescription
      });
      return {
        video_url: videoUrl,
        title: videoTitle || "Embedded Video",
        description: videoDescription || ""
      };
    },

    setVideoData: (data) => {
      if (data && data.video_url) {
        setVideoUrl(data.video_url);
        setVideoTitle(data.title || "");
        setVideoDescription(data.description || "");
        setIsPreviewVisible(true);
      }
    },
  
    // Allows external components to set video data
    setTempFiles: (files) => {
      if (files.length > 0) {
        const videoData = JSON.parse(files[0].file);
        setVideoUrl(videoData.video_url);
        setVideoTitle(videoData.title || "Embedded Video");
        setVideoDescription(videoData.description || "");
        setIsPreviewVisible(true);
      }
    }
  }));

  const handleDeleteTemp = (id) => {
    console.log("[DEBUG] handleDeleteTemp called for id:", id);
    
    if (!window.confirm('Are you sure you want to delete this video?')) {
      return;
    }
    
    console.log("[DEBUG] Deleting temp file with ID:", id);
    console.log("[DEBUG] Current tempFiles:", tempFiles);
    
    const updatedTempFiles = tempFiles.filter(file => file.id !== id);
    console.log("[DEBUG] Updated tempFiles after filter:", updatedTempFiles);
    
    setTempFiles(updatedTempFiles);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

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

  // const isValidUrl = (url) => {
  //   // Basic URL validation - can be enhanced for specific platforms
  //   try {
  //     new URL(url);

  //     // Check for common video platforms
  //     const supportedDomains = [
  //       "youtube.com", "youtu.be", "vimeo.com",
  //       "dailymotion.com", "wistia.com", "loom.com"
  //     ];

  //     const urlObj = new URL(url);
  //     return supportedDomains.some(domain => urlObj.hostname.includes(domain));
  //   } catch (e) {
  //     return false;
  //   }
  // };

  const isValidUrl = (url) => {
    try {
      if (!url) return false;
      const parsedUrl = new URL(url);
      
      const supportedDomains = [
        "youtube.com", "youtu.be", 
        "vimeo.com", "dailymotion.com", 
        "wistia.com", "loom.com"
      ];
  
      return supportedDomains.some(domain => 
        parsedUrl.hostname.includes(domain)
      );
    } catch (e) {
      console.error("[DEBUG] URL validation error:", e);
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
  
    // Comprehensive logging
    console.group("[DEBUG] Video Submission");
    console.log("Video URL:", videoUrl);
    console.log("Video Title:", videoTitle);
    console.log("Video Description:", videoDescription);
    console.log("Module ID:", moduleId);
    console.log("Document ID:", documentId);
    console.log("Temporary Mode:", temporaryMode);
    console.groupEnd();

    // Validate URL
    if (!videoUrl) {
      setErrorMessage("Please enter a video URL");
      return;
    }
  
    if (!isValidUrl(videoUrl)) {
      setErrorMessage("Please enter a valid video URL from a supported platform (YouTube, Vimeo, etc.)");
      return;
    }
  
    // Reset UI states
    setIsPreviewVisible(true);
    setIsLoading(true);
    setErrorMessage("");
    setSuccessMessage("");
  
    try {
      const videoDataToSubmit = {
        video_url: videoUrl,
        title: videoTitle || "Embedded Video",
        description: videoDescription || "",
        moduleID: moduleId
      };
  
      if (temporaryMode) {
        // Store as a temp file similar to other uploaders
        const tempFileData = [{
          id: Date.now() + Math.random().toString(36).substring(2, 9),
          file: new File(
            [JSON.stringify({ video_url: videoUrl })], 
            "video_data.json", 
            { type: "application/json" }
          ),
          filename: "video_data.json",
          video_url: videoUrl,
          title: videoTitle || "Embedded Video",
          created_at: new Date().toISOString()
        }];

        setTempFiles(tempFileData);
        setSuccessMessage("Video successfully saved")
      } else {
        // Backend submission logic
        let response;
        if (documentId && !documentId.toString().startsWith('new-') && videoData?.contentID) {
          // Update existing video
          response = await VideoService.updateEmbeddedVideo(documentId, videoDataToSubmit);
        } else {
          // Create new video
          response = await VideoService.createEmbeddedVideo(videoDataToSubmit);
        }
        
        setVideoData(response);
        setSuccessMessage("Video saved successfully!");
      }
  
      // Auto-clear success message
      setTimeout(() => setSuccessMessage(""), 3000);
  
    } catch (err) {
      // Detailed error logging
      console.error("[CRITICAL] Video Submission Error:", {
        message: err.message,
        response: err.response,
        stack: err.stack
      });
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

  const handleDelete = async (videoId) => {
    console.log("[DEBUG] handleDelete called for videoId:", videoId);
    
    if (!window.confirm('Are you sure you want to delete this video?')) {
      console.log("[DEBUG] Delete cancelled by user");
      return;
    }
  
    try {
      console.log("[DEBUG] Deleting video with ID:", videoId);
      await VideoService.deleteEmbeddedVideo(videoId);
      
      console.log("[DEBUG] Video deleted successfully, updating state");
      console.log("[DEBUG] Current videoData:", videoData);
      
      // Reset video data
      setVideoData(null);
      setVideoUrl("");
      setVideoTitle("");
      setVideoDescription("");
      
    } catch (err) {
      console.error("[ERROR] Error deleting video:", err);
      setErrorMessage(`Delete failed: ${err.response?.data?.detail || err.message}`);
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

      {/* {isPreviewVisible && videoUrl && (
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
      )} */}
      {(videoUrl || (videoData && videoData.video_url)) && (
        <div className={styles.videoPreview}>
          <h4 className={styles.previewTitle}>Video Preview</h4>
          {isPreviewableUrl(videoUrl || videoData.video_url) ? (
            <div className={styles.embedContainer}>
              <iframe
                src={getEmbedUrl(videoUrl || videoData.video_url)}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Embedded Video"
                className={styles.embedFrame}
              ></iframe>
            </div>
          ) : (
            <div className={styles.noPreviewMessage}>
              <FiVideo /> No preview available for this link.
            </div>
          )}
        </div>
      )}

{displayedVideos.length > 0 && (
      <div className={styles.videosList}>
        <h4 className={styles.sectionTitle}>Uploaded Videos</h4>
        {displayedVideos.map((video) => (
          <div 
            key={video.contentID || video.id} 
            className={styles.videoItem}
          >
            <div className={styles.videoInfo}>
              <FiVideo className={styles.videoIcon} />
              <span className={styles.videoName}>
                {video.title || video.filename}
              </span>
              <span className={styles.videoMeta}>
                {video.video_url} • {video.created_at && formatDate(video.created_at)}
              </span>
            </div>
            <div className={styles.videoActions}>
              <button 
                className={styles.deleteButton} 
                onClick={() => isTemporaryMode 
                  ? handleDeleteTemp(video.id) 
                  : handleDelete(video.contentID)}
              >
                <FiTrash2 />
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
    </div>
  );
});

export { EmbeddedVideoEditorWrapper };
export default EmbeddedVideoEditor;