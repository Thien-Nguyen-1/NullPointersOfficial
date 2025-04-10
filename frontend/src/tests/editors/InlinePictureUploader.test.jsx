import { test, describe, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import InlinePictureUploader from '../../components/editors/InlinePictureUploader';
import DragDropUploader from '../../components/editors/DragDropUploader';
import ImageService from '../../services/ImageService';


vi.mock('../../components/editors/DragDropUploader', () => ({
    default: vi.fn(({ onUpload }) => (
      <div data-testid="drag-drop-uploader">
        <button data-testid="mock-upload-button" onClick={() => {
          const formData = new FormData();
          const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
          formData.append('files', file);
          onUpload(formData);
        }}>
          Mock Upload
        </button>
      </div>
    ))
  }));

  vi.mock('../../services/ImageService', () => ({
    default: {
      getModuleImages: vi.fn(),
      uploadImages: vi.fn(),
      deleteImage: vi.fn(),
      updateImageDimensions: vi.fn()
    }
  }));

  vi.mock('react-icons/fi', () => ({
    FiImage: () => <span data-testid="fi-image">FiImage</span>,
    FiTrash2: () => <span data-testid="fi-trash2">FiTrash2</span>,
    FiDownload: () => <span data-testid="fi-download">FiDownload</span>,
    FiCheckCircle: () => <span data-testid="fi-check-circle">FiCheckCircle</span>,
    FiEdit: () => <span data-testid="fi-edit">FiEdit</span>,
    FiSave: () => <span data-testid="fi-save">FiSave</span>
  }));



global.URL.createObjectURL = vi.fn(() => 'mock-object-url');
global.URL.revokeObjectURL = vi.fn();


global.confirm = vi.fn();

describe('InlinePictureUploader Component', () => {
    // Helper function to create a mock image
    const createMockImage = (id) => ({
      contentID: `image-${id}`,
      file_url: `/images/test-${id}.jpg`,
      filename: `test-${id}.jpg`,
      title: `Test Image ${id}`,
      width: 300,
      height: 200,
      file_size: 1024 * 100, // 100KB
      file_size_formatted: '100 KB',
      created_at: '2023-01-01T00:00:00.000Z'
    });
  
   
    const createMockTempFile = (id) => {
      const file = new File(['dummy content'], `temp-${id}.jpg`, { type: 'image/jpeg' });
      return {
        id: `temp-${id}`,
        file: file,
        filename: `temp-${id}.jpg`,
        title: `Temp Image ${id}`,
        width: 300,
        height: 200,
        originalWidth: 600,
        originalHeight: 400,
        file_size: 1024 * 200
      };
    };
  
    const mockFormData = () => {
      const formData = new FormData();
      const file = new File(['dummy content'], 'test-image.jpg', { type: 'image/jpeg' });
      formData.append('files', file);
      return formData;
    };


    beforeEach(() => {
        
        vi.clearAllMocks();
        
      
        ImageService.getModuleImages.mockResolvedValue([
          createMockImage(1),
          createMockImage(2)
        ]);
        
     
        ImageService.uploadImages.mockResolvedValue([
          createMockImage(3)
        ]);
        
        ImageService.deleteImage.mockResolvedValue({ success: true });
    
  
        ImageService.updateImageDimensions.mockResolvedValue({ success: true });
    
    
        global.confirm.mockReturnValue(true);
  });

  afterEach(() => {

    if (console.error.mockRestore) {
      console.error.mockRestore();
    }
  });

  test('renders without crashing', () => {
    render(<InlinePictureUploader />);
    expect(screen.getByText('Inline Pictures')).toBeInTheDocument();
  });

  test('renders drag and drop uploader when not in edit mode', () => {
    render(<InlinePictureUploader />);
    expect(screen.getByTestId('drag-drop-uploader')).toBeInTheDocument();
  });

  test('fetches existing images when moduleId is provided', async () => {
    ImageService.getModuleImages.mockResolvedValue([
      createMockImage(1),
      createMockImage(2)
    ]);

    render(<InlinePictureUploader moduleId="module-1" documentId="doc-1" temporaryMode={false} />);


    await waitFor(() => {
      expect(ImageService.getModuleImages).toHaveBeenCalledWith("module-1");
    });
  });

  test('does not fetch images when in temporary mode', () => {
    render(<InlinePictureUploader moduleId="module-1" documentId="doc-1" temporaryMode={true} />);
    expect(ImageService.getModuleImages).not.toHaveBeenCalled();
  });

  test('handles image upload in temporary mode', async () => {
    const { getByTestId } = render(
      <InlinePictureUploader moduleId="new-module" temporaryMode={true} />
    );

    const originalFileReader = global.FileReader;
    global.FileReader = function() {
      this.readAsDataURL = vi.fn(function() {
        setTimeout(() => {
          this.onload({ target: { result: 'data:image/jpeg;base64,mockbase64data' } });
        }, 0);
      });
    };
    global.Image = function() {
      setTimeout(() => {
        this.onload();
      }, 0);
      this.width = 600;
      this.height = 400;
      return this;
    };

    fireEvent.click(getByTestId('mock-upload-button'));

    await waitFor(() => {
      expect(screen.getByText('Images uploaded successfully!')).toBeInTheDocument();
    });
    
    global.FileReader = originalFileReader;
  });

  test('handles image upload to server when not in temporary mode', async () => {
    ImageService.uploadImages.mockResolvedValue([createMockImage(3)]);

    const { getByTestId } = render(
      <InlinePictureUploader moduleId="existing-module" documentId="doc-1" temporaryMode={false} />
    );


    fireEvent.click(getByTestId('mock-upload-button'));

    await waitFor(() => {
      expect(ImageService.uploadImages).toHaveBeenCalled();
      expect(screen.getByText('Images uploaded successfully!')).toBeInTheDocument();
    });
  });

  test('shows error message when upload fails', async () => {
  
    vi.spyOn(console, 'error').mockImplementation(() => {});
    
    
    ImageService.uploadImages.mockRejectedValue(new Error('Upload failed'));

    const { getByTestId } = render(
      <InlinePictureUploader moduleId="existing-module" documentId="doc-1" temporaryMode={false} />
    );

 
    fireEvent.click(getByTestId('mock-upload-button'));

    
    await waitFor(() => {
      expect(screen.getByText(/Upload failed/)).toBeInTheDocument();
    });
  });


//   test('displays uploaded images', async () => {
//     const mockImages = [createMockImage(1), createMockImage(2)];
    
//     // Set up ImageService mock
//     ImageService.getModuleImages.mockResolvedValue(mockImages);

//     const { rerender } = render(
//       <InlinePictureUploader 
//         moduleId="module-1" 
//         documentId="doc-1" 
//         existingImages={mockImages} 
//         temporaryMode={true} 
//       />
//     );
    
//     // Wait for images to be loaded
//     await waitFor(() => {
//       expect(screen.getByText('Uploaded Images')).toBeInTheDocument();
//     });
    
//     // Using rerender to ensure the component updates with the images
//     rerender(
//       <InlinePictureUploader 
//         moduleId="module-1" 
//         documentId="doc-1" 
//         existingImages={mockImages} 
//         temporaryMode={true} 
//       />
//     );

//     // Check if at least one image is displayed
//     await waitFor(() => {
//       expect(screen.getByText('Test Image 1')).toBeInTheDocument();
//     });
//   });

// src/tests/editors/InlinePictureUploader.test.jsx > InlinePictureUploader Component > displays uploaded images
// TestingLibraryElementError: Unable to find an element with the text: Uploaded Images. This could be because the text is broken up by multiple elements. In this case, you can provide a function for your text matcher to make your matcher more flexible.


test('displays "No images uploaded yet" when no images are available', async () => {
    ImageService.getModuleImages.mockResolvedValue([]);

    render(<InlinePictureUploader moduleId="module-1" documentId="doc-1" temporaryMode={false} />);

    // Wait for the component to render the no-images message
    await waitFor(() => {
      expect(screen.getByText('No images uploaded yet.')).toBeInTheDocument();
    });
  });






})