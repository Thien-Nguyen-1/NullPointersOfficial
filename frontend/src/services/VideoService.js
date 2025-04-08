import api from './api';

/**
 * Service for managing embedded videos
 */
const VideoService = {
  /**
   * Get all videos for a specific module
   * @param {number} moduleId - The module ID
   * @returns {Promise} - API response with videos
   */
  getModuleVideos: async (moduleId) => {
    try {
      console.log(`[DEBUG] Fetching videos for module ID: ${moduleId}`);
      const response = await api.get('/api/embedded-videos/', {
        params: { module_id: moduleId }
      });
      console.log('[DEBUG] Videos response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ERROR] Error fetching videos:', error);
      throw error;
    }
  },

  /**
   * Get a specific embedded video by ID
   * @param {string} videoId - The content ID of the video
   * @returns {Promise} - API response with video data
   */
  getEmbeddedVideo: async (videoId) => {
    try {
      console.log(`[DEBUG] Fetching embedded video with ID: ${videoId}`);
      const response = await api.get(`/api/embedded-videos/${videoId}/`);
      console.log('[DEBUG] Embedded video response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ERROR] Error fetching embedded video:', error);
      throw error;
    }
  },

  /**
   * Create a new embedded video
   * @param {Object} videoData - The video data to create
   * @returns {Promise} - API response with created video
   */
  createEmbeddedVideo: async (videoData) => {
    try {
      console.log('[DEBUG] Creating embedded video with data:', videoData);
      const response = await api.post('/api/embedded-videos/', videoData);
      console.log('[DEBUG] Create embedded video response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ERROR] Error creating embedded video:', error);
      throw error;
    }
  },

  /**
   * Update an existing embedded video
   * @param {string} videoId - The content ID of the video to update
   * @param {Object} videoData - The updated video data
   * @returns {Promise} - API response with updated video
   */
  updateEmbeddedVideo: async (videoId, videoData) => {
    try {
      console.log(`[DEBUG] Updating embedded video with ID: ${videoId}`);
      console.log('[DEBUG] Update data:', videoData);
      const response = await api.put(`/api/embedded-videos/${videoId}/`, videoData);
      console.log('[DEBUG] Update embedded video response:', response.data);
      return response.data;
    } catch (error) {
      console.error('[ERROR] Error updating embedded video:', error);
      throw error;
    }
  },

  /**
   * Delete an embedded video
   * @param {string} videoId - The content ID of the video to delete
   * @returns {Promise} - API response
   */
  deleteEmbeddedVideo: async (videoId) => {
    try {
      console.log(`[DEBUG] Deleting embedded video with ID: ${videoId}`);
      const response = await api.delete(`/api/embedded-videos/${videoId}/`);
      console.log('[DEBUG] Embedded video deleted successfully');
      return response.data;
    } catch (error) {
      console.error('[ERROR] Error deleting embedded video:', error);
      throw error;
    }
  },

  // deleteEmbeddedVideo: async (videoId) => {
  //   try {
  //     console.log(`[DEBUG] Deleting embedded video with ID: ${videoId}`);
  //     await api.delete(`/api/embedded-videos/${videoId}/`);
  //     console.log('[DEBUG] Embedded video deleted successfully');
  //     return true;
  //   } catch (error) {
  //     console.error('[ERROR] Error deleting embedded video:', error);
  //     throw error;
  //   }
  // },

  /**
   * Upload videos with duplicate prevention
   * This is the key method that prevents duplicates by checking existing videos
   * @param {FormData} formData - The form data containing video data
   * @returns {Promise} - API response
   */
  uploadVideos: async (formData) => {
    // Ensure order_index is present
      if (!formData.has('order_index')) {
          console.warn("No order_index provided for video upload, defaulting to 0");
          formData.append('order_index', '0');
      }
    try {
      console.log('[DEBUG] Processing video data with duplicate prevention');

      // Extract the module ID from form data
      const moduleId = formData.get('module_id');
      if (!moduleId) {
        throw new Error('Module ID is required');
      }

      // Extract files from the form data
      const files = formData.getAll('files');
      if (!files || files.length === 0) {
        throw new Error('No video data provided');
      }

      // First, get all existing videos for this module to prevent duplicates
      const existingVideos = await VideoService.getModuleVideos(moduleId);
      console.log(`[DEBUG] Found ${existingVideos.length} existing videos for module ${moduleId}`);

      // Process each file (in this case, they're actually JSON data)
      const results = [];

      // Track processed videos to avoid duplicates within this batch
      const processedUrls = new Set();

      for (const file of files) {
        // Read the content as JSON
        const fileContent = await file.text();
        const videoData = JSON.parse(fileContent);

        // Skip if no URL
        if (!videoData.video_url) {
          console.log('[DEBUG] Skipping video data without URL');
          continue;
        }

        // Skip if we already processed this URL in this batch
        if (processedUrls.has(videoData.video_url)) {
          console.log(`[DEBUG] Skipping duplicate URL in batch: ${videoData.video_url}`);
          continue;
        }

        // Add the module ID
        videoData.moduleID = moduleId;

        // Check if a video with this URL already exists for this module
        const existingVideo = existingVideos.find(v =>
          v.video_url === videoData.video_url
        );

        let response;

        if (existingVideo) {
          // Update existing video instead of creating a new one
          console.log(`[DEBUG] Updating existing video ${existingVideo.contentID} instead of creating duplicate`);
          try {
            response = await VideoService.updateEmbeddedVideo(existingVideo.contentID, videoData);
          } catch (updateError) {
            // If update fails (e.g., if it was deleted), create a new one
            console.log(`[DEBUG] Update failed, creating new video:`, updateError.message);
            response = await VideoService.createEmbeddedVideo(videoData);
          }
        } else {
          // Create new video
          console.log(`[DEBUG] Creating new video for module: ${moduleId}`);
          response = await VideoService.createEmbeddedVideo(videoData);
        }

        // Mark this URL as processed
        processedUrls.add(videoData.video_url);

        results.push(response);
      }

      console.log('[DEBUG] Successfully processed video data:', results);
      return results;
    } catch (error) {
      console.error('[ERROR] Error processing video data:', error);
      throw error;
    }
  },

  /**
   * Delete video by ID
   * @param {string} videoId - The ID of the video to delete
   * @returns {Promise} - API response
   */
  deleteVideo: async (videoId) => {
    return VideoService.deleteEmbeddedVideo(videoId);
  }
};

export default VideoService;