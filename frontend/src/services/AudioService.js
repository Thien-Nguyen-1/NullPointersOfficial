// Service for handling audio clip API requests

import api from './api';

class AudioService {
  // Get all audio clips for a module
  static async getModuleAudios(moduleId) {
    try {
      const response = await api.get(`/api/modules/${moduleId}/audios/`);

      // Make sure we only return audios that belong to this module
      const filteredAudios = response.data.filter(audio => 
        String(audio.moduleID) === String(moduleId)
      );
      
      console.log(`AudioService: filtered ${response.data.length} audios down to ${filteredAudios.length} for moduleId ${moduleId}`);
      return filteredAudios;
    } catch (error) {
      console.error("Error fetching audio clips:", error);
      throw error;
    }
  }

  // Get a specific audio clip
  static async getAudio(audioId) {
    try {
      const response = await api.get(`/api/audios/${audioId}/`);
      return response.data;
    } catch (error) {
      console.error("Error fetching audio clip:", error);
      throw error;
    }
  }

  // Upload audio clips
  static async uploadAudios(formData) {
    try {
      console.log("AudioService.uploadAudios called with formData:", formData);
      
      // Log all form data
      for (let pair of formData.entries()) {
        console.log("Form data entry:", pair[0], pair[1]);
      }
      
      console.log("Sending request to /api/audios/upload/");
      const response = await api.post('/api/audios/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      console.log("Upload response:", response);
      return response.data;
    } catch (error) {
      console.error("Error uploading audio clips:", error);
      console.error("Error response:", error.response);
      throw error;
    }
  }

  // Delete an audio clip
  static async deleteAudio(audioId) {
    try {
      const response = await api.delete(`/api/audios/${audioId}/`);
      return response.data;
    } catch (error) {
      console.error("Error deleting audio clip:", error);
      throw error;
    }
  }

  // Update audio clip metadata
  static async updateAudio(audioId, data) {
    try {
      const response = await api.patch(`/api/audios/${audioId}/`, data);
      return response.data;
    } catch (error) {
      console.error("Error updating audio clip:", error);
      throw error;
    }
  }

  static async cleanupOrphanedAudios(moduleId, keptAudioComponentIds) {
    try {
      // Get all audio files for this module
      const allAudios = await this.getModuleAudios(moduleId);
      
      // Delete any that aren't in the kept list
      for (const audio of allAudios) {
        if (!keptAudioComponentIds.includes(audio.contentID)) {
          await this.deleteAudio(audio.contentID);
          console.log(`Deleted orphaned audio: ${audio.contentID}`);
        }
      }
      
      return allAudios.length - keptAudioComponentIds.length; // Number deleted
    } catch (error) {
      console.error("Error cleaning up orphaned audios:", error);
      throw error;
    }
  }
}



export default AudioService;