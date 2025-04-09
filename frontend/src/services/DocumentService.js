import api from './api';

export const DocumentService = {
  /**
   * Upload documents to a module
   * @param {FormData} formData - Form data containing files and module_id
   * @returns {Promise} - Promise resolving to uploaded document data
   */
  uploadDocuments: async (formData) => {
    // Ensure order_index is present
      if (!formData.has('order_index')) {
          console.warn("No order_index provided for document upload, defaulting to 0");
          formData.append('order_index', '0');
      }
    const response = await api.post('/api/documents/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Get all documents for a specific module
   * @param {number} moduleId - ID of the module
   * @returns {Promise} - Promise resolving to array of documents
   */
  getModuleDocuments: async (moduleId) => {
    console.log(`[DOCUMENT SERVICE] Fetching documents for moduleId: ${moduleId}`);

    const response = await api.get(`/api/documents/?module_id=${moduleId}`);
    console.log(`[DOCUMENT SERVICE] Documents found:`, response.data);

    return response.data;
  },

  /**
   * Delete a document
   * @param {string} documentId - UUID of the document to delete
   * @returns {Promise} - Promise resolving to delete status
   */
  deleteDocument: async (documentId) => {
    const response = await api.delete(`/api/documents/${documentId}/`);
    return response.data;
  },

  /**
   * Get document details
   * @param {string} documentId - UUID of the document
   * @returns {Promise} - Promise resolving to document details
   */
  getDocument: async (documentId) => {
    const response = await api.get(`/api/documents/${documentId}/`);
    return response.data;
  },
  
  /**
   * Update document metadata
   * @param {string} documentId - UUID of the document
   * @param {Object} data - Updated document data
   * @returns {Promise} - Promise resolving to updated document
   */
  updateDocument: async (documentId, data) => {
    const response = await api.patch(`/api/documents/${documentId}/`, data);
    return response.data;
  }
};

export default DocumentService;