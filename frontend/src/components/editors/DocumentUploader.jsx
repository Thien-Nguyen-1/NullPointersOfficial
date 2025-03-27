// main component that allows admins/superadmin to upload and manage documents

import React, { useState, useEffect, useRef } from "react";
import { FiFile, FiTrash2, FiDownload, FiCheckCircle, FiEye } from "react-icons/fi";
import DragDropUploader from "./DragDropUploader";
import PDFViewer from "../PDFViewer";
import DocumentService from "../../services/DocumentService";

import styles from "../../styles/DocumentUploader.module.css";

// wrapper for AddModule
const DocumentEditorWrapper = React.forwardRef((props, ref) => {
    const { moduleId, quizType, documentId } = props;
    const documentUploaderRef = useRef(null);
    
    // pass the actual module ID to the DocumentUploader (not the CONTENT ID bc module ID is a UUID -- int)
    const actualModuleId = moduleId && typeof moduleId === 'string' && moduleId.startsWith('new-') ? null : moduleId;

    console.log("[DEBUG] DocumentEditorWrapper props:", { moduleId, quizType, documentId });
    console.log("[DEBUG] DocumentEditorWrapper actualModuleId:", actualModuleId);

    // this matches the API expected by AddModule.jsx
    React.useImperativeHandle(ref, () => ({
      getQuestions: () => {
        // return empty array to satisfy the interface
        return [];
      },

      getTempFiles: () => {
        // Making sure it's returning the file correctly
        console.log("[DEBUG] getTempFiles called in DocumentEditorWrapper");
        console.log("[DEBUG] documentUploaderRef.current:", documentUploaderRef.current);
        
        if (documentUploaderRef.current && typeof documentUploaderRef.current.getTempFiles === 'function') {
          const files = documentUploaderRef.current.getTempFiles() || [];
          console.log("[DEBUG] Files returned from getTempFiles:", files);
          return files;
        } else {
          console.warn("[DEBUG] getTempFiles function not found on documentUploaderRef.current");
          return [];
        }
      }
    }));
    
    return (
      <div>
        <DocumentUploader 
          ref={documentUploaderRef}
          moduleId={actualModuleId} 
          documentId={documentId}
          allowDirectUpload={true}
          temporaryMode={moduleId === null || (typeof moduleId === 'string' && moduleId.startsWith("new-"))}
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

  console.log("[DEBUG] DocumentUploader received moduleId:", moduleId);
  console.log("[DEBUG] DocumentUploader received documentId:", documentId);
  console.log("[DEBUG] DocumentUploader temporaryMode:", temporaryMode);
  console.log("[DEBUG] DocumentUploader initial documents:", existingDocuments);

  useEffect(() => {
    // Fetch existing documents for this module if moduleId is provided
    if (moduleId && !temporaryMode) {
      console.log("[DEBUG] Fetching documents because moduleId exists and not in temporaryMode");
      fetchDocuments();
    } else {
      console.log("[DEBUG] Not fetching documents. Reason:", !moduleId ? "No moduleId" : "In temporaryMode");
    }
  }, [moduleId, documentId, temporaryMode]);

  // DEBUG for useState for tempFiles
  useEffect(() => {
    console.log("[DEBUG] tempFiles state updated:", tempFiles);
  }, [tempFiles]);

  // DEBUG for documents state updates
  useEffect(() => {
    console.log("[DEBUG] documents state updated:", documents);
  }, [documents]);

  const fetchDocuments = async () => {
    console.log("[DEBUG] fetchDocuments called with moduleId:", moduleId, "documentId:", documentId);
    
    try {
      // Fetch all documents for this module
      const response = await DocumentService.getModuleDocuments(moduleId);
      console.log('[DEBUG] All documents for module:', response);
      
      if (documentId && !documentId.toString().startsWith('new-')) {
        // For existing documents, only show the document that matches this ID
        const filteredDocs = response.filter(doc => doc.contentID === documentId);
        console.log(`[DEBUG] Filtered documents for ID ${documentId}:`, filteredDocs);
        setDocuments(filteredDocs);
      } else {
        // For new components or if no documentId is provided, show empty
        console.log('[DEBUG] No specific documentId or new component, setting empty documents');
        setDocuments([]);
      }
    } catch (err) {
      console.error("[ERROR] Error fetching documents:", err);
      setError("Failed to load documents. Please try again.");
    }
  };

  React.useImperativeHandle(ref, () => ({
    getTempFiles: () => {
      console.log("[DEBUG] getTempFiles called, returning:", tempFiles);
      return tempFiles;
    }
  }));

  const handleUpload = async (formData) => {
    console.log("[DEBUG] handleUpload called with temporaryMode:", temporaryMode, "moduleId:", moduleId);
    console.log("[DEBUG] Current documents before upload:", documents);
    
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
        // setTempFiles(prevFiles => [...prevFiles, ...tempFileData]);
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
              
              // Delete old documents associated with this component ID before uploading new ones
              console.log(`[DEBUG] Attempting to delete documents for component ID: ${documentId}`);

              try {
                // First, get all documents for this module
                const allModuleDocs = await DocumentService.getModuleDocuments(moduleId);
                
                // Find documents that belong to this specific component
                const docsToDelete = allModuleDocs.filter(doc => doc.contentID === documentId);
                console.log(`[DEBUG] Found ${docsToDelete.length} documents to delete for component ID ${documentId}`);
                
                // Delete each document
                for (const docToDelete of docsToDelete) {
                  try {
                    console.log(`[DEBUG] Deleting document with ID: ${docToDelete.contentID}`);
                    await DocumentService.deleteDocument(docToDelete.contentID);
                    console.log(`[DEBUG] Successfully deleted document with ID: ${docToDelete.contentID}`);
                  } catch (deleteError) {
                    console.error(`[DEBUG] Failed to delete document ${docToDelete.contentID}:`, deleteError);
                    // We'll continue even if delete fails
                  }
                }
                
                // Verify documents were deleted
                const remainingDocs = await DocumentService.getModuleDocuments(moduleId);
                const stillExisting = remainingDocs.filter(doc => doc.contentID === documentId);
                console.log(`[DEBUG] After deletion: ${stillExisting.length} documents still exist for component ID ${documentId}`);
                
                if (stillExisting.length > 0) {
                  console.warn(`[WARNING] Not all documents were deleted for component ID ${documentId}`);
                }
              } catch (error) {
                console.error(`[DEBUG] Error while trying to delete existing documents:`, error);
              }

              // verify documents were deleted
              try {
                const checkDocs = await DocumentService.getModuleDocuments(moduleId);
                const remainingDocs = checkDocs.filter(doc => doc.contentID === documentId);
                console.log(`[DEBUG] Documents remaining after deletion attempt:`, remainingDocs);
              } catch (err) {
                console.error(`[DEBUG] Error checking documents after deletion`, err)
              }
              // Log the current document associated with this documentId
              // const currentDoc = documents.find(doc => doc.contentID === documentId);
              // console.log("[DEBUG] Current document with this ID before upload:", currentDoc);
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
          const uploadedDocuments = await DocumentService.uploadDocuments(formData);
          console.log("[DEBUG] Uploaded documents response:", uploadedDocuments);

          // CRITICAL SECTION: This is where the bug might be happening
          // if this is a single document component, replace rather than append
          if (documentId) {
            console.log("[DEBUG] Setting documents with replacement for documentId:", documentId);
            console.log("[DEBUG] New documents:", uploadedDocuments);
            console.log("[DEBUG] Old documents:", documents);
            
            // Set the documents state with ONLY the newly uploaded documents
            setDocuments(uploadedDocuments);
          } else {
            // else update documents list with newly uploaded files
            console.log("[DEBUG] Appending new documents to existing ones");
            setDocuments(prevDocs => {
              const newDocs = [...prevDocs, ...uploadedDocuments];
              console.log("[DEBUG] Combined documents:", newDocs);
              return newDocs;
            });
          }
          
          setSuccess(true);
          
          // Show success message for 3 seconds
          setTimeout(() => {
              setSuccess(false);
          }, 3000);

          return uploadedDocuments;
        } catch (err) {
          console.error("[ERROR] Error uploading documents:", err);
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

  const handleDelete = async (documentId) => {
    console.log("[DEBUG] handleDelete called for documentId:", documentId);
    
    if (!window.confirm('Are you sure you want to delete this document?')) {
      console.log("[DEBUG] Delete cancelled by user");
      return;
    }

    try {
      console.log("[DEBUG] Deleting document with ID:", documentId);
      await DocumentService.deleteDocument(documentId);
      
      console.log("[DEBUG] Document deleted successfully, updating state");
      console.log("[DEBUG] Current documents:", documents);
      
      const updatedDocuments = documents.filter(doc => doc.contentID !== documentId);
      console.log("[DEBUG] Updated documents after filter:", updatedDocuments);
      
      setDocuments(updatedDocuments);
      
      // close viewer if we're deleting the current document
      if (viewingDocument && viewingDocument.contentID === documentId) {
        console.log("[DEBUG] Closing viewer for deleted document");
        setViewingDocument(null);
      }
    } catch (err) {
      console.error("[ERROR] Error deleting document:", err);
      setError(`Delete failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  // handle deleting temporary files
  const handleDeleteTemp = (id) => {
    console.log("[DEBUG] handleDeleteTemp called for id:", id);
    
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }
    
    console.log("[DEBUG] Deleting temp file with ID:", id);
    console.log("[DEBUG] Current tempFiles:", tempFiles);
    
    const updatedTempFiles = tempFiles.filter(file => file.id !== id);
    console.log("[DEBUG] Updated tempFiles after filter:", updatedTempFiles);
    
    setTempFiles(updatedTempFiles);
  };

  const handleDownload = async (doc) => {
    console.log("[DEBUG] handleDownload called for document:", doc);
    
    try {
      // Handle TEMPORARY files (not yet uploaded to server)
      if (doc.file && !doc.file_url) {
        console.log("[DEBUG] Downloading temporary file");
        // For temporary files, we can create a download directly from the File object
        const objectUrl = URL.createObjectURL(doc.file);
        const downloadLink = document.createElement("a");
        downloadLink.href = objectUrl;
        downloadLink.download = doc.filename || "document.pdf";
        downloadLink.click();
        
        // Clean up the temporary URL
        URL.revokeObjectURL(objectUrl);
        return;
      }

      // Handle SERVER-STORED files
      console.log("[DEBUG] Downloading server-stored file");
      // Use the backend server URL instead of the frontend URL
      const backendUrl = "http://localhost:8000"; // our Django port
      const fileUrl = doc.file_url && typeof doc.file_url === 'string' && doc.file_url.startsWith('http') 
        ? doc.file_url 
        : `${backendUrl}${doc.file_url}`;
      
      console.log("[DEBUG] Download URL:", fileUrl);
      
      const response = await fetch(fileUrl, {
        credentials: 'include' // this includes cookies for authentication
      });
      
      console.log("[DEBUG] Fetch response status:", response.status, response.statusText);
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status}`);
      }
      
      const blob = await response.blob();
      console.log("[DEBUG] Blob created successfully:", blob.type, "size:", blob.size, "bytes");
      
      const objectUrl = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = objectUrl;
      downloadLink.download = doc.filename || "document.pdf";
      downloadLink.click();
      
      URL.revokeObjectURL(objectUrl);
      
    } catch (error) {
      console.error("[ERROR] Download failed with error:", error.message);
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
    console.log("[DEBUG] openDocumentViewer called for document:", document);
    
    // if this a temporary file (hans't been uploaded to server yet)
    if (document.file && !document.file_url) {
      console.log("[DEBUG] Opening temporary file in viewer");
      // create a temporary URL for the file object
      const tempUrl = URL.createObjectURL(document.file);
      setViewingDocument({
        ...document,
        file_url: tempUrl,
        isTemporaryUrl: true // Flag to know we need to revoke this URL later
      });
    } else {
      // for server-stored file just use the file_url
      // only open PDF viewer for PDF files
      if (document.filename && document.filename.toLowerCase().endsWith('.pdf')) {
        console.log("[DEBUG] Opening PDF in viewer");
        setViewingDocument(document);
      } else {
        // for non-PDF files, just download them
        console.log("[DEBUG] Non-PDF file, downloading instead of viewing");
        handleDownload(document);
      }
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  const isTemporaryMode = temporaryMode || !moduleId || (typeof moduleId === 'string' && moduleId.startsWith("new-"));
  const displayedDocuments = isTemporaryMode ? tempFiles : documents;
  console.log("[DEBUG] isTemporaryMode:", isTemporaryMode);
  console.log("[DEBUG] displayedDocuments:", displayedDocuments);

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
                  {doc.file_size_formatted || formatFileSize(doc.file_size)} • {formatDate(doc.upload_date || doc.created_at)}
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
                  onClick={() => isTemporaryMode ? handleDeleteTemp(doc.id) : handleDelete(doc.contentID)}
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
              onClick={() => {
                // Clean up temporary URLs when closing the viewer
                if (viewingDocument.isTemporaryUrl && viewingDocument.file_url) {
                  URL.revokeObjectURL(viewingDocument.file_url);
                }
                setViewingDocument(null)}}
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