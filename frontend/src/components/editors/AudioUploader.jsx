// main component that allows admins/superadmin to upload and manage audio files

import React, { useState, useEffect, useRef } from "react";
import { FiMusic, FiTrash2, FiPlay, FiCheckCircle } from "react-icons/fi";
import DragDropUploader from "./DragDropUploader";
import AudioPlayer from "./AudioPlayer";
import AudioService from "../../services/AudioService";

import styles from "../../styles/AudioUploader.module.css";

// wrapper for AddModule
const AudioEditorWrapper = React.forwardRef((props, ref) => {
    const { moduleId, quizType, documentId } = props;
    const audioUploaderRef = useRef(null);
    
    // pass the actual module ID to the AudioUploader (not the CONTENT ID)
    const actualModuleId = moduleId && typeof moduleId === 'string' && moduleId.startsWith('new-') ? null : moduleId;

    console.log("[DEBUG] AudioEditorWrapper props:", { moduleId, quizType, documentId });
    console.log("[DEBUG] AudioEditorWrapper actualModuleId:", actualModuleId);

    // this matches the API expected by AddModule.jsx
    React.useImperativeHandle(ref, () => ({
      getQuestions: () => {
        // return empty array to satisfy the interface
        return [];
      },

      getTempFiles: () => {
        // Making sure it's returning the file correctly
        console.log("[DEBUG] getTempFiles called in AudioEditorWrapper");
        console.log("[DEBUG] audioUploaderRef.current:", audioUploaderRef.current);
        
        if (audioUploaderRef.current && typeof audioUploaderRef.current.getTempFiles === 'function') {
          const files = audioUploaderRef.current.getTempFiles() || [];
          console.log("[DEBUG] Files returned from getTempFiles:", files);
          return files;
        } else {
          console.warn("[DEBUG] getTempFiles function not found on audioUploaderRef.current");
          return [];
        }
      }
    }));
    
    return (
      <div>
        <AudioUploader 
          ref={audioUploaderRef}
          moduleId={actualModuleId} 
          documentId={documentId}
          allowDirectUpload={true}
          temporaryMode={moduleId === null || (typeof moduleId === 'string' && moduleId.startsWith("new-"))}
        />
      </div>
    );
  });


const AudioUploader = React.forwardRef(({ moduleId, documentId, existingAudios = [], 
                            allowDirectUpload = false,
                            temporaryMode = false
                        }, ref) => {
  const [audios, setAudios] = useState(existingAudios);
  const [tempFiles, setTempFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [currentlyPlaying, setCurrentlyPlaying] = useState(null);

  console.log("[DEBUG] AudioUploader received moduleId:", moduleId);
  console.log("[DEBUG] AudioUploader received documentId:", documentId);
  console.log("[DEBUG] AudioUploader temporaryMode:", temporaryMode);
  console.log("[DEBUG] AudioUploader initial audios:", existingAudios);

  useEffect(() => {
    // Fetch existing audio files for this module if moduleId is provided
    if (moduleId && !temporaryMode) {
      console.log("[DEBUG] Fetching audio files because moduleId exists and not in temporaryMode");
      fetchAudios();
    } else {
      console.log("[DEBUG] Not fetching audios. Reason:", !moduleId ? "No moduleId" : "In temporaryMode");
    }
  }, [moduleId, documentId, temporaryMode]);

  // DEBUG for useState for tempFiles
  useEffect(() => {
    console.log("[DEBUG] tempFiles state updated:", tempFiles);
  }, [tempFiles]);

  // DEBUG for audios state updates
  useEffect(() => {
    console.log("[DEBUG] audios state updated:", audios);
  }, [audios]);

  const fetchAudios = async () => {
    console.log("[DEBUG] fetchAudios called with moduleId:", moduleId, "documentId:", documentId);
    
    try {
      // Fetch all audio files for this module
      const response = await AudioService.getModuleAudios(moduleId);
      console.log('[DEBUG] All audio files for module:', response);
      
      if (documentId && !documentId.toString().startsWith('new-')) {
        // For existing documents, only show the audio that matches this ID
        const filteredAudios = response.filter(audio => audio.contentID === documentId);
        console.log(`[DEBUG] Filtered audio files for ID ${documentId}:`, filteredAudios);
        setAudios(filteredAudios);
      } else {
        // For new components or if no documentId is provided, show empty
        console.log('[DEBUG] No specific documentId or new component, setting empty audios');
        setAudios([]);
      }
    } catch (err) {
      console.error("[ERROR] Error fetching audio files:", err);
      setError("Failed to load audio files. Please try again.");
    }
  };

  // React.useImperativeHandle(ref, () => ({
  //   getTempFiles: () => {
  //     console.log("[DEBUG] getTempFiles called, returning:", tempFiles);
  //     return tempFiles;
  //   }
  // }));
  React.useImperativeHandle(ref, () => ({
    getTempFiles: () => {
      console.log("[DEBUG] getTempFiles called, returning:", tempFiles);
      
      // If we're in edit mode and already have displayed audios, include them
      if (moduleId && audios.length > 0) {
        // Create objects that mimic the structure of temp files
        const existingFiles = audios.map(audio => ({
          id: audio.contentID,
          file: {
            name: audio.filename,
            size: audio.file_size || 0,
            // Create a placeholder for preview purposes
            type: 'audio/mpeg'
          },
          originalAudio: audio // Keep reference to original audio
        }));
        
        console.log('[DEBUG] Including existing audio files in getTempFiles:', existingFiles);
        
        // Return both temporary and existing files
        return [...tempFiles, ...existingFiles];
      }
      
      return tempFiles;
    }
  }));

  const handleUpload = async (formData) => {
    console.log("[DEBUG] handleUpload called with temporaryMode:", temporaryMode, "moduleId:", moduleId);
    console.log("[DEBUG] Current audios before upload:", audios);
    
    if (temporaryMode || !moduleId) {
        // In temporary mode, just store the files in state
        console.log("[DEBUG] In temporary mode, storing files locally");
        const files = formData.getAll('files');
        console.log("[DEBUG] Files from formData:", files);
        
        const tempFileData = files.map(file => ({
          id: Date.now() + Math.random().toString(36).substring(2, 9),
          file: file,
          filename: file.name,
          file_size: file.size,
          file_type: file.name.split('.').pop().toLowerCase(),
          created_at: new Date().toISOString(),
          file_size_formatted: formatFileSize(file.size), 
          title: file.name
        }));

        // Use functional state update to ensure we're working with the latest state
        setTempFiles(tempFileData);
        console.log("[DEBUG] Setting new tempFiles:", tempFileData);
        
        setSuccess(true);
        setTimeout(() => {
            setSuccess(false);
        }, 3000);
        
        console.log("[DEBUG] Temporary files stored:", tempFileData);
        return tempFileData;
    } else {
        setUploading(true);
        setError(null);
        setSuccess(false);

        try {
          // Always use the actual module ID, not a document's contentID
          if (moduleId) {
            // Extract the real module ID if it's an object
            const actualModuleId = typeof moduleId === 'object' 
                ? moduleId.moduleID || moduleId.moduleId || moduleId.id 
                : moduleId;
            console.log("[DEBUG] Original moduleId:", moduleId);
            console.log("[DEBUG] Extracted actualModuleId:", actualModuleId);

            formData.append('module_id', actualModuleId);
            
            // add componentId if available
            if (documentId) {
              formData.append('component_id', documentId);
              console.log(`[DEBUG] Uploading files to module ID: ${actualModuleId}, component ID ${documentId}`);
              
              // Delete old audio files associated with this component ID before uploading new ones
              console.log(`[DEBUG] Attempting to delete audio files for component ID: ${documentId}`);

              try {
                // First, get all audio files for this module
                const allModuleAudios = await AudioService.getModuleAudios(moduleId);
                
                // Find audio files that belong to this specific component
                const audiosToDelete = allModuleAudios.filter(audio => audio.contentID === documentId);
                console.log(`[DEBUG] Found ${audiosToDelete.length} audio files to delete for component ID ${documentId}`);
                
                // Delete each audio file
                for (const audioToDelete of audiosToDelete) {
                  try {
                    console.log(`[DEBUG] Deleting audio with ID: ${audioToDelete.contentID}`);
                    await AudioService.deleteAudio(audioToDelete.contentID);
                    console.log(`[DEBUG] Successfully deleted audio with ID: ${audioToDelete.contentID}`);
                  } catch (deleteError) {
                    console.error(`[DEBUG] Failed to delete audio ${audioToDelete.contentID}:`, deleteError);
                    // We'll continue even if delete fails
                  }
                }
                
                // Verify audio files were deleted
                const remainingAudios = await AudioService.getModuleAudios(moduleId);
                const stillExisting = remainingAudios.filter(audio => audio.contentID === documentId);
                console.log(`[DEBUG] After deletion: ${stillExisting.length} audio files still exist for component ID ${documentId}`);
                
                if (stillExisting.length > 0) {
                  console.warn(`[WARNING] Not all audio files were deleted for component ID ${documentId}`);
                }
              } catch (error) {
                console.error(`[DEBUG] Error while trying to delete existing audio files:`, error);
              }

              // verify audio files were deleted
              try {
                const checkAudios = await AudioService.getModuleAudios(moduleId);
                const remainingAudios = checkAudios.filter(audio => audio.contentID === documentId);
                console.log(`[DEBUG] Audio files remaining after deletion attempt:`, remainingAudios);
              } catch (err) {
                console.error(`[DEBUG] Error checking audio files after deletion`, err)
              }
            } else {
              console.log(`[DEBUG] Uploading files to module ID: ${actualModuleId} without component ID`);
            }
            
            // Log the form data being sent
            console.log("[DEBUG] FormData entries:");
            for (let [key, value] of formData.entries()) {
              console.log(`${key}: ${value instanceof File ? value.name : value}`);
            }
          }

          // Upload files
          const uploadedAudios = await AudioService.uploadAudios(formData);
          console.log("[DEBUG] Uploaded audio files response:", uploadedAudios);

          // CRITICAL SECTION: 
          // if this is a single audio component, replace rather than append
          if (documentId) {
            console.log("[DEBUG] Setting audios with replacement for documentId:", documentId);
            console.log("[DEBUG] New audios:", uploadedAudios);
            console.log("[DEBUG] Old audios:", audios);
            
            // Replace the audio but PRESERVE the original component ID
            const updatedAudios = uploadedAudios.map(audio => ({
              ...audio,
              contentID: documentId  // Force the new audio to use the original component ID
            }));
            
            console.log("[DEBUG] Updated audios with preserved component ID:", updatedAudios);
            setAudios(updatedAudios);
          } else {
            // Regular handling for non-replacement uploads
            console.log("[DEBUG] Appending new audios to existing ones");
            setAudios(prevAudios => {
              const newAudios = [...prevAudios, ...uploadedAudios];
              console.log("[DEBUG] Combined audios:", newAudios);
              return newAudios;
            });
          }
          setSuccess(true);
          
          // Show success message for 3 seconds
          setTimeout(() => {
              setSuccess(false);
          }, 3000);

          return uploadedAudios;
        } catch (err) {
          console.error("[ERROR] Error uploading audio files:", err);
          setError(`Upload failed: ${err.response?.data?.detail || err.message}`);
          throw err;
        } finally {
          setUploading(false);
        }
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleDelete = async (audioId) => {
    console.log("[DEBUG] handleDelete called for audioId:", audioId);
    
    if (!window.confirm('Are you sure you want to delete this audio file?')) {
      console.log("[DEBUG] Delete cancelled by user");
      return;
    }

    try {
      console.log("[DEBUG] Deleting audio with ID:", audioId);
      await AudioService.deleteAudio(audioId);
      
      console.log("[DEBUG] Audio deleted successfully, updating state");
      console.log("[DEBUG] Current audios:", audios);
      
      const updatedAudios = audios.filter(audio => audio.contentID !== audioId);
      console.log("[DEBUG] Updated audios after filter:", updatedAudios);
      
      setAudios(updatedAudios);
      
      // stop playback if we're deleting the currently playing audio
      if (currentlyPlaying && currentlyPlaying === audioId) {
        console.log("[DEBUG] Stopping playback for deleted audio");
        setCurrentlyPlaying(null);
      }
    } catch (err) {
      console.error("[ERROR] Error deleting audio:", err);
      setError(`Delete failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  // handle deleting temporary files
  const handleDeleteTemp = (id) => {
    console.log("[DEBUG] handleDeleteTemp called for id:", id);
    
    if (!window.confirm('Are you sure you want to delete this audio file?')) {
      return;
    }
    
    console.log("[DEBUG] Deleting temp file with ID:", id);
    console.log("[DEBUG] Current tempFiles:", tempFiles);
    
    const updatedTempFiles = tempFiles.filter(file => file.id !== id);
    console.log("[DEBUG] Updated tempFiles after filter:", updatedTempFiles);
    
    setTempFiles(updatedTempFiles);
    
    // Stop playback if we're deleting the currently playing audio
    if (currentlyPlaying && currentlyPlaying === id) {
      console.log("[DEBUG] Stopping playback for deleted temp audio");
      setCurrentlyPlaying(null);
    }
  };

  const handlePlayAudio = (audio) => {
    const audioId = audio.contentID || audio.id;
    
    // If we're toggling the same audio, turn it off
    if (currentlyPlaying === audioId) {
      setCurrentlyPlaying(null);
      return;
    }
    
    // Otherwise, set this as the currently playing audio
    setCurrentlyPlaying(audioId);
  };

  const getAudioUrl = (audio) => {
    // For temporary files
    if (audio.file && !audio.file_url) {
      return URL.createObjectURL(audio.file);
    }
    
    // For server-stored files
    const backendUrl = "http://localhost:8000"; // Django port
    return audio.file_url && typeof audio.file_url === 'string' && audio.file_url.startsWith('http') 
      ? audio.file_url 
      : `${backendUrl}${audio.file_url}`;
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'm4a':
        return <FiMusic className={styles.audioIcon} />;
      default:
        return <FiMusic />;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isTemporaryMode = temporaryMode || !moduleId || (typeof moduleId === 'string' && moduleId.startsWith("new-"));
  const displayedAudios = isTemporaryMode ? tempFiles : audios;
  console.log("[DEBUG] isTemporaryMode:", isTemporaryMode);
  console.log("[DEBUG] displayedAudios:", displayedAudios);

  const handleClosePlayer = () => {
    setCurrentlyPlaying(null);
  };

  return (
    <div className={styles.audioUploader}>
      <h3 className={styles.title}>Course Audio</h3>
      
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {success && (
        <div className={styles.successMessage}>
          <FiCheckCircle /> Audio uploaded successfully!
        </div>
      )}
      
      <DragDropUploader onUpload={handleUpload} acceptedFileTypes=".mp3,.wav,.ogg,.m4a" mediaType="audio" />      
      {displayedAudios.length > 0 ? (
        <div className={styles.audiosList}>
          <h4 className={styles.sectionTitle}>Uploaded Audio</h4>
          {displayedAudios.map((audio) => (
            <div key={audio.contentID || audio.id} className={`${styles.audioItem} ${currentlyPlaying === (audio.contentID || audio.id) ? styles.playing : ''}`}>
              <div className={styles.audioInfo}>
                {getFileIcon(audio.filename)}
                <span className={styles.audioName} title={audio.filename}>
                  {audio.title || audio.filename}
                </span>
                <span className={styles.audioMeta}>
                  {audio.file_size_formatted || formatFileSize(audio.file_size)} • {formatDate(audio.upload_date || audio.created_at)}
                </span>
              </div>
              <div className={styles.audioActions}>
                <button 
                  className={`${styles.playButton} customPlayButton`} 
                  onClick={() => handlePlayAudio(audio)}
                  title="Play"
                >
                  <FiPlay />
                </button>
                <button 
                  className={`${styles.deleteButton} customDeleteButton`} 
                  onClick={() => isTemporaryMode ? handleDeleteTemp(audio.id) : handleDelete(audio.contentID)}
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.noAudios}>No audio files uploaded yet.</p>
      )}
      
      {/* Show the AudioPlayer when an audio is selected */}
      {currentlyPlaying && displayedAudios.length > 0 && (
        <div className={styles.audioPlayerContainer}>
          {displayedAudios.map(audio => {
            const audioId = audio.contentID || audio.id;
            if (audioId === currentlyPlaying) {
              return (
                <AudioPlayer 
                  key={audioId}
                  audioUrl={getAudioUrl(audio)}
                  audioName={audio.title || audio.filename}
                  onClose={handleClosePlayer}
                />
              );
            }
            return null;
          })}
        </div>
      )}
    </div>
  );
});

export { AudioEditorWrapper };
export default AudioUploader;