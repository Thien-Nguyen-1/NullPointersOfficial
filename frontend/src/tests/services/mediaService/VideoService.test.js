import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import VideoService from '../../../services/VideoService';

// Mock the API module
vi.mock('../../../services/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
    delete: vi.fn(),
    put: vi.fn(),
    patch: vi.fn()
  }
}));

// Import the mocked api after mocking
import api from '../../../services/api';

describe('VideoService', () => {
  beforeEach(() => {
    // Clear all mock calls before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore console mocks after each test
    vi.restoreAllMocks();
  });

  describe('getModuleVideos', () => {
    it('should retrieve videos for a specific module successfully', async () => {
      // Arrange
      const moduleId = 123;
      const mockVideos = [{ contentID: 'v1', title: 'Video 1' }];
      const mockResponse = { data: mockVideos };
      api.get.mockResolvedValue(mockResponse);

      // Mock console.log
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      const result = await VideoService.getModuleVideos(moduleId);

      // Assert
      expect(api.get).toHaveBeenCalledWith('/api/embedded-videos/', {
        params: { module_id: moduleId }
      });
      expect(consoleLogSpy).toHaveBeenCalledWith(`[DEBUG] Fetching videos for module ID: ${moduleId}`);
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Videos response:', mockVideos);
      expect(result).toEqual(mockVideos);
    });

    it('should handle API errors when retrieving module videos', async () => {
      // Arrange
      const moduleId = 123;
      const errorMessage = 'Network Error';
      const mockError = new Error(errorMessage);
      api.get.mockRejectedValue(mockError);

      // Mock console methods
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act & Assert
      await expect(VideoService.getModuleVideos(moduleId)).rejects.toThrow(errorMessage);
      expect(consoleLogSpy).toHaveBeenCalledWith(`[DEBUG] Fetching videos for module ID: ${moduleId}`);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error fetching videos:', mockError);
    });
  });

  describe('getEmbeddedVideo', () => {
    it('should retrieve a specific embedded video successfully', async () => {
      // Arrange
      const videoId = 'v-123';
      const mockVideo = { contentID: videoId, title: 'Test Video' };
      const mockResponse = { data: mockVideo };
      api.get.mockResolvedValue(mockResponse);

      // Mock console.log
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      const result = await VideoService.getEmbeddedVideo(videoId);

      // Assert
      expect(api.get).toHaveBeenCalledWith(`/api/embedded-videos/${videoId}/`);
      expect(consoleLogSpy).toHaveBeenCalledWith(`[DEBUG] Fetching embedded video with ID: ${videoId}`);
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Embedded video response:', mockVideo);
      expect(result).toEqual(mockVideo);
    });

    it('should handle API errors when retrieving an embedded video', async () => {
      // Arrange
      const videoId = 'v-123';
      const errorMessage = 'Network Error';
      const mockError = new Error(errorMessage);
      api.get.mockRejectedValue(mockError);

      // Mock console methods
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act & Assert
      await expect(VideoService.getEmbeddedVideo(videoId)).rejects.toThrow(errorMessage);
      expect(consoleLogSpy).toHaveBeenCalledWith(`[DEBUG] Fetching embedded video with ID: ${videoId}`);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error fetching embedded video:', mockError);
    });
  });

  describe('createEmbeddedVideo', () => {
    it('should create an embedded video successfully', async () => {
      // Arrange
      const videoData = { video_url: 'https://example.com/video', title: 'New Video' };
      const mockCreatedVideo = { contentID: 'v-123', ...videoData };
      const mockResponse = { data: mockCreatedVideo };
      api.post.mockResolvedValue(mockResponse);

      // Mock console.log
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      const result = await VideoService.createEmbeddedVideo(videoData);

      // Assert
      expect(api.post).toHaveBeenCalledWith('/api/embedded-videos/', videoData);
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Creating embedded video with data:', videoData);
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Create embedded video response:', mockCreatedVideo);
      expect(result).toEqual(mockCreatedVideo);
    });

    it('should handle API errors when creating an embedded video', async () => {
      // Arrange
      const videoData = { video_url: 'https://example.com/video', title: 'New Video' };
      const errorMessage = 'Network Error';
      const mockError = new Error(errorMessage);
      api.post.mockRejectedValue(mockError);

      // Mock console methods
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act & Assert
      await expect(VideoService.createEmbeddedVideo(videoData)).rejects.toThrow(errorMessage);
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Creating embedded video with data:', videoData);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error creating embedded video:', mockError);
    });
  });

  describe('updateEmbeddedVideo', () => {
    it('should update an embedded video successfully', async () => {
      // Arrange
      const videoId = 'v-123';
      const videoData = { title: 'Updated Video', description: 'New description' };
      const mockUpdatedVideo = { contentID: videoId, ...videoData };
      const mockResponse = { data: mockUpdatedVideo };
      api.put.mockResolvedValue(mockResponse);

      // Mock console.log
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      const result = await VideoService.updateEmbeddedVideo(videoId, videoData);

      // Assert
      expect(api.put).toHaveBeenCalledWith(`/api/embedded-videos/${videoId}/`, videoData);
      expect(consoleLogSpy).toHaveBeenCalledWith(`[DEBUG] Updating embedded video with ID: ${videoId}`);
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Update data:', videoData);
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Update embedded video response:', mockUpdatedVideo);
      expect(result).toEqual(mockUpdatedVideo);
    });

    it('should handle API errors when updating an embedded video', async () => {
      // Arrange
      const videoId = 'v-123';
      const videoData = { title: 'Updated Video' };
      const errorMessage = 'Network Error';
      const mockError = new Error(errorMessage);
      api.put.mockRejectedValue(mockError);

      // Mock console methods
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act & Assert
      await expect(VideoService.updateEmbeddedVideo(videoId, videoData)).rejects.toThrow(errorMessage);
      expect(consoleLogSpy).toHaveBeenCalledWith(`[DEBUG] Updating embedded video with ID: ${videoId}`);
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Update data:', videoData);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error updating embedded video:', mockError);
    });
  });

  describe('deleteEmbeddedVideo', () => {
    it('should delete an embedded video successfully', async () => {
      // Arrange
      const videoId = 'v-123';
      const mockResponse = { data: { success: true } };
      api.delete.mockResolvedValue(mockResponse);

      // Mock console.log
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      const result = await VideoService.deleteEmbeddedVideo(videoId);

      // Assert
      expect(api.delete).toHaveBeenCalledWith(`/api/embedded-videos/${videoId}/`);
      expect(consoleLogSpy).toHaveBeenCalledWith(`[DEBUG] Deleting embedded video with ID: ${videoId}`);
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Embedded video deleted successfully');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when deleting an embedded video', async () => {
      // Arrange
      const videoId = 'v-123';
      const errorMessage = 'Network Error';
      const mockError = new Error(errorMessage);
      api.delete.mockRejectedValue(mockError);

      // Mock console methods
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act & Assert
      await expect(VideoService.deleteEmbeddedVideo(videoId)).rejects.toThrow(errorMessage);
      expect(consoleLogSpy).toHaveBeenCalledWith(`[DEBUG] Deleting embedded video with ID: ${videoId}`);
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error deleting embedded video:', mockError);
    });
  });

  describe('uploadVideos', () => {
    it('should upload videos with no existing videos', async () => {
      // Arrange
      const moduleId = '123';
      const videoUrl = 'https://example.com/video';
      const videoTitle = 'Test Video';

      // Create form data with one video file (JSON data)
      const formData = new FormData();
      formData.append('module_id', moduleId);
      formData.append('order_index', '1');

      // Create a mock file with JSON content
      const videoData = JSON.stringify({ video_url: videoUrl, title: videoTitle });
      const file = new File([videoData], 'video.json', { type: 'application/json' });
      formData.append('files', file);

      // Mock text reading directly
      File.prototype.text = vi.fn().mockResolvedValue(videoData);

      // Mock getModuleVideos to return empty array (no existing videos)
      vi.spyOn(VideoService, 'getModuleVideos').mockResolvedValue([]);

      // Mock createEmbeddedVideo
      const mockCreatedVideo = { contentID: 'v-123', video_url: videoUrl, title: videoTitle };
      vi.spyOn(VideoService, 'createEmbeddedVideo').mockResolvedValue(mockCreatedVideo);

      // Mock console.log and console.warn
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      const result = await VideoService.uploadVideos(formData);

      // Assert
      expect(VideoService.getModuleVideos).toHaveBeenCalledWith(moduleId);
      expect(VideoService.createEmbeddedVideo).toHaveBeenCalledWith(expect.objectContaining({
        video_url: videoUrl,
        title: videoTitle,
        moduleID: moduleId
      }));
      expect(result).toEqual([mockCreatedVideo]);
      expect(consoleLogSpy).toHaveBeenCalledWith(`[DEBUG] Creating new video for module: ${moduleId}`);
    });

    it('should upload videos with existing videos but not duplicate', async () => {
      // Arrange
      const moduleId = '123';
      const videoUrl = 'https://example.com/video';
      const videoTitle = 'Test Video';
      const existingVideoId = 'existing-123';

      // Create form data with one video file (JSON data)
      const formData = new FormData();
      formData.append('module_id', moduleId);
      formData.append('order_index', '1');

      // Create a mock file with JSON content
      const videoData = JSON.stringify({ video_url: videoUrl, title: videoTitle });
      const file = new File([videoData], 'video.json', { type: 'application/json' });
      formData.append('files', file);

      // Mock file text reading
      File.prototype.text = vi.fn().mockResolvedValue(videoData);

      // Mock getModuleVideos to return existing videos with same URL
      const existingVideos = [{ contentID: existingVideoId, video_url: videoUrl, title: 'Old Title' }];
      vi.spyOn(VideoService, 'getModuleVideos').mockResolvedValue(existingVideos);

      // Mock updateEmbeddedVideo
      const mockUpdatedVideo = { contentID: existingVideoId, video_url: videoUrl, title: videoTitle };
      vi.spyOn(VideoService, 'updateEmbeddedVideo').mockResolvedValue(mockUpdatedVideo);

      // Mock console methods
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      const result = await VideoService.uploadVideos(formData);

      // Assert
      expect(VideoService.getModuleVideos).toHaveBeenCalledWith(moduleId);
      expect(VideoService.updateEmbeddedVideo).toHaveBeenCalledWith(existingVideoId, expect.objectContaining({
        video_url: videoUrl,
        title: videoTitle,
        moduleID: moduleId
      }));
      expect(result).toEqual([mockUpdatedVideo]);
      expect(consoleLogSpy).toHaveBeenCalledWith(`[DEBUG] Updating existing video ${existingVideoId} instead of creating duplicate`);
    });

    it('should handle update error and create new video if needed', async () => {
      // Arrange
      const moduleId = '123';
      const videoUrl = 'https://example.com/video';
      const videoTitle = 'Test Video';
      const existingVideoId = 'existing-123';

      // Create form data with one video file (JSON data)
      const formData = new FormData();
      formData.append('module_id', moduleId);
      formData.append('order_index', '1');

      // Create a mock file with JSON content
      const videoData = JSON.stringify({ video_url: videoUrl, title: videoTitle });
      const file = new File([videoData], 'video.json', { type: 'application/json' });
      formData.append('files', file);

      // Mock file text reading
      File.prototype.text = vi.fn().mockResolvedValue(videoData);

      // Mock getModuleVideos to return existing videos with same URL
      const existingVideos = [{ contentID: existingVideoId, video_url: videoUrl, title: 'Old Title' }];
      vi.spyOn(VideoService, 'getModuleVideos').mockResolvedValue(existingVideos);

      // Mock updateEmbeddedVideo to fail
      const updateError = new Error('Video was deleted');
      vi.spyOn(VideoService, 'updateEmbeddedVideo').mockRejectedValue(updateError);

      // Mock createEmbeddedVideo
      const mockCreatedVideo = { contentID: 'v-new-123', video_url: videoUrl, title: videoTitle };
      vi.spyOn(VideoService, 'createEmbeddedVideo').mockResolvedValue(mockCreatedVideo);

      // Mock console methods
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      const result = await VideoService.uploadVideos(formData);

      // Assert
      expect(VideoService.getModuleVideos).toHaveBeenCalledWith(moduleId);
      expect(VideoService.updateEmbeddedVideo).toHaveBeenCalledWith(existingVideoId, expect.objectContaining({
        video_url: videoUrl,
        moduleID: moduleId
      }));
      expect(VideoService.createEmbeddedVideo).toHaveBeenCalledWith(expect.objectContaining({
        video_url: videoUrl,
        moduleID: moduleId
      }));
      expect(result).toEqual([mockCreatedVideo]);
      expect(consoleLogSpy).toHaveBeenCalledWith(`[DEBUG] Update failed, creating new video:`, updateError.message);
    });

    it('should skip videos without URLs', async () => {
      // Arrange
      const moduleId = '123';

      // Create form data with one video file (JSON data) without URL
      const formData = new FormData();
      formData.append('module_id', moduleId);
      formData.append('order_index', '1');

      // Create a mock file with JSON content
      const videoData = JSON.stringify({ title: 'Video without URL' });
      const file = new File([videoData], 'video.json', { type: 'application/json' });
      formData.append('files', file);

      // Mock file text reading
      File.prototype.text = vi.fn().mockResolvedValue(videoData);

      // Mock getModuleVideos
      vi.spyOn(VideoService, 'getModuleVideos').mockResolvedValue([]);

      // Mock console methods
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      const result = await VideoService.uploadVideos(formData);

      // Assert
      expect(VideoService.getModuleVideos).toHaveBeenCalledWith(moduleId);
      expect(result).toEqual([]);
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Skipping video data without URL');
    });

    it('should skip duplicate URLs within the same batch', async () => {
      // Arrange
      const moduleId = '123';
      const videoUrl = 'https://example.com/video';

      // Create form data with two video files with the same URL
      const formData = new FormData();
      formData.append('module_id', moduleId);
      formData.append('order_index', '1');

      // Create two mock files with the same URL
      const videoData1 = JSON.stringify({ video_url: videoUrl, title: 'First Video' });
      const file1 = new File([videoData1], 'video1.json', { type: 'application/json' });
      formData.append('files', file1);

      const videoData2 = JSON.stringify({ video_url: videoUrl, title: 'Second Video' });
      const file2 = new File([videoData2], 'video2.json', { type: 'application/json' });
      formData.append('files', file2);

      // Mock file text reading
      File.prototype.text = vi.fn()
        .mockResolvedValueOnce(videoData1)
        .mockResolvedValueOnce(videoData2);

      // Mock getModuleVideos
      vi.spyOn(VideoService, 'getModuleVideos').mockResolvedValue([]);

      // Mock createEmbeddedVideo
      const mockCreatedVideo = { contentID: 'v-123', video_url: videoUrl, title: 'First Video' };
      vi.spyOn(VideoService, 'createEmbeddedVideo').mockResolvedValue(mockCreatedVideo);

      // Mock console methods
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      const result = await VideoService.uploadVideos(formData);

      // Assert
      expect(VideoService.getModuleVideos).toHaveBeenCalledWith(moduleId);
      expect(VideoService.createEmbeddedVideo).toHaveBeenCalledTimes(1);
      expect(result).toEqual([mockCreatedVideo]);
      expect(consoleLogSpy).toHaveBeenCalledWith(`[DEBUG] Skipping duplicate URL in batch: ${videoUrl}`);
    });

    it('should add order_index if not provided', async () => {
      // Arrange
      const moduleId = '123';
      const videoUrl = 'https://example.com/video';
      const videoTitle = 'Test Video';

      // Create form data without order_index but with a file
      const formData = new FormData();
      formData.append('module_id', moduleId);

      // Create a mock file with JSON content - must include a file for the test to pass
      const videoData = JSON.stringify({ video_url: videoUrl, title: videoTitle });
      const file = new File([videoData], 'video.json', { type: 'application/json' });
      formData.append('files', file);

      // Mock file text reading
      File.prototype.text = vi.fn().mockResolvedValue(videoData);

      // Mock console.warn
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Mock getModuleVideos
      vi.spyOn(VideoService, 'getModuleVideos').mockResolvedValue([]);

      // Mock createEmbeddedVideo
      const mockCreatedVideo = { contentID: 'v-123', video_url: videoUrl, title: videoTitle };
      vi.spyOn(VideoService, 'createEmbeddedVideo').mockResolvedValue(mockCreatedVideo);

      // Act
      await VideoService.uploadVideos(formData);

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith("No order_index provided for video upload, defaulting to 0");
      expect(formData.get('order_index')).toBe('0');
    });

    it('should throw error if module_id is missing', async () => {
      // Arrange
      const formData = new FormData();
      formData.append('order_index', '1');

      // Add a file to pass the file check
      const videoData = JSON.stringify({ video_url: 'https://example.com/video', title: 'Test Video' });
      const file = new File([videoData], 'video.json', { type: 'application/json' });
      formData.append('files', file);

      // Mock console methods
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act & Assert
      await expect(VideoService.uploadVideos(formData)).rejects.toThrow('Module ID is required');
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Processing video data with duplicate prevention');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error processing video data:', expect.any(Error));
    });

    it('should throw error if no files are provided', async () => {
      // Arrange
      const moduleId = '123';
      const formData = new FormData();
      formData.append('module_id', moduleId);
      formData.append('order_index', '1');

      // Mock console methods
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      // Act & Assert
      await expect(VideoService.uploadVideos(formData)).rejects.toThrow('No video data provided');
      expect(consoleLogSpy).toHaveBeenCalledWith('[DEBUG] Processing video data with duplicate prevention');
      expect(consoleErrorSpy).toHaveBeenCalledWith('[ERROR] Error processing video data:', expect.any(Error));
    });
  });

  describe('deleteVideo', () => {
    it('should call deleteEmbeddedVideo with the videoId', async () => {
      // Arrange
      const videoId = 'v-123';
      const mockResponse = { success: true };

      // Mock deleteEmbeddedVideo
      vi.spyOn(VideoService, 'deleteEmbeddedVideo').mockResolvedValue(mockResponse);

      // Act
      const result = await VideoService.deleteVideo(videoId);

      // Assert
      expect(VideoService.deleteEmbeddedVideo).toHaveBeenCalledWith(videoId);
      expect(result).toEqual(mockResponse);
    });

    it('should handle errors from deleteEmbeddedVideo', async () => {
      // Arrange
      const videoId = 'v-123';
      const errorMessage = 'Delete error';

      // Mock deleteEmbeddedVideo to throw
      vi.spyOn(VideoService, 'deleteEmbeddedVideo').mockRejectedValue(new Error(errorMessage));

      // Act & Assert
      await expect(VideoService.deleteVideo(videoId)).rejects.toThrow(errorMessage);
      expect(VideoService.deleteEmbeddedVideo).toHaveBeenCalledWith(videoId);
    });
  });
});