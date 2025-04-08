import api from './api';

export const AudioService = {
  /**
   * Upload audio files to a module
   * @param {FormData} formData - Form data containing files and module_id
   * @returns {Promise} - Promise resolving to uploaded audio data
   */
  uploadAudios: async (formData) => {
    // Ensure order_index is present
      if (!formData.has('order_index')) {
          console.warn("No order_index provided for audio upload, defaulting to 0");
          formData.append('order_index', '0');
      }
    const response = await api.post('/api/audios/upload/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  /**
   * Get all audio files for a specific module
   * @param {number} moduleId - ID of the module
   * @returns {Promise} - Promise resolving to array of audio files
   */
  getModuleAudios: async (moduleId) => {
    const response = await api.get(`/api/audios/?module_id=${moduleId}`);
    return response.data;
  },

  /**
   * Delete an audio file
   * @param {string} audioId - UUID of the audio to delete
   * @returns {Promise} - Promise resolving to delete status
   */
  deleteAudio: async (audioId) => {
    const response = await api.delete(`/api/audios/${audioId}/`);
    return response.data;
  },

  /**
   * Get audio details
   * @param {string} audioId - UUID of the audio
   * @returns {Promise} - Promise resolving to audio details
   */
  getAudio: async (audioId) => {
    const response = await api.get(`/api/audios/${audioId}/`);
    return response.data;
  },
  
  /**
   * Update audio metadata
   * @param {string} audioId - UUID of the audio
   * @param {Object} data - Updated audio data
   * @returns {Promise} - Promise resolving to updated audio
   */
  updateAudio: async (audioId, data) => {
    const response = await api.patch(`/api/audios/${audioId}/`, data);
    return response.data;
  }
};

export default AudioService;