import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ImageService from '../../../services/ImageService';
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

describe('ImageService', () => {
  beforeEach(() => {
    // Clear all mock calls before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore console mocks
    vi.restoreAllMocks();
  });

  describe('uploadImages', () => {
    it('should upload images successfully', async () => {
      // Arrange
      const mockResponse = { data: { id: '1', filename: 'image.jpg' } };
      api.post.mockReturnValue(Promise.resolve(mockResponse));

      const formData = new FormData();
      formData.append('files', new File(['image content'], 'image.jpg'));
      formData.append('module_id', '123');
      formData.append('order_index', '1');

      // Act
      const result = await ImageService.uploadImages(formData);

      // Assert
      expect(api.post).toHaveBeenCalledWith('/api/images/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should add order_index if not provided', async () => {
      // Arrange
      const mockResponse = { data: { id: '1', filename: 'image.jpg' } };
      api.post.mockReturnValue(Promise.resolve(mockResponse));

      const formData = new FormData();
      formData.append('files', new File(['image content'], 'image.jpg'));
      formData.append('module_id', '123');

      // Mock console.warn
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      const result = await ImageService.uploadImages(formData);

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith("No order_index provided for image upload, defaulting to 0");
      expect(formData.get('order_index')).toBe('0');
      expect(api.post).toHaveBeenCalledWith('/api/images/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when uploading images', async () => {
      // Arrange
      const errorMessage = 'Network Error';
      api.post.mockReturnValue(Promise.reject(new Error(errorMessage)));

      const formData = new FormData();
      formData.append('files', new File(['image content'], 'image.jpg'));
      formData.append('module_id', '123');
      formData.append('order_index', '1');

      // Act & Assert
      await expect(ImageService.uploadImages(formData)).rejects.toThrow(errorMessage);
      expect(api.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('getModuleImages', () => {
    it('should retrieve images for a specific module', async () => {
      // Arrange
      const moduleId = 123;
      const mockResponse = { data: [{ id: '1', filename: 'image1.jpg' }, { id: '2', filename: 'image2.jpg' }] };
      api.get.mockReturnValue(Promise.resolve(mockResponse));

      // Act
      const result = await ImageService.getModuleImages(moduleId);

      // Assert
      expect(api.get).toHaveBeenCalledWith(`/api/images/?module_id=${moduleId}`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when retrieving module images', async () => {
      // Arrange
      const moduleId = 123;
      const errorMessage = 'Network Error';
      api.get.mockReturnValue(Promise.reject(new Error(errorMessage)));

      // Act & Assert
      await expect(ImageService.getModuleImages(moduleId)).rejects.toThrow(errorMessage);
      expect(api.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteImage', () => {
    it('should delete an image successfully', async () => {
      // Arrange
      const imageId = 'abc-123';
      const mockResponse = { data: { success: true } };
      api.delete.mockReturnValue(Promise.resolve(mockResponse));

      // Act
      const result = await ImageService.deleteImage(imageId);

      // Assert
      expect(api.delete).toHaveBeenCalledWith(`/api/images/${imageId}/`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when deleting an image', async () => {
      // Arrange
      const imageId = 'abc-123';
      const errorMessage = 'Network Error';
      api.delete.mockReturnValue(Promise.reject(new Error(errorMessage)));

      // Act & Assert
      await expect(ImageService.deleteImage(imageId)).rejects.toThrow(errorMessage);
      expect(api.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('getImage', () => {
    it('should retrieve a specific image', async () => {
      // Arrange
      const imageId = 'abc-123';
      const mockResponse = { data: { id: imageId, filename: 'image.jpg' } };
      api.get.mockReturnValue(Promise.resolve(mockResponse));

      // Act
      const result = await ImageService.getImage(imageId);

      // Assert
      expect(api.get).toHaveBeenCalledWith(`/api/images/${imageId}/`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when retrieving an image', async () => {
      // Arrange
      const imageId = 'abc-123';
      const errorMessage = 'Network Error';
      api.get.mockReturnValue(Promise.reject(new Error(errorMessage)));

      // Act & Assert
      await expect(ImageService.getImage(imageId)).rejects.toThrow(errorMessage);
      expect(api.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateImage', () => {
    it('should update image metadata successfully', async () => {
      // Arrange
      const imageId = 'abc-123';
      const updateData = { title: 'New Title', description: 'New Description' };
      const mockResponse = { data: { id: imageId, ...updateData } };
      api.patch.mockReturnValue(Promise.resolve(mockResponse));

      // Act
      const result = await ImageService.updateImage(imageId, updateData);

      // Assert
      expect(api.patch).toHaveBeenCalledWith(`/api/images/${imageId}/`, updateData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when updating image metadata', async () => {
      // Arrange
      const imageId = 'abc-123';
      const updateData = { title: 'New Title' };
      const errorMessage = 'Network Error';
      api.patch.mockReturnValue(Promise.reject(new Error(errorMessage)));

      // Act & Assert
      await expect(ImageService.updateImage(imageId, updateData)).rejects.toThrow(errorMessage);
      expect(api.patch).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateImageDimensions', () => {
    it('should update image dimensions successfully', async () => {
      // Arrange
      const imageId = 'abc-123';
      const width = 800;
      const height = 600;
      const mockResponse = { data: { id: imageId, width, height } };
      api.patch.mockReturnValue(Promise.resolve(mockResponse));

      // Mock console.log
      const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act
      const result = await ImageService.updateImageDimensions(imageId, width, height);

      // Assert
      const expectedFormData = new FormData();
      expectedFormData.append('width', width.toString());
      expectedFormData.append('height', height.toString());

      expect(api.patch).toHaveBeenCalledWith(`/api/images/${imageId}/dimensions/`, expect.any(FormData), {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      // Verify formData values by checking that the right keys were set
      const patchCall = api.patch.mock.calls[0];
      const sentFormData = patchCall[1];
      expect(sentFormData.get('width')).toBe(width.toString());
      expect(sentFormData.get('height')).toBe(height.toString());

      expect(consoleLogSpy).toHaveBeenCalledWith("[SERVER] Server response after updating dimensions:", mockResponse.data);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when updating image dimensions', async () => {
      // Arrange
      const imageId = 'abc-123';
      const width = 800;
      const height = 600;
      const errorMessage = 'Network Error';
      api.patch.mockReturnValue(Promise.reject(new Error(errorMessage)));

      // Mock console.log to not pollute test output
      vi.spyOn(console, 'log').mockImplementation(() => {});

      // Act & Assert
      await expect(ImageService.updateImageDimensions(imageId, width, height)).rejects.toThrow(errorMessage);
      expect(api.patch).toHaveBeenCalledTimes(1);
    });
  });

  describe('getAllImages', () => {
    it('should retrieve all images', async () => {
      // Arrange
      const mockResponse = { data: [{ id: '1', filename: 'image1.jpg' }, { id: '2', filename: 'image2.jpg' }] };
      api.get.mockReturnValue(Promise.resolve(mockResponse));

      // Act
      const result = await ImageService.getAllImages();

      // Assert
      expect(api.get).toHaveBeenCalledWith('/api/images/');
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when retrieving all images', async () => {
      // Arrange
      const errorMessage = 'Network Error';
      api.get.mockReturnValue(Promise.reject(new Error(errorMessage)));

      // Act & Assert
      await expect(ImageService.getAllImages()).rejects.toThrow(errorMessage);
      expect(api.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('updatePublicationStatus', () => {
    it('should update image publication status successfully', async () => {
      // Arrange
      const imageId = 'abc-123';
      const isPublished = true;
      const mockResponse = { data: { id: imageId, is_published: isPublished } };
      api.patch.mockReturnValue(Promise.resolve(mockResponse));

      // Act
      const result = await ImageService.updatePublicationStatus(imageId, isPublished);

      // Assert
      expect(api.patch).toHaveBeenCalledWith(`/api/images/${imageId}/`, {
        is_published: isPublished
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when updating publication status', async () => {
      // Arrange
      const imageId = 'abc-123';
      const isPublished = true;
      const errorMessage = 'Network Error';
      api.patch.mockReturnValue(Promise.reject(new Error(errorMessage)));

      // Act & Assert
      await expect(ImageService.updatePublicationStatus(imageId, isPublished)).rejects.toThrow(errorMessage);
      expect(api.patch).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateImageMetadata', () => {
    it('should update image title and description successfully', async () => {
      // Arrange
      const imageId = 'abc-123';
      const title = 'New Title';
      const description = 'New Description';
      const mockResponse = { data: { id: imageId, title, description } };
      api.patch.mockReturnValue(Promise.resolve(mockResponse));

      // Act
      const result = await ImageService.updateImageMetadata(imageId, title, description);

      // Assert
      expect(api.patch).toHaveBeenCalledWith(`/api/images/${imageId}/`, {
        title,
        description
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when updating image metadata', async () => {
      // Arrange
      const imageId = 'abc-123';
      const title = 'New Title';
      const description = 'New Description';
      const errorMessage = 'Network Error';
      api.patch.mockReturnValue(Promise.reject(new Error(errorMessage)));

      // Act & Assert
      await expect(ImageService.updateImageMetadata(imageId, title, description)).rejects.toThrow(errorMessage);
      expect(api.patch).toHaveBeenCalledTimes(1);
    });
  });
});