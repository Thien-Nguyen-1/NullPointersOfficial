// a reusable drag-and-drop file upload component for audio files

import React, { useState, useRef } from 'react';
import { FiUpload, FiMusic, FiCheckCircle, FiX, FiAlertCircle } from 'react-icons/fi';
import styles from '../../styles/DragDropUploader.module.css';

const AudioDragDropUploader = ({ onUpload, acceptedFileTypes = '.mp3,.wav,.ogg,.aac,.m4a', temporaryMode = false }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const fileInputRef = useRef(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) {
      setIsDragging(true);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
  };

  const processFiles = (newFiles) => {
    // filter for accepted file types
    const validFiles = newFiles.filter(file => {
      const fileType = file.name.split('.').pop().toLowerCase();
      return acceptedFileTypes.includes(`.${fileType}`);
    });

    // add valid files to the list
    setFiles(prevFiles => [...prevFiles, ...validFiles]);

    // initialize progress for each file
    const newProgress = {};
    const newStatus = {};
    validFiles.forEach(file => {
      newProgress[file.name] = 0;
      newStatus[file.name] = 'pending';
    });

    setUploadProgress(prev => ({ ...prev, ...newProgress }));
    setUploadStatus(prev => ({ ...prev, ...newStatus }));
  };

  const removeFile = (fileName) => {
    setFiles(prevFiles => prevFiles.filter(file => file.name !== fileName));
    
    // remove progress and status for this file
    setUploadProgress(prev => {
      const newProgress = { ...prev };
      delete newProgress[fileName];
      return newProgress;
    });
    
    setUploadStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[fileName];
      return newStatus;
    });
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
  
    // create FormData with all files
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
  
    try {
      // set all files to 'uploading' status
      const initialStatus = {};
      files.forEach(file => {
        initialStatus[file.name] = 'uploading';
      });
      setUploadStatus(prev => ({ ...prev, ...initialStatus }));
  
      // simulate upload progress
      const simulateProgress = () => {
        setUploadProgress(prev => {
          const newProgress = { ...prev };
          files.forEach(file => {
            if (newProgress[file.name] < 90) {
              newProgress[file.name] = Math.min(newProgress[file.name] + 10, 90);
            }
          });
          return newProgress;
        });
      };
  
      // simulate progress at intervals
      const progressInterval = setInterval(simulateProgress, 300);
  
      // call the actual upload function passed via props
      const result = await onUpload(formData);
  
      // clear the interval
      clearInterval(progressInterval);
  
      // set all files to complete with 100% progress
      const completeProgress = {};
      const completeStatus = {};
      files.forEach(file => {
        completeProgress[file.name] = 100;
        completeStatus[file.name] = 'complete';
      });
      
      setUploadProgress(prev => ({ ...prev, ...completeProgress }));
      setUploadStatus(prev => ({ ...prev, ...completeStatus }));
  
      // clear the files after a short delay
      setTimeout(() => {
        setFiles([]);
        setUploadProgress({});
        setUploadStatus({});
      }, 2000);
  
      return result;
    } catch (error) {
      // Set status to error
      const errorStatus = {};
      files.forEach(file => {
        errorStatus[file.name] = 'error';
      });
      setUploadStatus(prev => ({ ...prev, ...errorStatus }));
      
      console.error('Upload failed:', error);
      throw error;
    }
  };

  const getFileIcon = () => {
    return <FiMusic className={styles.audioIcon} />;
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'complete':
        return <FiCheckCircle className={styles.completeIcon} />;
      case 'error':
        return <FiAlertCircle className={styles.errorIcon} />;
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <div 
        className={`${styles.dropzone} ${isDragging ? styles.active : ''}`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className={styles.fileInput}
          multiple
          accept={acceptedFileTypes}
          onChange={handleFileSelect}
        />
        <FiUpload className={styles.uploadIcon} />
        <p className={styles.dropText}>
          {isDragging ? 'Drop audio files here' : 'Drag and drop audio files here or click to browse'}
        </p>
        <p className={styles.supportedText}>
          Supported formats: MP3, WAV, OGG, AAC, M4A
        </p>
      </div>
      
      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map(file => (
            <div key={file.name} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                {getFileIcon()}
                <span className={styles.fileName}>{file.name}</span>
                <span className={styles.fileSize}>{(file.size / 1024).toFixed(0)} KB</span>
              </div>
              
              <div className={styles.fileActions}>
                {uploadStatus[file.name] !== 'complete' && (
                  <button 
                    className={styles.removeButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(file.name);
                    }}
                  >
                    <FiX />
                  </button>
                )}
                {getStatusIcon(uploadStatus[file.name])}
              </div>
              
              {uploadProgress[file.name] > 0 && (
                <div className={styles.progressContainer}>
                  <div 
                    className={`${styles.progressBar} ${uploadStatus[file.name] === 'error' ? styles.errorBar : ''}`}
                    style={{ width: `${uploadProgress[file.name]}%` }}
                  ></div>
                </div>
              )}
            </div>
          ))}
          
          <button 
            className={styles.uploadButton}
            onClick={handleUpload}
            disabled={files.length === 0 || Object.values(uploadStatus).every(status => status === 'complete')}
          >
            <FiUpload /> Upload {files.length} {files.length === 1 ? 'file' : 'files'}
          </button>
        </div>
      )}
    </div>
  );
};

export default AudioDragDropUploader;