import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AudioService } from '../../../services/AudioService';
import api from '../../../services/api';

// Mock the API module
vi.mock('../../../services/api', () => {
  return {
    default: {
      post: vi.fn(),
      get: vi.fn(),
      delete: vi.fn(),
      patch: vi.fn()
    }
  };
});

describe('AudioService', () => {
  beforeEach(() => {
    // Clear all mock calls before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore console mocks
    vi.restoreAllMocks();
  });

  describe('uploadAudios', () => {
    it('should upload audio files successfully', async () => {
      // Arrange
      const mockResponse = { data: { id: '1', filename: 'audio.mp3' } };
      api.post.mockReturnValue(Promise.resolve(mockResponse));

      const formData = new FormData();
      formData.append('files', new File(['audio content'], 'audio.mp3'));
      formData.append('module_id', '123');
      formData.append('order_index', '1');

      // Act
      const result = await AudioService.uploadAudios(formData);

      // Assert
      expect(api.post).toHaveBeenCalledWith('/api/audios/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should add order_index if not provided', async () => {
      // Arrange
      const mockResponse = { data: { id: '1', filename: 'audio.mp3' } };
      api.post.mockReturnValue(Promise.resolve(mockResponse));

      const formData = new FormData();
      formData.append('files', new File(['audio content'], 'audio.mp3'));
      formData.append('module_id', '123');

      // Mock console.warn
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      const result = await AudioService.uploadAudios(formData);

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith("No order_index provided for audio upload, defaulting to 0");
      expect(formData.get('order_index')).toBe('0');
      expect(api.post).toHaveBeenCalledWith('/api/audios/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when uploading audios', async () => {
      // Arrange
      const errorMessage = 'Network Error';
      api.post.mockReturnValue(Promise.reject(new Error(errorMessage)));

      const formData = new FormData();
      formData.append('files', new File(['audio content'], 'audio.mp3'));
      formData.append('module_id', '123');
      formData.append('order_index', '1');

      // Act & Assert
      await expect(AudioService.uploadAudios(formData)).rejects.toThrow(errorMessage);
      expect(api.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('getModuleAudios', () => {
    it('should retrieve audios for a specific module', async () => {
      // Arrange
      const moduleId = 123;
      const mockResponse = { data: [{ id: '1', filename: 'audio1.mp3' }, { id: '2', filename: 'audio2.mp3' }] };
      api.get.mockReturnValue(Promise.resolve(mockResponse));

      // Act
      const result = await AudioService.getModuleAudios(moduleId);

      // Assert
      expect(api.get).toHaveBeenCalledWith(`/api/audios/?module_id=${moduleId}`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when retrieving module audios', async () => {
      // Arrange
      const moduleId = 123;
      const errorMessage = 'Network Error';
      api.get.mockReturnValue(Promise.reject(new Error(errorMessage)));

      // Act & Assert
      await expect(AudioService.getModuleAudios(moduleId)).rejects.toThrow(errorMessage);
      expect(api.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteAudio', () => {
    it('should delete an audio file successfully', async () => {
      // Arrange
      const audioId = 'abc-123';
      const mockResponse = { data: { success: true } };
      api.delete.mockReturnValue(Promise.resolve(mockResponse));

      // Act
      const result = await AudioService.deleteAudio(audioId);

      // Assert
      expect(api.delete).toHaveBeenCalledWith(`/api/audios/${audioId}/`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when deleting an audio', async () => {
      // Arrange
      const audioId = 'abc-123';
      const errorMessage = 'Network Error';
      api.delete.mockReturnValue(Promise.reject(new Error(errorMessage)));

      // Act & Assert
      await expect(AudioService.deleteAudio(audioId)).rejects.toThrow(errorMessage);
      expect(api.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAudio', () => {
    it('should retrieve a specific audio file', async () => {
      // Arrange
      const audioId = 'abc-123';
      const mockResponse = { data: { id: audioId, filename: 'audio.mp3' } };
      api.get.mockReturnValue(Promise.resolve(mockResponse));

      // Act
      const result = await AudioService.getAudio(audioId);

      // Assert
      expect(api.get).toHaveBeenCalledWith(`/api/audios/${audioId}/`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when retrieving an audio', async () => {
      // Arrange
      const audioId = 'abc-123';
      const errorMessage = 'Network Error';
      api.get.mockReturnValue(Promise.reject(new Error(errorMessage)));

      // Act & Assert
      await expect(AudioService.getAudio(audioId)).rejects.toThrow(errorMessage);
      expect(api.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateAudio', () => {
    it('should update audio metadata successfully', async () => {
      // Arrange
      const audioId = 'abc-123';
      const updateData = { title: 'New Title', description: 'New Description' };
      const mockResponse = { data: { id: audioId, ...updateData } };
      api.patch.mockReturnValue(Promise.resolve(mockResponse));

      // Act
      const result = await AudioService.updateAudio(audioId, updateData);

      // Assert
      expect(api.patch).toHaveBeenCalledWith(`/api/audios/${audioId}/`, updateData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when updating audio metadata', async () => {
      // Arrange
      const audioId = 'abc-123';
      const updateData = { title: 'New Title' };
      const errorMessage = 'Network Error';
      api.patch.mockReturnValue(Promise.reject(new Error(errorMessage)));

      // Act & Assert
      await expect(AudioService.updateAudio(audioId, updateData)).rejects.toThrow(errorMessage);
      expect(api.patch).toHaveBeenCalledTimes(1);
    });
  });
});