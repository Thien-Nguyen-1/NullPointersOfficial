import { describe, test, expect, vi, beforeEach} from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import DocumentService from '../../services/DocumentService';
import DocumentUploader from '../../components/editors/DocumentUploader';
import { DocumentEditorWrapper } from '../../components/editors/DocumentUploader';


// Mock the DocumentService
vi.mock('../../services/DocumentService', () => ({
  default: {
    getModuleDocuments: vi.fn(),
    uploadDocuments: vi.fn(),
    deleteDocument: vi.fn()
  }
}));

// Mock react-icons
vi.mock('react-icons/fi', () => ({
  FiFile: () => <div data-testid="file-icon" />,
  FiTrash2: () => <div data-testid="trash-icon" />,
  FiDownload: () => <div data-testid="download-icon" />,
  FiCheckCircle: () => <div data-testid="success-icon" />,
  FiEye: () => <div data-testid="eye-icon" />
}));

// Mock the PDF Viewer component
vi.mock('../../components/PDFViewer', () => ({
  default: ({ documentUrl, documentName }) => (
    <div data-testid="pdf-viewer">
      <div>Viewing: {documentName}</div>
      <div>URL: {documentUrl}</div>
    </div>
  )
}));

// Mock the DragDropUploader component
vi.mock('../../components/editors/DragDropUploader', () => ({
  default: ({ onUpload }) => (
    <div data-testid="drag-drop-uploader">
      <button 
        data-testid="mock-upload-button" 
        onClick={() => {
          const formData = new FormData();
          const mockFile = new File(['test file content'], 'test.pdf', { type: 'application/pdf' });
          formData.append('files', mockFile);
          onUpload(formData);
        }}
      >
        Upload Files
      </button>
    </div>
  )
}));





describe('DocumentUploader Component', () => {
  const mockProps = {
    moduleId: 'module-123',
    documentId: 'doc-123',
    existingDocuments: [],
    allowDirectUpload: true
  };

  const mockDocuments = [
    {
      contentID: 'doc-123',
      filename: 'test-document.pdf',
      file_size: 1024 * 1024, // 1MB
      file_url: '/documents/test-document.pdf',
      upload_date: '2023-05-15T10:30:00Z',
      title: 'Test Document'
    }
  ];

  beforeEach(() => {
    vi.resetAllMocks();
    // Default mock implementations
    DocumentService.getModuleDocuments.mockResolvedValue([]);
    DocumentService.uploadDocuments.mockResolvedValue(mockDocuments);
    DocumentService.deleteDocument.mockResolvedValue({ success: true });

    // Mock window.confirm
    window.confirm = vi.fn().mockReturnValue(true);

    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  test('renders with no documents', async () => {
    render(<DocumentUploader {...mockProps} />);
    
    // Check that the component renders with basic elements
    expect(screen.getByText('Course Documents')).toBeInTheDocument();
    expect(screen.getByText('No documents uploaded yet.')).toBeInTheDocument();
    expect(screen.getByTestId('drag-drop-uploader')).toBeInTheDocument();
  });

  test('fetches documents on mount when moduleId is provided', async () => {
    DocumentService.getModuleDocuments.mockResolvedValue(mockDocuments);
    
    render(<DocumentUploader {...mockProps} />);
    
    await waitFor(() => {
      expect(DocumentService.getModuleDocuments).toHaveBeenCalledWith('module-123');
    });
  });

  test('does not fetch documents when in temporary mode', async () => {
    render(<DocumentUploader {...mockProps} temporaryMode={true} />);
    
    await waitFor(() => {
      expect(DocumentService.getModuleDocuments).not.toHaveBeenCalled();
    });
  });

  test('displays existing documents when provided', async () => {
    DocumentService.getModuleDocuments.mockResolvedValue(mockDocuments);
    
    render(<DocumentUploader {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
      expect(screen.queryByText('No documents uploaded yet.')).not.toBeInTheDocument();
    });
  });

  test('uploads documents in non-temporary mode', async () => {
    DocumentService.getModuleDocuments.mockResolvedValue([]);
    
    render(<DocumentUploader {...mockProps} />);
    
    // Trigger mock upload
    fireEvent.click(screen.getByTestId('mock-upload-button'));
    
    await waitFor(() => {
      expect(DocumentService.uploadDocuments).toHaveBeenCalled();
      expect(screen.getByText('Documents uploaded successfully!')).toBeInTheDocument();
    });
    
    // Check that the FormData sent to uploadDocuments includes the module_id
    const uploadCall = DocumentService.uploadDocuments.mock.calls[0][0];
    expect(uploadCall.get('module_id')).toBe('module-123');
    expect(uploadCall.get('component_id')).toBe('doc-123');
  });

  test('stores files locally in temporary mode', async () => {
    render(<DocumentUploader {...mockProps} temporaryMode={true} />);
    
    // Trigger mock upload
    fireEvent.click(screen.getByTestId('mock-upload-button'));
    
    await waitFor(() => {
      expect(DocumentService.uploadDocuments).not.toHaveBeenCalled();
      expect(screen.getByText('Documents uploaded successfully!')).toBeInTheDocument();
      
      // After uploading, the document should be displayed
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  test('deletes document when delete button is clicked', async () => {
    DocumentService.getModuleDocuments.mockResolvedValue(mockDocuments);
    
    render(<DocumentUploader {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });
    
    // Find and click delete button
    const deleteButtons = await screen.findAllByTestId('trash-icon');
    fireEvent.click(deleteButtons[0].closest('button'));
    
    // Confirm deletion
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this document?');
    
    await waitFor(() => {
      expect(DocumentService.deleteDocument).toHaveBeenCalledWith('doc-123');
    });
  });

  test('does not delete document if user cancels confirmation', async () => {
    DocumentService.getModuleDocuments.mockResolvedValue(mockDocuments);
  
    // Mock confirm to simulate user cancelling
    window.confirm = vi.fn().mockReturnValue(false);
  
    render(<DocumentUploader {...mockProps} />);
  
    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });
  
    // Find and click delete button
    const deleteButtons = await screen.findAllByTestId('trash-icon');
    fireEvent.click(deleteButtons[0].closest('button'));
  
    // Confirm deletion prompt was shown
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this document?');
  
    // Ensure deleteDocument was NOT called
    expect(DocumentService.deleteDocument).not.toHaveBeenCalled();
  
    // Optionally, assert the document is still visible
    expect(screen.getByText('Test Document')).toBeInTheDocument();
  });
  
  test('closes viewer if deleted document is currently being viewed', async () => {
    const matchingDocument = {
      contentID: 'doc-123', // Matches mockProps.documentId
      filename: 'test-document.pdf',
      file_size: 1024 * 1024,
      file_url: '/documents/test-document.pdf',
      upload_date: '2023-05-15T10:30:00Z',
      title: 'Test Document'
    };
  
    DocumentService.getModuleDocuments.mockResolvedValue([matchingDocument]);
  
    render(<DocumentUploader {...mockProps} />);
  
    // Wait for document to load
    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });
  
    // Open the viewer
    const viewButton = await screen.findByTestId('eye-icon');
    fireEvent.click(viewButton.closest('button'));
  
    // Verify the viewer is open
    await waitFor(() => {
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      expect(screen.getByText('Viewing: Test Document')).toBeInTheDocument();
    });
  
    // Click delete
    const deleteButton = await screen.findByTestId('trash-icon');
    fireEvent.click(deleteButton.closest('button'));
  
    // Wait for delete and viewer to close
    await waitFor(() => {
      expect(DocumentService.deleteDocument).toHaveBeenCalledWith('doc-123');
      expect(screen.queryByTestId('pdf-viewer')).not.toBeInTheDocument();
    });
  });


  test('shows error if document deletion fails', async () => {
    DocumentService.getModuleDocuments.mockResolvedValue(mockDocuments);
  
    // Mock confirm to simulate user confirming deletion
    window.confirm = vi.fn().mockReturnValue(true);
  
    // Force deleteDocument to throw an error
    const mockError = new Error('Server error');
    mockError.response = { data: { detail: 'Failed to delete document from server.' } };
    DocumentService.deleteDocument.mockRejectedValue(mockError);
  
    render(<DocumentUploader {...mockProps} />);
  
    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });
  
    const deleteButtons = await screen.findAllByTestId('trash-icon');
    fireEvent.click(deleteButtons[0].closest('button'));
  
    await waitFor(() => {
      expect(DocumentService.deleteDocument).toHaveBeenCalledWith('doc-123');
    });
  
    // Assert error message is shown
    expect(await screen.findByText(/Delete failed: Failed to delete document from server\./)).toBeInTheDocument();
  });
  
  

  test('opens PDF viewer when view button is clicked for PDF', async () => {
    DocumentService.getModuleDocuments.mockResolvedValue(mockDocuments);
    
    render(<DocumentUploader {...mockProps} />);
    
    await waitFor(() => {
      expect(screen.getByText('Test Document')).toBeInTheDocument();
    });
    
    // Find and click view button
    const viewButtons = await screen.findAllByTestId('eye-icon');
    fireEvent.click(viewButtons[0].closest('button'));
    
    await waitFor(() => {
      expect(screen.getByTestId('pdf-viewer')).toBeInTheDocument();
      expect(screen.getByText('Viewing: Test Document')).toBeInTheDocument();
    });
  });

  // test('initiates download when download button is clicked', async () => {
    test('initiates download when download button is clicked', async () => {
      DocumentService.getModuleDocuments.mockResolvedValue(mockDocuments);
      
      // Instead of mocking createElement, directly mock the fetch function
      global.fetch = vi.fn().mockImplementation(() => 
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(new Blob(['test content'], { type: 'application/pdf' }))
        })
      );
      
      // Also mock createObjectURL and createElement indirectly by mocking the entire download process
      const originalCreateElement = document.createElement;
      const clickMock = vi.fn();
      
      // We'll use this flag to check if our download logic was executed
      let downloadAttempted = false;
      
      // Create a spy on URL.createObjectURL to detect when it's called
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockImplementation(() => {
        downloadAttempted = true;
        return 'blob:mock-url';
      });
      
      render(<DocumentUploader {...mockProps} />);
      
      await waitFor(() => {
        expect(screen.getByText('Test Document')).toBeInTheDocument();
      });
      
      // Find and click download button
      const downloadButtons = await screen.findAllByTestId('download-icon');
      fireEvent.click(downloadButtons[0].closest('button'));
      
      // Wait for the download process to be initiated
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalled();
        expect(downloadAttempted).toBe(true);
        expect(URL.createObjectURL).toHaveBeenCalled();
      });
      
      // Restore mocks
      global.fetch.mockRestore();
      createObjectURLSpy.mockRestore();
    });

    

  // test('handles errors during document upload', async () => {
  //   DocumentService.uploadDocuments.mockRejectedValue(new Error('Upload failed'));
    
  //   render(<DocumentUploader {...mockProps} />);
    
  //   // Trigger mock upload
  //   fireEvent.click(screen.getByTestId('mock-upload-button'));
    
  //   await waitFor(() => {
  //     expect(screen.getByText(/Upload failed/)).toBeInTheDocument();
  //   });
  // });

  test('handles document deletion in temporary mode', async () => {
    render(<DocumentUploader {...mockProps} temporaryMode={true} />);
    
    // Trigger mock upload to add a temporary file
    fireEvent.click(screen.getByTestId('mock-upload-button'));
    
    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
    
    // Find and click delete button
    const deleteButtons = await screen.findAllByTestId('trash-icon');
    fireEvent.click(deleteButtons[0].closest('button'));
    
    // Confirm deletion
    expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this document?');
    
    await waitFor(() => {
      expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
      // In temporary mode, we don't call the delete API
      expect(DocumentService.deleteDocument).not.toHaveBeenCalled();
    });
  });
  
  // test('formats file size correctly', async () => {
  //   const documents = [
  //     {
  //       contentID: 'doc-1',
  //       filename: 'small.pdf',
  //       file_size: 1024, // 1KB
  //       file_url: '/documents/small.pdf',
  //       upload_date: '2023-05-15T10:30:00Z'
  //     },
  //     {
  //       contentID: 'doc-2',
  //       filename: 'medium.pdf',
  //       file_size: 1024 * 1024, // 1MB
  //       file_url: '/documents/medium.pdf',
  //       upload_date: '2023-05-15T10:30:00Z'
  //     }
  //   ];
    
  //   DocumentService.getModuleDocuments.mockResolvedValue(documents);
    
  //   render(<DocumentUploader {...mockProps} />);
    
  //   await waitFor(() => {
  //     expect(screen.getByText(/1 KB/)).toBeInTheDocument();
  //     expect(screen.getByText(/1 MB/)).toBeInTheDocument();
  //   });
  // });  FIX THIS

  test('uses ref to access tempFiles', async () => {
    const ref = React.createRef();
    
    render(<DocumentUploader ref={ref} {...mockProps} temporaryMode={true} />);
    
    // Initially should have no temp files
    expect(ref.current.getTempFiles()).toEqual([]);
    
    // Trigger mock upload
    fireEvent.click(screen.getByTestId('mock-upload-button'));
    
    await waitFor(() => {
      // Should now have one temp file
      const tempFiles = ref.current.getTempFiles();
      expect(tempFiles.length).toBe(1);
      expect(tempFiles[0].filename).toBe('test.pdf');
    });
    
    // Test setTempFiles
    const newTempFiles = [{
      id: 'test-123',
      file: new File(['test content'], 'manual.pdf', { type: 'application/pdf' }),
      filename: 'manual.pdf'
    }];
    
    ref.current.setTempFiles(newTempFiles);
    
    await waitFor(() => {
      const currentTempFiles = ref.current.getTempFiles();
      expect(currentTempFiles.length).toBe(1);
      expect(currentTempFiles[0].filename).toBe('manual.pdf');
    });
  });

  test('stores files locally in temporary mode', async () => {
    // Modify documentId to start with "new-"
    const modifiedProps = { 
      ...mockProps, 
      documentId: 'new-temp-doc-123' 
    };
  
    render(<DocumentUploader {...modifiedProps} temporaryMode={true} />);
    
    // Trigger mock upload
    fireEvent.click(screen.getByTestId('mock-upload-button'));
    
    await waitFor(() => {
      expect(DocumentService.uploadDocuments).not.toHaveBeenCalled();
      expect(screen.getByText('Documents uploaded successfully!')).toBeInTheDocument();
      
      // After uploading, the document should be displayed
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });
  

  
  
  
  

  test('DocumentEditorWrapper forwards ref and exposes getTempFiles/setTempFiles', async () => {
    const wrapperRef = React.createRef();
  
    render(<DocumentEditorWrapper ref={wrapperRef} moduleId="module-456" documentId="doc-456" temporaryMode={true} />);
    
    
    expect(wrapperRef.current.getTempFiles()).toEqual([]);
  

    await act(async () => fireEvent.click(screen.getByTestId('mock-upload-button')));
  
    await waitFor(() => {
      const tempFiles = wrapperRef.current.getTempFiles();
      expect(tempFiles.length).toBe(1);
  
    });
  

    const customFile = new File(['custom content'], 'custom.pdf', { type: 'application/pdf' });
    const newTempFiles = [{
      id: 'custom-id',
      file: customFile,
      filename: 'custom.pdf',
      file_url: 'blob:custom-url'
    }];
  
    wrapperRef.current.setTempFiles(newTempFiles);
  
    await waitFor(() => {
      const updatedFiles = wrapperRef.current.getTempFiles();
       expect(updatedFiles.length).toBe(1);
      
    });
  });
  
});


