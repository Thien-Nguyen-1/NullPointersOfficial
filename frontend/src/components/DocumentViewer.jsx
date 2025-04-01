// A READ-ONLY component for service users to view and download documents

import React, { useState, useEffect } from "react";
import { FiDownload, FiFile, FiFileText, FiExternalLink } from "react-icons/fi";
import DocumentService from "../services/DocumentService";

import styles from "../styles/DocumentViewer.module.css";

const DocumentViewer = ({ moduleId }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (moduleId) {
      fetchDocuments();
    }
  }, [moduleId]);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const data = await DocumentService.getModuleDocuments(moduleId);
      setDocuments(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (document) => {
    window.open(document.file_url, '_blank');
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FiFileText className={styles.pdfIcon} />;
      case 'doc':
      case 'docx':
        return <FiFileText className={styles.wordIcon} />;
      case 'xls':
      case 'xlsx':
        return <FiFileText className={styles.excelIcon} />;
      case 'ppt':
      case 'pptx':
        return <FiFileText className={styles.pptIcon} />;
      default:
        return <FiFile />;
    }
  };

  if (loading) {
    return <div className={styles.loading}>Loading documents...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  if (documents.length === 0) {
    return <div className={styles.noDocuments}>No documents available for this module.</div>;
  }

  return (
    <div className={styles.documentViewer}>
      <h3 className={styles.heading}>Module Resources</h3>
      <div className={styles.documentList}>
        {documents.map((doc) => (
          <div key={doc.id} className={styles.documentCard}>
            <div className={styles.documentInfo}>
              {getFileIcon(doc.filename)}
              <div className={styles.documentDetails}>
                <h4 className={styles.documentName}>{doc.filename}</h4>
                <span className={styles.documentMeta}>
                  {doc.file_size_formatted} • {new Date(doc.upload_date).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className={styles.actions}>
              <button 
                className={styles.viewButton} 
                onClick={() => window.open(doc.file_url, '_blank')}
              >
                <FiExternalLink /> View
              </button>
              <button 
                className={styles.downloadButton} 
                onClick={() => handleDownload(doc)}
              >
                <FiDownload /> Download
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentViewer;