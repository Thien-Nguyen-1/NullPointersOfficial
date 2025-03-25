// main component that handles uploading, displaying, and managing audio clips for MODULE BUILDER

import React, { useState, useEffect, useRef } from "react";
import { FiMusic, FiTrash2, FiDownload, FiCheckCircle, FiPlay, FiPause } from "react-icons/fi";
import AudioPlayer from "./AudioPlayer";
import AudioDragDropUploader from "./AudioDragDropUploader";
import AudioService from "../../services/AudioService";

import styles from "../../styles/AudioUploader.module.css";

const AudioEditorWrapper = React.forwardRef((props, ref) => {
    const { moduleId, quizType } = props;
    const audioUploaderRef = useRef(null);
    
    // Generate a unique ID for each component instance
    const componentId = useRef(`audio-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`);
    
    // pass the actual module ID to the AudioUploader (not the CONTENT ID bc module ID is a UUID -- int)
    const actualModuleId = props.moduleId && props.moduleId.startsWith('new-') ? null : props.moduleId;
  
    // this matches the API expected by AddModule.jsx
    React.useImperativeHandle(ref, () => ({
      getQuestions: () => {
        // return empty array to satisfy the interface
        return [];
      },

      getTempFiles: () => {
        // making sure its returning the file correctly
        console.log("getTempFiles called in wrapper");
        console.log("audioUploaderRef.current:", audioUploaderRef.current);
        const files = audioUploaderRef.current?.getTempFiles?.() || [];
        console.log("Files returned:", files);
        return files;
      }
    }));
    
    // for NEW modules, we'll store the audio clips in a temporary state
    // and upload them when the module is saved
    return (
      <div>
        <AudioUploader 
          ref={audioUploaderRef}
          moduleId={actualModuleId} 
          componentId={componentId.current}
          allowDirectUpload={true}
          temporaryMode={moduleId && moduleId.toString().startsWith("new-")}
        />
      </div>
    );
  });

const AudioUploader = React.forwardRef(({ moduleId, componentId, audioId, existingAudios = [], 
                            allowDirectUpload = false,
                            temporaryMode = false
                        }, ref) => {
  const [audios, setAudios] = useState(existingAudios);
  const [tempFiles, setTempFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(null);

  console.log("AudioUploader received moduleId:", moduleId);

  useEffect(() => {
    // Fetch existing audio clips for this module if moduleId is provided
    if (moduleId && !temporaryMode) {
    console.log("Triggering fetchAudios in useEffect");
      fetchAudios();
    }
  }, [moduleId, temporaryMode, componentId]);

  const fetchAudios = async () => {
    console.log(`Fetching audios for moduleId: ${moduleId}, componentId: ${componentId}`);
    
    try {
      const response = await AudioService.getModuleAudios(moduleId);
      console.log('Audio Response:', response);
      console.log('Number of audios returned:', response.length);

      // Log each audio item to check structure
        response.forEach((audio, index) => {
        console.log(`Audio ${index}:`, audio);
            console.log(`Audio ${index} contentID:`, audio.contentID);
            console.log(`Audio ${index} file_url:`, audio.file_url);
        });
        
      setAudios(response);

      console.log('Updated audios state with', response.length, 'items');
    } catch (err) {
      console.error("Error fetching audio clips:", err);
      console.error("Error details:", err.response?.data || err.message);
      setError("Failed to load audio clips. Please try again.");
    }
  };
  
  React.useImperativeHandle(ref, () => ({
    getTempFiles: () => {
      return tempFiles;
    }
  }));

  const handleUpload = async (formData) => {
    if (temporaryMode) {
        // in temporary mode, just store the files in state
        // they'll be uploaded when the module is saved
        const files = formData.getAll('files');
        const tempFileData = files.map(file => ({
          id: Date.now() + Math.random().toString(36).substring(2, 9),
          file: file,
          filename: file.name,
          file_size: file.size,
          file_type: file.name.split('.').pop().toLowerCase(),
          created_at: new Date().toISOString()
        }));

        setTempFiles([...tempFiles, ...tempFileData]);
        setSuccess(true);
        
        setTimeout(() => {
            setSuccess(false);
        }, 3000);
        
        return tempFileData;
    } else {
        setUploading(true);
        setError(null);
        setSuccess(false);

        try {
          // Always use the actual module ID, not an audio's contentID
          if (moduleId) {
            // Extract the real module ID if it's an object
            const actualModuleId = typeof moduleId === 'object' 
                ? moduleId.moduleID || moduleId.moduleId || moduleId.id 
                : moduleId;
            console.log("Original moduleId:", moduleId);
            console.log("Extracted actualModuleId:", actualModuleId);

            formData.append('module_id', actualModuleId);
            console.log(`Uploading files to module ID: ${actualModuleId}`);
          }

          // upload files
          const uploadedAudios = await AudioService.uploadAudios(formData);

          console.log("Successfully uploaded audios:", uploadedAudios);
          // Refresh the audio list to ensure we have the latest data
          await fetchAudios(); // this ensures we have the latest data from the server
          
          // update audios list with newly uploaded files
          setAudios([...audios, ...uploadedAudios]);
          setSuccess(true);
          
          // show success message for 3 seconds
          setTimeout(() => {
              setSuccess(false);
          }, 3000);

          return uploadedAudios;
        } catch (err) {
        console.error("Error uploading audio clips:", err);
        setError(`Upload failed: ${err.response?.data?.detail || err.message}`);
        throw err;
        } finally {
        setUploading(false);
        }
    }
  };

  const handleDelete = async (audioId) => {
    if (!window.confirm('Are you sure you want to delete this audio clip?')) {
      return;
    }

    try {
      await AudioService.deleteAudio(audioId);
      setAudios(audios.filter(audio => audio.contentID !== audioId));
      
      // stop player if we're deleting the current audio
      if (playingAudio && playingAudio.contentID === audioId) {
        setPlayingAudio(null);
      }
    } catch (err) {
      console.error("Error deleting audio clip:", err);
      setError(`Delete failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleDownload = async (audio) => {
    try {
      console.log("Complete audio object:", audio);
      
      // Use the backend server URL instead of the frontend URL
      const backendUrl = "http://localhost:8000"; // Adjust this to your Django port
      const fileUrl = audio.file_url || (audio.audio_file ? 
        (audio.audio_file.startsWith('http') ? audio.audio_file : `${backendUrl}${audio.audio_file}`) : 
        null);
      
      if (!fileUrl) {
        setError("Audio file URL not found");
        return;
      }
      
      console.log("Download URL:", fileUrl);
      
      const response = await fetch(fileUrl, {
        credentials: 'include' // This includes cookies for authentication
      });
      
      console.log("Fetch response status:", response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log("Blob created successfully:", blob.type, "size:", blob.size, "bytes");
      
      const objectUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = audio.filename || audio.title || "audio.mp3";
      downloadLink.click();
      
      URL.revokeObjectURL(objectUrl);
      
    } catch (error) {
      console.error("Download failed with error:", error.message);
      setError(`Failed to download the file: ${error.message}`);
    }
  };

  const handlePlayPause = (audio) => {
    if (playingAudio && playingAudio.contentID === audio.contentID) {
      // Already playing this audio, stop it
      setPlayingAudio(null);
    } else {
      // Play this audio
      setPlayingAudio(audio);
    }
  };

  const getFileIcon = () => {
    return <FiMusic className={styles.audioIcon} />;
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const formatDuration = (seconds) => {
    if (!seconds) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '';
    const KB = 1024;
    const MB = KB * 1024;
    
    if (bytes < KB) {
      return `${bytes} B`;
    } else if (bytes < MB) {
      return `${(bytes / KB).toFixed(1)} KB`;
    } else {
      return `${(bytes / MB).toFixed(1)} MB`;
    }
  };

  const displayedAudios = temporaryMode ? tempFiles : audios;

  return (
    <div className={styles.audioUploader}>
      <h3 className={styles.title}>Course Audio Clips</h3>
      
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {success && (
        <div className={styles.successMessage}>
          <FiCheckCircle /> Audio clips uploaded successfully!
        </div>
      )}
      
      <AudioDragDropUploader 
        onUpload={handleUpload} 
        acceptedFileTypes=".mp3,.wav,.ogg,.aac,.m4a"
      />
      
      {displayedAudios.length > 0 ? (
        <div className={styles.audiosList}>
          <h4 className={styles.sectionTitle}>Uploaded Audio Clips</h4>
          {displayedAudios.map((audio) => (
            <div key={audio.contentID || audio.id} className={styles.audioItem}>
              <div className={styles.audioInfo}>
                {getFileIcon()}
                <span className={styles.audioName} title={audio.title || audio.filename}>
                  {audio.title || audio.filename}
                </span>
                <span className={styles.audioMeta}>
                  {audio.file_size_formatted || formatFileSize(audio.file_size)} 
                  • {formatDate(audio.created_at || audio.upload_date)}
                  {audio.duration && ` • ${formatDuration(audio.duration)}`}
                </span>
              </div>
              <div className={styles.audioActions}>
                <button 
                  className={`${styles.playButton} ${playingAudio && playingAudio.contentID === audio.contentID ? styles.pauseButton : ''}`}
                  onClick={() => handlePlayPause(audio)}
                  title={playingAudio && playingAudio.contentID === audio.contentID ? "Pause" : "Play"}
                >
                  {playingAudio && playingAudio.contentID === audio.contentID ? <FiPause /> : <FiPlay />}
                </button>
                <button 
                  className={styles.downloadButton} 
                  onClick={() => handleDownload(audio)}
                  title="Download"
                >
                  <FiDownload />
                </button>
                <button 
                  className={styles.deleteButton} 
                  onClick={() => handleDelete(audio.contentID || audio.id)}
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.noAudios}>No audio clips uploaded yet.</p>
      )}
      
      {playingAudio && (
        <div className={styles.audioPlayerContainer}>
          <AudioPlayer 
            audioUrl={playingAudio.file_url || playingAudio.audio_file}
            audioName={playingAudio.title || playingAudio.filename}
            onClose={() => setPlayingAudio(null)}
          />
        </div>
      )}
    </div>
  );
});

export {AudioEditorWrapper};
export default AudioUploader;