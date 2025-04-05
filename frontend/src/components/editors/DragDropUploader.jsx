// a reusable drag-and-drop file upload component

import React, { useState, useRef } from 'react';
import { FiUpload, FiFile, FiCheckCircle, FiX, FiAlertCircle } from 'react-icons/fi';
import styles from '../../styles/DragDropUploader.module.css';

const DragDropUploader = ({ onUpload, acceptedFileTypes = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx',
  mediaType = 'document' // default value
 }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const [uploadStatus, setUploadStatus] = useState({});
  const fileInputRef = useRef(null);

  //get help text based on media type
  const getSupportedFormatsText = () => {
    switch(mediaType) {
      // Future media here
      case 'audio':
        return 'Supported formats: MP3, WAV, OGG, M4A';
      case 'document':
      default:
        return 'Supported formats: PDF, Word, Excel, PowerPoint';
      case 'image':
        return 'Supported formats: JPG, JPEG, PNG, GIF, WEBP';
    }
  };

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
    // take only the first file if multiple files wwere selected somehow
    const fileToProcess = newFiles.length > 0 ? [newFiles[0]]: [];

    // filter for accepted files type
    const validFiles = fileToProcess.filter(file => {
      const fileType = file.name.split('.').pop().toLowerCase();
      return acceptedFileTypes.includes(`.${fileType}`);
    });

    // replace existing files instead of adding to them
    setFiles(validFiles);

    // initialize progress for the file
    const newProgress = {};
    const newStatus = {};
    validFiles.forEach(file => {
      newProgress[file.name] = 0;
      newStatus[file.name] = 'pending'
    });

    setUploadProgress(newProgress);
    setUploadStatus(newStatus);
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
    console.log("[DEBUG] DragDropUploader handleUpload called");  
    if (files.length === 0) return;

    // Create FormData with all files
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      // Set all files to 'uploading' status
      const initialStatus = {};
      files.forEach(file => {
        initialStatus[file.name] = 'uploading';
      });
      setUploadStatus(prev => ({ ...prev, ...initialStatus }));

      // Simulate upload progress
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

      // Simulate progress at intervals
      const progressInterval = setInterval(simulateProgress, 300);

      // Call the actual upload function passed via props
      const result = await onUpload(formData);

      // Clear the interval
      clearInterval(progressInterval);

      // Set all files to complete with 100% progress
      const completeProgress = {};
      const completeStatus = {};
      files.forEach(file => {
        completeProgress[file.name] = 100;
        completeStatus[file.name] = 'complete';
      });
      
      setUploadProgress(prev => ({ ...prev, ...completeProgress }));
      setUploadStatus(prev => ({ ...prev, ...completeStatus }));

      // Clear the files list after successful upload
      // Don't clear the files immediately to allow the user to see the completion status
      setTimeout(() => {
        setFiles([]);  
        setUploadProgress({});
        setUploadStatus({});
      }, 2000);

      console.log("[DEBUG] DragDropUploader upload completed");

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

  const getFileIcon = (fileName) => {
    const extension = fileName.split('.').pop().toLowerCase();
    let className = '';
    
    switch (extension) {
      case 'pdf':
        className = styles.pdfIcon;
        break;
      case 'doc':
      case 'docx':
        className = styles.wordIcon;
        break;
      case 'xls':
      case 'xlsx':
        className = styles.excelIcon;
        break;
      case 'ppt':
      case 'pptx':
        className = styles.pptIcon;
        break;
      default:
        className = '';
    }
    
    return <FiFile className={className} />;
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
          // multiple -->> this cause multiple files to be uploaded
          accept={acceptedFileTypes}
          onChange={handleFileSelect}
        />
        <FiUpload className={styles.uploadIcon} />
        <p className={styles.dropText}>
          {isDragging ? 'Drop ONE file here' : 'Drag and drop files here or click to browse'}
        </p>
        <p className={styles.supportedText}>
          {getSupportedFormatsText()}
        </p>
      </div>
      
      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map(file => (
            <div key={file.name} className={styles.fileItem}>
              <div className={styles.fileInfo}>
                {getFileIcon(file.name)}
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

export default DragDropUploader;