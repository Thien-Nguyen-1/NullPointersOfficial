import api from './api';

const ImageService = {
  /**
   * Upload images to a module
   * @param {FormData} formData - Form data containing files, module_id and optionally component_id
   * @returns {Promise} - Promise resolving to uploaded image data
   */
  uploadImages: async (formData) => {
    // Ensure order_index is present
      if (!formData.has('order_index')) {
          console.warn("No order_index provided for image upload, defaulting to 0");
          formData.append('order_index', '0');
      }
    const response = await api.post('/api/images/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Get all images for a specific module
   * @param {number} moduleId - ID of the module
   * @returns {Promise} - Promise resolving to array of images
   */
  getModuleImages: async (moduleId) => {
    const response = await api.get(`/api/images/?module_id=${moduleId}`);
    return response.data;
  },

  /**
   * Delete an image
   * @param {string} imageId - UUID of the image to delete (contentID)
   * @returns {Promise} - Promise resolving to delete status
   */
  deleteImage: async (imageId) => {
    const response = await api.delete(`/api/images/${imageId}/`);
    return response.data;
  },

  /**
   * Get image details
   * @param {string} imageId - UUID of the image (contentID)
   * @returns {Promise} - Promise resolving to image details
   */
  getImage: async (imageId) => {
    const response = await api.get(`/api/images/${imageId}/`);
    return response.data;
  },

  /**
   * Update image metadata
   * @param {string} imageId - UUID of the image (contentID)
   * @param {Object} data - Updated image data
   * @returns {Promise} - Promise resolving to updated image
   */
  updateImage: async (imageId, data) => {
    const response = await api.patch(`/api/images/${imageId}/`, data);
    return response.data;
  },

  /**
   * Update image dimensions
   * @param {string} imageId - UUID of the image (contentID)
   * @param {number} width - New width in pixels
   * @param {number} height - New height in pixels
   * @returns {Promise} - Promise resolving to updated image
   */


  /**
     * Update image dimensions
     * @param {string} imageId - UUID of the image (contentID)
     * @param {number} width - New width in pixels
     * @param {number} height - New height in pixels
     * @returns {Promise} - Promise resolving to updated image
  */
  updateImageDimensions: async (imageId, width, height) => {
    const formData = new FormData();
    formData.append('width', width.toString());
    formData.append('height', height.toString());
    const response = await api.patch(`/api/images/${imageId}/dimensions/`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
    });
    console.log("[SERVER] Server response after updating dimensions:", response.data);
    return response.data;
  },

  /**
   * Get all images
   * @returns {Promise} - Promise resolving to array of all images
   */
  getAllImages: async () => {
    const response = await api.get('/api/images/');
    return response.data;
  },

  /**
   * Update image publication status
   * @param {string} imageId - UUID of the image (contentID)
   * @param {boolean} isPublished - Publication status
   * @returns {Promise} - Promise resolving to updated image
   */
  updatePublicationStatus: async (imageId, isPublished) => {
    const response = await api.patch(`/api/images/${imageId}/`, {
      is_published: isPublished
    });
    return response.data;
  },

  /**
   * Update image title and description
   * @param {string} imageId - UUID of the image (contentID)
   * @param {string} title - New image title
   * @param {string} description - New image description
   * @returns {Promise} - Promise resolving to updated image
   */
  updateImageMetadata: async (imageId, title, description) => {
    const response = await api.patch(`/api/images/${imageId}/`, {
      title,
      description
    });
    return response.data;
  }
};

export default ImageService;