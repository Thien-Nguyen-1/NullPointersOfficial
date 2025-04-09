import React, { useState, useEffect } from 'react';
import { FiMaximize, FiMinimize, FiDownload } from 'react-icons/fi';
import styles from '../styles/PDFViewer.module.css';

const PDFViewer = ({ documentUrl, documentName }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [objectUrl, setObjectUrl] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    
    fetchPdf();
    
    return () => {
      if (objectUrl && !documentUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [documentUrl]);

  const fetchPdf = async () => {
    try {
      console.log('[PDFViewer] Full documentUrl:', documentUrl);
      
      if (!documentUrl) {
        console.error("No document URL provided");
        setError("No document URL provided");
        setLoading(false);
        return;
      }
      
      // Blob URL handling
      if (documentUrl.startsWith('blob:')) {
        console.log('[PDFViewer] Using blob URL directly');
        setObjectUrl(documentUrl);
        setLoading(false);
        return;
      }
      
      // Server URL handling
      const backendUrl = "http://localhost:8000";
      const fetchUrl = documentUrl.startsWith('http') 
        ? documentUrl 
        : `${backendUrl}${documentUrl}`;
      
      console.log('[PDFViewer] Fetching from URL:', fetchUrl);
      
      const response = await fetch(fetchUrl, {
        credentials: 'include',
        headers: {
          'Accept': 'application/pdf'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      console.log('[PDFViewer] Blob size:', blob.size);
      console.log('[PDFViewer] Blob type:', blob.type);
      
      const url = URL.createObjectURL(blob);
      setObjectUrl(url);
      setLoading(false);
    } catch (err) {
      console.error("[PDFViewer] Error loading PDF:", err);
      setError(`Failed to load PDF: ${err.message}`);
      setLoading(false);
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleDownload = async () => {
    try {
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
      
      <div 
        className={styles.viewerContainer} 
        style={{ display: loading || error ? 'none' : 'block' }}
      >
        {objectUrl && (
          <object
            data={objectUrl}
            type="application/pdf"
            width="100%"
            height="100%"
            className={styles.pdfObject}
          >
            <p>Your browser doesn't support PDF viewing. 
              <a href={objectUrl} target="_blank" rel="noopener noreferrer">
                Click here to download the PDF
              </a>
            </p>
          </object>
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