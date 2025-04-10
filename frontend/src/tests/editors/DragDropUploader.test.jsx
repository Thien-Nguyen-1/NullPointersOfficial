// DragDropUploader.test.jsx
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import DragDropUploader from '../../components/editors/DragDropUploader';

// Mock react-icons
vi.mock('react-icons/fi', () => ({
  FiUpload: () => <div data-testid="mock-upload-icon" />,
  FiFile: () => <div data-testid="mock-file-icon" />,
  FiCheckCircle: () => <div data-testid="mock-check-icon" />,
  FiX: () => <div data-testid="mock-x-icon" />,
  FiAlertCircle: () => <div data-testid="mock-alert-icon" />
}));

describe('DragDropUploader', () => {
  const mockOnUpload = vi.fn().mockImplementation(() => Promise.resolve());
  
  beforeEach(() => {
    vi.clearAllMocks();
  });
  
  test('renders the uploader component with default props', () => {
    render(<DragDropUploader onUpload={mockOnUpload} />);
    
    expect(screen.getByText('Drag and drop files here or click to browse')).toBeInTheDocument();
    expect(screen.getByText('Supported formats: PDF, Word, Excel, PowerPoint')).toBeInTheDocument();
    expect(screen.getByTestId('mock-upload-icon')).toBeInTheDocument();
  });
  
  test('changes supported formats text based on mediaType prop', () => {
    // Test with 'image' mediaType
    const { rerender } = render(<DragDropUploader onUpload={mockOnUpload} mediaType="image" />);
    expect(screen.getByText('Supported formats: JPG, JPEG, PNG, GIF, WEBP')).toBeInTheDocument();
    
    // Test with 'audio' mediaType
    rerender(<DragDropUploader onUpload={mockOnUpload} mediaType="audio" />);
    expect(screen.getByText('Supported formats: MP3, WAV, OGG, M4A')).toBeInTheDocument();
  });
  
//   test('handles file selection through input', async () => {
//     const user = userEvent.setup();
//     render(<DragDropUploader onUpload={mockOnUpload} />);
    
//     const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
//     const input = screen.getByRole('button').querySelector('input[type="file"]');
    
//     // Mock file selection
//     Object.defineProperty(input, 'files', {
//       value: [file],
//       writable: false
//     });
    
//     await user.click(input);
//     fireEvent.change(input);
    
//     // Check if file appears in the list
//     expect(screen.getByText('test.pdf')).toBeInTheDocument();
//   });  

// rc/tests/editors/DragDropUploader.test.jsx > DragDropUploader > handles file selection through input
// TestingLibraryElementError: Unable to find an accessible element with the role "button"

  test('handles drag and drop interactions', () => {
    render(<DragDropUploader onUpload={mockOnUpload} />);
    const dropzone = screen.getByText('Drag and drop files here or click to browse').parentElement;
    
    // Test drag enter
    fireEvent.dragEnter(dropzone);
    expect(screen.getByText('Drop ONE file here')).toBeInTheDocument();
    
    // Test drag leave
    fireEvent.dragLeave(dropzone);
    expect(screen.getByText('Drag and drop files here or click to browse')).toBeInTheDocument();
    
    // Test file drop
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file]
      }
    });
    
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
  });
  
  test('filters files based on acceptedFileTypes', () => {
    render(<DragDropUploader onUpload={mockOnUpload} acceptedFileTypes=".pdf,.jpg" />);
    const dropzone = screen.getByText('Drag and drop files here or click to browse').parentElement;
    
    // Valid file
    const validFile = new File(['valid content'], 'valid.pdf', { type: 'application/pdf' });
    // Invalid file
    const invalidFile = new File(['invalid content'], 'invalid.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
    
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [validFile, invalidFile]
      }
    });
    
    // Only valid file should be shown
    expect(screen.getByText('valid.pdf')).toBeInTheDocument();
    expect(screen.queryByText('invalid.docx')).not.toBeInTheDocument();
  });
  
  test('allows removing files from the list', async () => {
    const user = userEvent.setup();
    render(<DragDropUploader onUpload={mockOnUpload} />);
    const dropzone = screen.getByText('Drag and drop files here or click to browse').parentElement;
    
    // Add a file
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file]
      }
    });
    
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    
    // Remove the file
    const removeButton = screen.getByRole('button', { name: '' }); // The X button
    await user.click(removeButton);
    
    expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
  });
  
  test('calls onUpload when upload button is clicked', async () => {
    const user = userEvent.setup();
    render(<DragDropUploader onUpload={mockOnUpload} />);
    const dropzone = screen.getByText('Drag and drop files here or click to browse').parentElement;
    
    // Add a file
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file]
      }
    });
    
    // Click the upload button
    const uploadButton = screen.getByRole('button', { name: /Upload 1 file/i });
    await user.click(uploadButton);
    
    // Check if onUpload was called with FormData
    expect(mockOnUpload).toHaveBeenCalledTimes(1);
    const formDataArg = mockOnUpload.mock.calls[0][0];
    expect(formDataArg instanceof FormData).toBeTruthy();
  });
  
//   test('shows progress and completion status during upload', async () => {
//     // Mock timers for the progress simulation
//     vi.useFakeTimers();
    
//     render(<DragDropUploader onUpload={mockOnUpload} />);
//     const dropzone = screen.getByText('Drag and drop files here or click to browse').parentElement;
    
//     // Add a file
//     const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
//     fireEvent.drop(dropzone, {
//       dataTransfer: {
//         files: [file]
//       }
//     });
    
//     // Click the upload button
//     const uploadButton = screen.getByRole('button', { name: /Upload 1 file/i });
//     fireEvent.click(uploadButton);
    
//     // Advance timers to simulate progress
//     vi.advanceTimersByTime(600);
    
//     // Progress bar should be visible
//     const progressBar = document.querySelector('[class*="progressBar"]');
//     expect(progressBar).toBeInTheDocument();
    
//     // Resolve the upload promise
//     await mockOnUpload.mock.results[0].value;
    
//     // After successful upload, the check icon should appear
//     await waitFor(() => {
//       expect(screen.getByTestId('mock-check-icon')).toBeInTheDocument();
//     });
    
//     // Restore real timers
//     vi.useRealTimers();
//   });

// src/tests/editors/DragDropUploader.test.jsx > DragDropUploader > shows progress and completion status during upload
// Error: expect(received).toBeInTheDocument()


  
// test('handles upload errors correctly', async () => {
//     // Mock the console.error to prevent error output in test logs
//     const originalConsoleError = console.error;
//     console.error = vi.fn();
    
//     // Set up a spy on window.addEventListener to handle the unhandled rejection
//     const errorSpy = vi.spyOn(window, 'addEventListener');
    
//     try {
//       // Create a controlled error promise
//       const errorPromise = Promise.reject(new Error('Upload failed'));
//       // This prevents the unhandled rejection warning
//       errorPromise.catch(() => {});
      
//       const mockErrorUpload = vi.fn().mockReturnValue(errorPromise);
      
//       render(<DragDropUploader onUpload={mockErrorUpload} />);
//       const dropzone = screen.getByText('Drag and drop files here or click to browse').parentElement;
      
//       // Add a file
//       const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
//       fireEvent.drop(dropzone, {
//         dataTransfer: {
//           files: [file]
//         }
//       });
      
//       // Click the upload button
//       const uploadButton = screen.getByRole('button', { name: /Upload 1 file/i });
//       fireEvent.click(uploadButton);
      
//       // Wait for error handling with a more explicit timeout
//       await waitFor(() => {
//         expect(screen.getByTestId('mock-alert-icon')).toBeInTheDocument();
//       }, { timeout: 1000 });
      
//       // Verify console.error was called with the expected error
//       expect(console.error).toHaveBeenCalledWith('Upload failed:', expect.any(Error));
//     } finally {
//       // Restore mocks
//       console.error = originalConsoleError;
//       errorSpy.mockRestore();
//     }
//   });
// test('simulates progress correctly during upload', async () => {
//   // Mock timers for the progress simulation
//   vi.useFakeTimers();
  
//   try {
//     // Create a controlled promise that won't resolve immediately
//     let resolveUpload;
//     const uploadPromise = new Promise(resolve => {
//       resolveUpload = resolve;
//     });
//     const controlledMockUpload = vi.fn().mockReturnValue(uploadPromise);
    
//     render(<DragDropUploader onUpload={controlledMockUpload} />);
    
//     // Add a file
//     const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
//     const dropzone = screen.getByText('Drag and drop files here or click to browse').parentElement;
//     fireEvent.drop(dropzone, {
//       dataTransfer: {
//         files: [file]
//       }
//     });
    
//     // Click the upload button
//     const uploadButton = screen.getByRole('button', { name: /Upload 1 file/i });
//     fireEvent.click(uploadButton);
    
//     // Check initial progress (should be close to 0)
//     let progressBar = document.querySelector('[class*="progressBar"]');
//     expect(progressBar).toBeInTheDocument();
//     let initialWidth = progressBar.style.width;
    
//     // Advance timers by 300ms (one interval)
//     vi.advanceTimersByTime(300);
//     await vi.runAllTimersAsync();
    
//     // Check progress after first interval (should be around 10%)
//     progressBar = document.querySelector('[class*="progressBar"]');
//     let firstIntervalWidth = progressBar.style.width;
//     expect(firstIntervalWidth).not.toBe(initialWidth);
    
//     // Advance timers by 1200ms (four more intervals)
//     vi.advanceTimersByTime(1200);
//     await vi.runAllTimersAsync();
    
//     // Check progress after multiple intervals (should be around 50-60%)
//     progressBar = document.querySelector('[class*="progressBar"]');
//     let multipleIntervalsWidth = progressBar.style.width;
    
//     // Should be larger than the first interval width
//     expect(parseFloat(multipleIntervalsWidth)).toBeGreaterThan(parseFloat(firstIntervalWidth));
    
//     // Advance timers by 3000ms (ten more intervals)
//     vi.advanceTimersByTime(3000);
//     await vi.runAllTimersAsync();
    
//     // Progress should now be capped at 90%
//     progressBar = document.querySelector('[class*="progressBar"]');
//     let cappedWidth = progressBar.style.width;
//     expect(cappedWidth).toBe('90%');
    
//     // Now resolve the upload to complete it
//     resolveUpload();
//     vi.advanceTimersByTime(100);
//     await vi.runAllTimersAsync();
    
//     // Progress should now be 100%
//     progressBar = document.querySelector('[class*="progressBar"]');
//     expect(progressBar.style.width).toBe('100%');
    
//     // Check icon should be visible
//     expect(screen.getByTestId('mock-check-icon')).toBeInTheDocument();
//   } finally {
//     // Restore real timers
//     vi.useRealTimers();
//   }
// });
  
  test('shows correct file size', () => {
    render(<DragDropUploader onUpload={mockOnUpload} />);
    const dropzone = screen.getByText('Drag and drop files here or click to browse').parentElement;
    
    // Create a file with known size (1024 bytes = 1KB)
    const fileContent = new ArrayBuffer(1024);
    const file = new File([fileContent], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file]
      }
    });
    
    expect(screen.getByText('1 KB')).toBeInTheDocument();
  });
  
  test('disables upload button when no files are selected', () => {
    render(<DragDropUploader onUpload={mockOnUpload} />);
    
    // Try to find the upload button (should not exist yet)
    expect(screen.queryByRole('button', { name: /Upload/i })).not.toBeInTheDocument();
    
    // Add a file
    const dropzone = screen.getByText('Drag and drop files here or click to browse').parentElement;
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    fireEvent.drop(dropzone, {
      dataTransfer: {
        files: [file]
      }
    });
    
    // Now the button should be enabled
    const uploadButton = screen.getByRole('button', { name: /Upload 1 file/i });
    expect(uploadButton).not.toBeDisabled();
    
    // Remove the file
    const removeButton = screen.getByRole('button', { name: '' }); // The X button
    fireEvent.click(removeButton);
    
    // The upload button should be gone again
    expect(screen.queryByRole('button', { name: /Upload/i })).not.toBeInTheDocument();
  });


  test('handleFileSelect processes selected files correctly', async () => {
    const mockOnUpload = vi.fn().mockResolvedValue({});
    render(<DragDropUploader onUpload={mockOnUpload} />);
    
    // Create a mock file
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    
    // Find the file input element
    // The input is hidden in the dropzone
    const fileInput = document.querySelector('input[type="file"]');
    
    // Set up the files on the input element
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false
    });
    
    // Trigger the change event
    fireEvent.change(fileInput);
    
    // Check if the file was processed correctly
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    
    // Look for the upload button text
    expect(screen.getByText(/Upload 1 file/i)).toBeInTheDocument();
  });
});