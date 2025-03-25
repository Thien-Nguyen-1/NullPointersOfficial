// main component that allows admins/superadmin to upload and manage documents

import React, { useState, useEffect, useRef } from "react";
import { FiFile, FiTrash2, FiDownload, FiCheckCircle, FiEye } from "react-icons/fi";
import DragDropUploader from "./DragDropUploader";
import PDFViewer from "../PDFViewer";
import DocumentService from "../../services/DocumentService";

import styles from "../../styles/DocumentUploader.module.css";

// wrapper for AddModule
const DocumentEditorWrapper = React.forwardRef((props, ref) => {
    const { moduleId, quizType } = props;
    const documentUploaderRef = useRef(null);
    
    // pass the actual module ID to the DocumentUploader (not the CONTENT ID bc module ID is a UUID -- int)
    const actualModuleId = props.moduleId.startsWith('new-') ? null : props.moduleId;
  
    // this matches the API expected by AddModule.jsx
    React.useImperativeHandle(ref, () => ({
      getQuestions: () => {
        // return empty array to satisfy the interface
        return [];
      },

      getTempFiles: () => {
        // makeing sure its returning the file correctly
        console.log("getTempFiles called in wrapper");
        console.log("documentUploaderRef.current:", documentUploaderRef.current);
        const files = documentUploaderRef.current?.getTempFiles?.() || [];
        console.log("Files returned:", files);
        return files;
      }
    }));
    
    // for NEW modules, we'll store the documents in a temporary state
    // and upload them when the module is saved
    return (
      <div>
        <DocumentUploader 
        ref={documentUploaderRef}
          moduleId={actualModuleId} 
          allowDirectUpload={true}
          temporaryMode={moduleId && moduleId.toString().startsWith("new-")}
        />
      </div>
    );
  });


const DocumentUploader = React.forwardRef(({ moduleId, documentId, existingDocuments = [], 
                            allowDirectUpload = false,
                            temporaryMode = false
                        }, ref) => {
  const [documents, setDocuments] = useState(existingDocuments);
  const [tempFiles, setTempFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [viewingDocument, setViewingDocument] = useState(null);

  console.log("DocumentUploader received moduleId:", moduleId);
  console.log("typeof moduleId:", typeof moduleId);

  useEffect(() => {
    // Fetch existing documents for this module if moduleId is provided
    if (moduleId && !temporaryMode) {
      fetchDocuments();
    }
  }, [moduleId, temporaryMode]);

  const fetchDocuments = async () => {
    console.log("DocumentUploader received moduleId:", moduleId);
    console.log("DocumentUploader received documentId:", documentId);
    
    try {
      console.log('moduleId: ', moduleId)
      const response = await DocumentService.getModuleDocuments(moduleId);
      console.log('Response: ', response)
      setDocuments(response);
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to load documents. Please try again.");
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
          // Always use the actual module ID, not a document's contentID
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
          const uploadedDocuments = await DocumentService.uploadDocuments(formData);

          // update documents list with newly uploaded files
          setDocuments([...documents, ...uploadedDocuments]);
          setSuccess(true);
          
          // show success message for 3 seconds
          setTimeout(() => {
              setSuccess(false);
          }, 3000);

          return uploadedDocuments;
        } catch (err) {
        console.error("Error uploading documents:", err);
        setError(`Upload failed: ${err.response?.data?.detail || err.message}`);
        throw err;
        } finally {
        setUploading(false);
        }
    }
  };

  const handleDelete = async (documentId) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await DocumentService.deleteDocument(documentId);
      setDocuments(documents.filter(doc => doc.contentID !== documentId));
      
      // close viewer if we're deleting the current document
      if (viewingDocument && viewingDocument.contentID === documentId) {
        setViewingDocument(null);
      }
    } catch (err) {
      console.error("Error deleting document:", err);
      setError(`Delete failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleDownload = async (doc) => {
    // window.open(document.file_url, '_blank'); // this might cause erroras it might be intercepted with React Router
    // const link = window.document.createElement('a');
    // link.href = doc.file_url;  // Use 'doc' instead of 'document'
    
    // // Set download attribute to force download rather than navigation
    // link.setAttribute('download', doc.filename);  // Use 'doc' instead of 'document'
    
    // // For some browsers that require the element to be in the DOM
    // window.document.body.appendChild(link);
    
    // // Trigger click
    // link.click();
    
    // // Clean up
    // window.document.body.removeChild(link);
    try {
      console.log("Complete document object:", doc);
      
      // Use the backend server URL instead of the frontend URL
      const backendUrl = "http://localhost:8000"; // our Django port
      const fileUrl = doc.file_url.startsWith('http') 
        ? doc.file_url 
        : `${backendUrl}${doc.file_url}`;
      
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
      downloadLink.download = doc.filename || "document.pdf";
      downloadLink.click();
      
      URL.revokeObjectURL(objectUrl);
      
    } catch (error) {
      console.error("Download failed with error:", error.message);
      alert("Failed to download the file. Please try again.");
    }
  };

  const getFileIcon = (filename) => {
    const extension = filename.split('.').pop().toLowerCase();
    
    switch (extension) {
      case 'pdf':
        return <FiFile className={styles.pdfIcon} />;
      case 'doc':
      case 'docx':
        return <FiFile className={styles.wordIcon} />;
      case 'xls':
      case 'xlsx':
        return <FiFile className={styles.excelIcon} />;
      case 'ppt':
      case 'pptx':
        return <FiFile className={styles.pptIcon} />;
      default:
        return <FiFile />;
    }
  };

  const openDocumentViewer = (document) => {
    // only open PDF viewer for PDF files
    if (document.filename.toLowerCase().endsWith('.pdf')) {
      setViewingDocument(document);
    } else {
      // for non-PDF files, just download them
      handleDownload(document);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const displayedDocuments = temporaryMode ? tempFiles : documents;

  return (
    <div className={styles.documentUploader}>
      <h3 className={styles.title}>Course Documents</h3>
      
      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}
      
      {success && (
        <div className={styles.successMessage}>
          <FiCheckCircle /> Documents uploaded successfully!
        </div>
      )}
      
      <DragDropUploader onUpload={handleUpload} />
      
      {displayedDocuments.length > 0 ? (
        <div className={styles.documentsList}>
          <h4 className={styles.sectionTitle}>Uploaded Documents</h4>
          {displayedDocuments.map((doc) => (
            <div key={doc.contentID || doc.id} className={styles.documentItem}>
              <div className={styles.documentInfo}>
                {getFileIcon(doc.filename)}
                <span className={styles.documentName} title={doc.filename}>
                  {doc.title || doc.filename}
                </span>
                <span className={styles.documentMeta}>
                  {doc.file_size_formatted} • {formatDate(doc.upload_date || doc.created_at)}
                </span>
              </div>
              <div className={styles.documentActions}>
                {doc.filename.toLowerCase().endsWith('.pdf') && (
                  <button 
                    className={styles.viewButton} 
                    onClick={() => openDocumentViewer(doc)}
                    title="View PDF"
                  >
                    <FiEye />
                  </button>
                )}
                <button 
                  className={styles.downloadButton} 
                  onClick={() => handleDownload(doc)}
                  title="Download"
                >
                  <FiDownload />
                </button>
                <button 
                  className={styles.deleteButton} 
                  onClick={() => handleDelete(doc.contentID)}
                  title="Delete"
                >
                  <FiTrash2 />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.noDocuments}>No documents uploaded yet.</p>
      )}
      
      {viewingDocument && (
        <div className={styles.pdfViewerModal}>
          <div className={styles.pdfViewerContainer}>
            <button 
              className={styles.closeModalButton}
              onClick={() => setViewingDocument(null)}
            >
              ×
            </button>
            <PDFViewer 
              documentUrl={viewingDocument.file_url} 
              documentName={viewingDocument.title || viewingDocument.filename} 
            />
          </div>
        </div>
      )}
    </div>
  );
});

export { DocumentEditorWrapper };
export default DocumentUploader;