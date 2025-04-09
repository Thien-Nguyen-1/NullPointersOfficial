import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DocumentService } from '../../../services/DocumentService';
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

describe('DocumentService', () => {
  beforeEach(() => {
    // Clear all mock calls before each test
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Restore console mocks
    vi.restoreAllMocks();
  });

  describe('uploadDocuments', () => {
    it('should upload documents successfully', async () => {
      // Arrange
      const mockResponse = { data: { id: '1', filename: 'document.pdf' } };
      api.post.mockReturnValue(Promise.resolve(mockResponse));

      const formData = new FormData();
      formData.append('files', new File(['document content'], 'document.pdf'));
      formData.append('module_id', '123');
      formData.append('order_index', '1');

      // Act
      const result = await DocumentService.uploadDocuments(formData);

      // Assert
      expect(api.post).toHaveBeenCalledWith('/api/documents/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should add order_index if not provided', async () => {
      // Arrange
      const mockResponse = { data: { id: '1', filename: 'document.pdf' } };
      api.post.mockReturnValue(Promise.resolve(mockResponse));

      const formData = new FormData();
      formData.append('files', new File(['document content'], 'document.pdf'));
      formData.append('module_id', '123');

      // Mock console.warn
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      // Act
      const result = await DocumentService.uploadDocuments(formData);

      // Assert
      expect(consoleWarnSpy).toHaveBeenCalledWith("No order_index provided for document upload, defaulting to 0");
      expect(formData.get('order_index')).toBe('0');
      expect(api.post).toHaveBeenCalledWith('/api/documents/upload/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when uploading documents', async () => {
      // Arrange
      const errorMessage = 'Network Error';
      api.post.mockReturnValue(Promise.reject(new Error(errorMessage)));

      const formData = new FormData();
      formData.append('files', new File(['document content'], 'document.pdf'));
      formData.append('module_id', '123');
      formData.append('order_index', '1');

      // Act & Assert
      await expect(DocumentService.uploadDocuments(formData)).rejects.toThrow(errorMessage);
      expect(api.post).toHaveBeenCalledTimes(1);
    });
  });

  describe('getModuleDocuments', () => {
    it('should retrieve documents for a specific module', async () => {
      // Arrange
      const moduleId = 123;
      const mockResponse = { data: [{ id: '1', filename: 'doc1.pdf' }, { id: '2', filename: 'doc2.pdf' }] };
      api.get.mockReturnValue(Promise.resolve(mockResponse));

      // Act
      const result = await DocumentService.getModuleDocuments(moduleId);

      // Assert
      expect(api.get).toHaveBeenCalledWith(`/api/documents/?module_id=${moduleId}`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when retrieving module documents', async () => {
      // Arrange
      const moduleId = 123;
      const errorMessage = 'Network Error';
      api.get.mockReturnValue(Promise.reject(new Error(errorMessage)));

      // Act & Assert
      await expect(DocumentService.getModuleDocuments(moduleId)).rejects.toThrow(errorMessage);
      expect(api.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteDocument', () => {
    it('should delete a document successfully', async () => {
      // Arrange
      const documentId = 'abc-123';
      const mockResponse = { data: { success: true } };
      api.delete.mockReturnValue(Promise.resolve(mockResponse));

      // Act
      const result = await DocumentService.deleteDocument(documentId);

      // Assert
      expect(api.delete).toHaveBeenCalledWith(`/api/documents/${documentId}/`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when deleting a document', async () => {
      // Arrange
      const documentId = 'abc-123';
      const errorMessage = 'Network Error';
      api.delete.mockReturnValue(Promise.reject(new Error(errorMessage)));

      // Act & Assert
      await expect(DocumentService.deleteDocument(documentId)).rejects.toThrow(errorMessage);
      expect(api.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('getDocument', () => {
    it('should retrieve a specific document', async () => {
      // Arrange
      const documentId = 'abc-123';
      const mockResponse = { data: { id: documentId, filename: 'document.pdf' } };
      api.get.mockReturnValue(Promise.resolve(mockResponse));

      // Act
      const result = await DocumentService.getDocument(documentId);

      // Assert
      expect(api.get).toHaveBeenCalledWith(`/api/documents/${documentId}/`);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when retrieving a document', async () => {
      // Arrange
      const documentId = 'abc-123';
      const errorMessage = 'Network Error';
      api.get.mockReturnValue(Promise.reject(new Error(errorMessage)));

      // Act & Assert
      await expect(DocumentService.getDocument(documentId)).rejects.toThrow(errorMessage);
      expect(api.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('updateDocument', () => {
    it('should update document metadata successfully', async () => {
      // Arrange
      const documentId = 'abc-123';
      const updateData = { title: 'New Title', description: 'New Description' };
      const mockResponse = { data: { id: documentId, ...updateData } };
      api.patch.mockReturnValue(Promise.resolve(mockResponse));

      // Act
      const result = await DocumentService.updateDocument(documentId, updateData);

      // Assert
      expect(api.patch).toHaveBeenCalledWith(`/api/documents/${documentId}/`, updateData);
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle API errors when updating document metadata', async () => {
      // Arrange
      const documentId = 'abc-123';
      const updateData = { title: 'New Title' };
      const errorMessage = 'Network Error';
      api.patch.mockReturnValue(Promise.reject(new Error(errorMessage)));

      // Act & Assert
      await expect(DocumentService.updateDocument(documentId, updateData)).rejects.toThrow(errorMessage);
      expect(api.patch).toHaveBeenCalledTimes(1);
    });
  });
});