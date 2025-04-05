import React, { useState } from "react";
import { FiFile, FiDownload, FiEye } from "react-icons/fi";
import PDFViewer from "../PDFViewer";

/**
 * Component for rendering infosheet content in the module
 * 
 * @param {Object} infosheetData - The infosheet data to render
 * @param {Set} completedContentIds - Set of IDs of completed content items
 * @param {Function} onComplete - Callback function when content is completed
 */
const InfosheetContent = ({infosheetData, completedContentIds, onComplete}) => {
    const [viewingDocument, setViewingDocument] = useState(null);

    // Use documents directly from infosheetData
    const documents = infosheetData.documents || [];
    
    const handleDownload = async (doc) => {
        try {
            // Use the backend server URL
            const backendUrl = "http://localhost:8000";
            const fileUrl = doc.file_url.startsWith('http') 
                ? doc.file_url 
                : `${backendUrl}${doc.file_url}`;
            
            const response = await fetch(fileUrl, {
                credentials: 'include' // Include cookies for authentication
            });
            
            if (!response.ok) {
                throw new Error(`Failed to download: ${response.status}`);
            }
            
            const blob = await response.blob();
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = doc.filename || "document.pdf";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download failed:', error);
            alert("Failed to download the file. Please try again.");
        }
    };
    
    const openDocumentViewer = (doc) => {
        // Only open PDF viewer for PDF files
        if (doc.filename.toLowerCase().endsWith('.pdf')) {
            setViewingDocument(doc);
        } else {
            // For non-PDF files, just download them
            handleDownload(doc);
        }
    };
    
    const getFileIcon = (filename) => {
        if (!filename) return <FiFile />;
        
        const extension = filename.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'pdf':
                return <FiFile className="pdf-icon" />;
            case 'doc':
            case 'docx':
                return <FiFile className="word-icon" />;
            case 'xls':
            case 'xlsx':
                return <FiFile className="excel-icon" />;
            case 'ppt':
            case 'pptx':
                return <FiFile className="ppt-icon" />;
            default:
                return <FiFile />;
        }
    };
    
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="alt-component">
            <div className="alt-component-header">
                <h3>{infosheetData.title}</h3>
                {completedContentIds.has(infosheetData.id) && (
                <span className="completed-check">✓</span>
                )}
            </div>
            <div className="alt-component-content">
                <div className="alt-infosheet">
                    <p>{infosheetData.content}</p>
                    
                    {/* Document viewing section */}
                    {documents.length > 0 && (
                        <div className="infosheet-documents">
                            <h4>Associated Documents</h4>
                            <div className="documents-list">
                                {documents.map((doc) => (
                                    <div key={doc.contentID || doc.id} className="document-item">
                                        <div className="document-info">
                                            {getFileIcon(doc.filename)}
                                            <span className="document-name">{doc.title || doc.filename}</span>
                                            <span className="document-size">{formatFileSize(doc.file_size)}</span>
                                        </div>
                                        <div className="document-actions">
                                            {doc.filename?.toLowerCase().endsWith('.pdf') && (
                                                <button 
                                                    className="view-button" 
                                                    onClick={() => openDocumentViewer(doc)}
                                                    title="View PDF"
                                                >
                                                    <FiEye />
                                                </button>
                                            )}
                                            <button 
                                                className="download-button" 
                                                onClick={() => handleDownload(doc)}
                                                title="Download"
                                            >
                                                <FiDownload />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="alt-mark-complete">
                    {!completedContentIds.has(infosheetData.id) && (
                        <button 
                        className="mark-complete-button"
                        onClick={() => onComplete(infosheetData.id, { viewed: true })}
                        >
                        Mark as Viewed
                        </button>
                    )}
                </div>
            </div>
            
            {/* PDF Viewer Modal */}
            {viewingDocument && (
                <div className="pdf-viewer-modal">
                    <div className="pdf-viewer-container">
                        <button 
                            className="close-modal-button"
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
};

export default InfosheetContent;