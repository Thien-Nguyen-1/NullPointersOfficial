// to allow viewing PDF documents directly in the browser
// An inline PDF document viewer with:

// Fullscreen mode
// Download option
// Loading indicators

import React, { useState, useEffect } from 'react';
import { FiMaximize, FiMinimize, FiDownload } from 'react-icons/fi';
import styles from '../styles/PDFViewer.module.css';

const PDFViewer = ({ documentUrl, documentName }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    // Reset states when document URL changes
    setLoading(true);
    setError(null);
    
    // Fetch the PDF as a blob to display it
    const fetchPdf = async () => {
      try {
        // Use the backend server URL instead of the frontend URL
        const backendUrl = "http://localhost:8000"; // remember to use our Django port
        const fileUrl = documentUrl.startsWith('http') 
          ? documentUrl 
          : `${backendUrl}${documentUrl}`;
        
        console.log("Fetching PDF from:", fileUrl);
        
        const response = await fetch(fileUrl, {
          credentials: 'include' // Include cookies for authentication
        });
        
        console.log("PDF fetch response status:", response.status);
        
        if (!response.ok) {
          throw new Error(`Failed to load PDF: ${response.status}`);
        }
        
        const blob = await response.blob();
        console.log("PDF blob created:", blob.type, "size:", blob.size, "bytes");
        
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);
        setLoading(false);
      } catch (err) {
        console.error("Error loading PDF:", err);
        setError("Failed to load PDF document.");
        setLoading(false);
      }
    };
    
    fetchPdf();
    
    // Cleanup function to revoke the object URL when component unmounts
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [documentUrl]);

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = async () => {
    try {
      // Use the same approach as in DocumentUploader
      const backendUrl = "http://localhost:8000";
      const fileUrl = documentUrl.startsWith('http') 
        ? documentUrl 
        : `${backendUrl}${documentUrl}`;
      
      const response = await fetch(fileUrl, {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = documentName || 'document.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      setError('Failed to download the document.');
    }
  };

  return (
    <div className={`${styles.container} ${isFullscreen ? styles.fullscreen : ''}`}>
      <div className={styles.toolbar}>
        <div className={styles.documentInfo}>
          <span className={styles.documentName}>{documentName || 'Document'}</span>
        </div>
        
        <div className={styles.toolbarActions}>
          <button className={styles.toolbarButton} onClick={handleDownload} title="Download">
            <FiDownload />
          </button>
          <button className={styles.toolbarButton} onClick={toggleFullscreen} title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}>
            {isFullscreen ? <FiMinimize /> : <FiMaximize />}
          </button>
        </div>
      </div>
      
      {loading && (
        <div className={styles.loadingContainer}>
          <div className={styles.loadingSpinner}></div>
          <p>Loading PDF document...</p>
        </div>
      )}
      
      {error && (
        <div className={styles.errorContainer}>
          <p>{error}</p>
          <p className={styles.errorHelp}>Try downloading the document instead.</p>
        </div>
      )}
      
      <div className={styles.viewerContainer} style={{ display: loading ? 'none' : 'block' }}>
        {objectUrl && (
          <iframe
            src={objectUrl}
            className={styles.pdfFrame}
            title={documentName || 'PDF Document Viewer'}
          ></iframe>
        )}
      </div>
      
      {isFullscreen && (
        <button className={styles.closeButton} onClick={toggleFullscreen}>
          Exit Fullscreen
        </button>
      )}
    </div>
  );
};

export default PDFViewer;