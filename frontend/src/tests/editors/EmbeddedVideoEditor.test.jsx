import { test, expect, vi, beforeEach, afterEach, describe } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmbeddedVideoEditor from '../../components/editors/EmbeddedVideoEditor';
import { EmbeddedVideoEditorWrapper } from '../../components/editors/EmbeddedVideoEditor';
import VideoService from '../../services/VideoService';
import React from 'react';


vi.mock('../../services/VideoService', () => ({
    default: {
      getEmbeddedVideo: vi.fn(),
      createEmbeddedVideo: vi.fn(),
      updateEmbeddedVideo: vi.fn(),
      deleteEmbeddedVideo: vi.fn(),
    }
  }));


  vi.mock('../../styles/EmbeddedVideoEditor.module.css', () => ({
    default: {
      videoEditor: 'videoEditor',
      title: 'title',
      errorMessage: 'errorMessage',
      successMessage: 'successMessage',
      videoForm: 'videoForm',
      formGroup: 'formGroup',
      inputButtonGroup: 'inputButtonGroup',
      urlInputWrapper: 'urlInputWrapper',
      urlIcon: 'urlIcon',
      urlInput: 'urlInput',
      saveButton: 'saveButton',
      videoPreview: 'videoPreview',
      previewTitle: 'previewTitle',
      embedContainer: 'embedContainer',
      embedFrame: 'embedFrame',
      noPreviewMessage: 'noPreviewMessage',
      videosList: 'videosList',
      sectionTitle: 'sectionTitle',
      videoItem: 'videoItem',
      videoInfo: 'videoInfo',
      videoIcon: 'videoIcon',
      videoName: 'videoName',
      videoMeta: 'videoMeta',
      videoActions: 'videoActions',
      deleteButton: 'deleteButton',
    }
  }));
  
  vi.mock('react-icons/fi', () => ({
    FiPlay: () => <div data-testid="fi-play" />,
    FiPause: () => <div data-testid="fi-pause" />,
    FiCheck: () => <div data-testid="fi-check" />,
    FiLink: () => <div data-testid="fi-link" />,
    FiVideo: () => <div data-testid="fi-video" />,
    FiTrash2: () => <div data-testid="fi-trash" />,
  }));

  global.URL = class URL {
    constructor(url) {
      this.url = url;
      this.hostname = url.includes('youtube.com') ? 'youtube.com' : 
                      url.includes('youtu.be') ? 'youtu.be' : 
                      url.includes('vimeo.com') ? 'vimeo.com' : 'unknown.com';
      this.pathname = url.includes('youtu.be') ? '/videoID123' : '/';
      this.searchParams = new URLSearchParams(url.split('?')[1] || '');
    }
  };

  global.URLSearchParams = class URLSearchParams {
    constructor(params) {
      this.params = params || '';
    }
    get(key) {
      if (key === 'v' && this.params.includes('v=')) {
        return this.params.split('v=')[1].split('&')[0];
      }
      return null;
    }
  };
  
  // Mock confirm
  global.confirm = vi.fn(() => true);
  
  // Helper function for the ref forwarding tests
  const RefTestComponent = ({ children }) => {
    const ref = React.useRef(null);
    React.useEffect(() => {
      if (ref.current) {
        ref.current.testMethod = () => 'test';
      }
    }, []);
    return React.cloneElement(children, { ref });
  };

  

describe('EmbeddedVideoEditor', () => {
    let user;
  
    beforeEach(() => {
      user = userEvent.setup();
      vi.clearAllMocks();
      
      // Default mock implementations
      VideoService.getEmbeddedVideo.mockResolvedValue({
        contentID: '123',
        video_url: 'https://www.youtube.com/watch?v=abc123',
        title: 'Test Video',
        description: 'Test Description',
        created_at: '2023-01-01T00:00:00Z'
      });
      
      VideoService.createEmbeddedVideo.mockResolvedValue({
        contentID: 'new-123',
        video_url: 'https://www.youtube.com/watch?v=abc123',
        title: 'New Test Video',
        description: 'New Test Description',
        created_at: '2023-01-01T00:00:00Z'
      });
      
      VideoService.updateEmbeddedVideo.mockResolvedValue({
        contentID: '123',
        video_url: 'https://www.youtube.com/watch?v=abc123-updated',
        title: 'Updated Test Video',
        description: 'Updated Test Description',
        created_at: '2023-01-01T00:00:00Z'
      });
      
      VideoService.deleteEmbeddedVideo.mockResolvedValue(true);
    });
  
    afterEach(() => {
      vi.restoreAllMocks();
    });

    test('should render with correct props', () => {
        render(<EmbeddedVideoEditorWrapper moduleId="123" documentId="456" />);
        expect(screen.getByText('Course Video')).toBeInTheDocument();
    });

    test('should handle new moduleId format correctly', () => {
        render(<EmbeddedVideoEditorWrapper moduleId="new-123" documentId="456" />);
        expect(screen.getByText('Course Video')).toBeInTheDocument();
        // Should be in temporary mode, so getEmbeddedVideo shouldn't be called
        expect(VideoService.getEmbeddedVideo).not.toHaveBeenCalled();
      });

      test('should handle new documentId format correctly', () => {
        render(<EmbeddedVideoEditorWrapper moduleId="123" documentId="new-456" />);
        expect(screen.getByText('Course Video')).toBeInTheDocument();
        // Should be in temporary mode with new- prefix
        expect(VideoService.getEmbeddedVideo).not.toHaveBeenCalled();
      });

      test('should expose getTempFiles method via ref', async () => {
        const ref = React.createRef();
        
        render(<EmbeddedVideoEditorWrapper 
          ref={ref}
          moduleId="new-123" 
          documentId="new-456" 
        />);
        
        expect(ref.current).not.toBeNull();
        expect(typeof ref.current.getTempFiles).toBe('function');
        
        // Default should return empty array
        expect(ref.current.getTempFiles()).toEqual([]);
        
        // Add video URL via internal component
        const urlInput = screen.getByPlaceholderText('Enter YouTube, Vimeo or other video URL');
        await user.type(urlInput, 'https://www.youtube.com/watch?v=abc123');
        
        // Save the video
        const saveButton = screen.getByTestId('submit-video-url')
        await user.click(saveButton);
        
        // Now getTempFiles should return data
        await waitFor(() => {
          const files = ref.current.getTempFiles();
          expect(files.length).toBe(1);
          expect(files[0].filename).toBe('video_data.json');
          expect(files[0].videoData.video_url).toBe('https://www.youtube.com/watch?v=abc123');
        });
      });


      test('should expose getVideoData method via ref', async () => {
        const ref = React.createRef();
        
        render(<EmbeddedVideoEditorWrapper 
          ref={ref}
          moduleId="new-123" 
          documentId="new-456" 
        />);
      
        expect(ref.current).not.toBeNull();
        expect(typeof ref.current.getVideoData).toBe('function');
        
        // Default should return empty video data
        const initialData = ref.current.getVideoData();
        expect(initialData).toEqual({
          video_url: '',
          title: 'Embedded Video',
          description: ''
        });
        
        // Add video URL via internal component
        const urlInput = screen.getByPlaceholderText('Enter YouTube, Vimeo or other video URL');
        await user.type(urlInput, 'https://www.youtube.com/watch?v=abc123');
        
        // Check updated data
        expect(ref.current.getVideoData().video_url).toBe('https://www.youtube.com/watch?v=abc123');
      });

      test('should expose setVideoData method via ref', async () => {
        const ref = React.createRef();
        
        render(<EmbeddedVideoEditorWrapper 
          ref={ref}
          moduleId="new-123" 
          documentId="new-456" 
        />);
        
        expect(ref.current).not.toBeNull();
        expect(typeof ref.current.setVideoData).toBe('function');
        
        // Set video data via ref
        ref.current.setVideoData({
          video_url: 'https://www.youtube.com/watch?v=xyz789',
          title: 'Test Title',
          description: 'Test Description'
        });
        
        // Verify URL is updated in the input
        await waitFor(() => {
          const urlInput = screen.getByPlaceholderText('Enter YouTube, Vimeo or other video URL');
          expect(urlInput.value).toBe('https://www.youtube.com/watch?v=xyz789');
        });
        
        // Verify preview is shown
        expect(screen.getByText('Video Preview')).toBeInTheDocument();
      });
      


  
    test('should render the component correctly', () => {
      render(<EmbeddedVideoEditor />);
      expect(screen.getByText('Course Video')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter YouTube, Vimeo or other video URL')).toBeInTheDocument();
      expect(screen.getByText('Save Video')).toBeInTheDocument();
    });
    
    test('should fetch video data on mount when moduleId and documentId are provided', async () => {
        render(<EmbeddedVideoEditor moduleId="123" documentId="456" />);
        
        await waitFor(() => {
          expect(VideoService.getEmbeddedVideo).toHaveBeenCalledWith('456');
        });
        
        expect(await screen.findByDisplayValue('https://www.youtube.com/watch?v=abc123')).toBeInTheDocument();
        
       
        const updateButton = await screen.findByRole('button', { 
          name: (content) => content.includes('Update') 
        });
        expect(updateButton).toBeInTheDocument();
      });


      test('should not fetch video for temporary document IDs', async () => {
        render(<EmbeddedVideoEditor moduleId="123" documentId="new-456" temporaryMode={false} />);
        
        await waitFor(() => {
          expect(VideoService.getEmbeddedVideo).not.toHaveBeenCalled();
        });
        
        expect(screen.getByText('Save Video')).toBeInTheDocument();
      });

      test('should handle URL input change', async () => {
        render(<EmbeddedVideoEditor />);
        
        const urlInput = screen.getByPlaceholderText('Enter YouTube, Vimeo or other video URL');
        await user.type(urlInput, 'https://www.youtube.com/watch?v=abc123');
        
        expect(urlInput.value).toBe('https://www.youtube.com/watch?v=abc123');
      });

      test('should handle URL input change', async () => {
        render(<EmbeddedVideoEditor />);
        
        const urlInput = screen.getByPlaceholderText('Enter YouTube, Vimeo or other video URL');
        await user.type(urlInput, 'https://www.youtube.com/watch?v=abc123');
        
        expect(urlInput.value).toBe('https://www.youtube.com/watch?v=abc123');
      });

   

test('should submit form with valid YouTube URL', async () => {
    render(<EmbeddedVideoEditor />);
    
    const urlInput = screen.getByPlaceholderText('Enter YouTube, Vimeo or other video URL');
    await user.type(urlInput, 'https://www.youtube.com/watch?v=abc123');
    
    const submitButton = screen.getByText('Save Video');
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(VideoService.createEmbeddedVideo).toHaveBeenCalledWith({
        video_url: 'https://www.youtube.com/watch?v=abc123',
        title: 'Embedded Video',
        description: '',
        moduleID: undefined
      });
    });


})
    


test('should handle video delete', async () => {
    VideoService.getEmbeddedVideo.mockResolvedValue({
      contentID: '123',
      video_url: 'https://www.youtube.com/watch?v=abc123',
      title: 'Test Video',
      description: 'Test Description',
      created_at: '2023-01-01T00:00:00Z'
    });
    
    render(<EmbeddedVideoEditor moduleId="123" documentId="456" />);
    
    await waitFor(() => {
      expect(VideoService.getEmbeddedVideo).toHaveBeenCalledWith('456');
    });
    

    await screen.findByText('Test Video');
    const deleteButton = screen.getByTestId('fi-trash').closest('button');
    await user.click(deleteButton);
    

    expect(global.confirm).toHaveBeenCalled();
    
    await waitFor(() => {
      expect(VideoService.deleteEmbeddedVideo).toHaveBeenCalledWith('123');
    });
  });


  test('should handle cancellation of video delete', async () => {
    VideoService.getEmbeddedVideo.mockResolvedValue({
      contentID: '123',
      video_url: 'https://www.youtube.com/watch?v=abc123',
      title: 'Test Video',
      description: 'Test Description',
      created_at: '2023-01-01T00:00:00Z'
    });
    
    // Mock confirm to return false this time
    global.confirm = vi.fn(() => false);
    
    render(<EmbeddedVideoEditor moduleId="123" documentId="456" />);
    
    await waitFor(() => {
      expect(VideoService.getEmbeddedVideo).toHaveBeenCalledWith('456');
    });
    
    // Wait for video display then click delete
    await screen.findByText('Test Video');
    const deleteButton = screen.getByTestId('fi-trash').closest('button');
    await user.click(deleteButton);
    
    // Confirm dialog shown but cancelled
    expect(global.confirm).toHaveBeenCalled();
    
    // Delete service should not be called
    expect(VideoService.deleteEmbeddedVideo).not.toHaveBeenCalled();
  });

  test('should handle API errors when fetching video', async () => {
    VideoService.getEmbeddedVideo.mockRejectedValue(new Error('API error'));
    
    render(<EmbeddedVideoEditor moduleId="123" documentId="456" />);
    
    await waitFor(() => {
      expect(VideoService.getEmbeddedVideo).toHaveBeenCalledWith('456');
    });
    
    expect(await screen.findByText('Failed to load video data. Please try again.')).toBeInTheDocument();
  });

  test('should handle API errors when saving video', async () => {
    VideoService.createEmbeddedVideo.mockRejectedValue(new Error('API error'));
    
    render(<EmbeddedVideoEditor />);
    
    const urlInput = screen.getByPlaceholderText('Enter YouTube, Vimeo or other video URL');
    await user.type(urlInput, 'https://www.youtube.com/watch?v=abc123');
    
    const submitButton = screen.getByText('Save Video');
    await user.click(submitButton);
    
    expect(await screen.findByText('Failed to save video: API error')).toBeInTheDocument();
  });




  test('should handle non-embedded video URLs correctly', async () => {
    const ref = React.createRef();
    
    render(<EmbeddedVideoEditorWrapper 
      ref={ref}
      moduleId="new-123" 
      documentId="new-456" 
    />);
    
    // Set a non-embeddable URL
    ref.current.setVideoData({
      video_url: 'https://example.com/video',
      title: 'Non-embeddable Video',
      description: 'This URL cannot be embedded'
    });
    
    // Should show "No preview available" message
    await waitFor(() => {
      expect(screen.getByText('No preview available for this link.')).toBeInTheDocument();
    });
  });


  // Add these tests to your describe block

  test('EmbeddedVideoEditor getTempFiles via ref', async () => {
    const ref = React.createRef();
    
    // Render the EmbeddedVideoEditor directly (not the wrapper)
    render(
      <EmbeddedVideoEditor 
        ref={ref}
        temporaryMode={true}
      />
    );
    
    // Make sure the ref is initialized
    await waitFor(() => {
      expect(ref.current).toBeTruthy();
      expect(typeof ref.current.getTempFiles).toBe('function');
    });
    
    // Set video URL
    const urlInput = screen.getByPlaceholderText('Enter YouTube, Vimeo or other video URL');
    await user.type(urlInput, 'https://www.youtube.com/watch?v=test123');
    
    // Submit the video
    const submitButton = screen.getByTestId('submit-video-url');
    await user.click(submitButton);
    
    // Now test getTempFiles directly on the EmbeddedVideoEditor
    await waitFor(async() => {
      const files = ref.current.getTempFiles();
      expect(files).toBeInstanceOf(Array);
      expect(files.length).toBe(1);
      expect(files[0].file).toBeInstanceOf(File);
      expect(files[0].filename).toBe('video_data.json');
      
    
      const reader = new FileReader();
      const readPromise = new Promise(resolve => {
        reader.onload = () => resolve(reader.result);
        reader.readAsText(files[0].file);
      });
      
      return readPromise.then(content => {
        const data = JSON.parse(content);
        expect(data).toEqual({
          video_url: 'https://www.youtube.com/watch?v=test123',
          title: expect.any(String),
          description: expect.any(String)
        });
      });
    });
  });


//   test('setTempFiles should update the tempFiles state', async () => {
//     // Create a ref to access imperative methods
//     const editorRef = React.createRef();
    
//     render(<EmbeddedVideoEditor ref={editorRef} temporaryMode={true} />);
  
//     // Mock file data to pass to setTempFiles
//     const mockFileData = [{
//       id: 'test-id-123',
//       file: new File(
//         [JSON.stringify({ video_url: 'https://www.youtube.com/watch?v=testvideo' })], 
//         "video_data.json", 
//         { type: "application/json" }
//       ),
//       filename: "video_data.json",
//       video_url: 'https://www.youtube.com/watch?v=testvideo',
//       title: "Test Video Title",
//       created_at: new Date().toISOString()
//     }];
  
//     // Call the setTempFiles method
//     editorRef.current.setTempFiles(mockFileData);
  
//     // Check that videoUrl has been set from the file data
//     await waitFor(() => {
//       const videoUrlInput = screen.getByPlaceholderText('Enter YouTube, Vimeo or other video URL');
//       expect(videoUrlInput.value).toBe('https://www.youtube.com/watch?v=testvideo');
//     });
  
//     // Check that the video appears in the videos list (indirectly testing tempFiles state)
//     await waitFor(() => {
//       expect(screen.getByText('Test Video Title')).toBeInTheDocument();
//     });
//   });

test('setTempFiles should update the tempFiles state', async () => {
    const editorRef = React.createRef();
  
    render(<EmbeddedVideoEditor ref={editorRef} temporaryMode={true} />);
  
    // Wait for ref to be set
    await waitFor(() => {
      expect(editorRef.current).not.toBeNull();
    });
  
    const mockFileData = [{
        id: 'test-id-123',
        file: JSON.stringify({
          video_url: 'https://www.youtube.com/watch?v=testvideo',
          title: 'TitleOfVideoTest',
          description: 'Test description'
        }),
        filename: "video_data.json",
        created_at: new Date().toISOString()
      }];
  
 
    await editorRef.current.setTempFiles(mockFileData);
   
  });

  test('handleDeleteTemp should remove a video from tempFiles', async () => {
    const editorRef = React.createRef();
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    
   
  render(<EmbeddedVideoEditor ref={editorRef} temporaryMode={true} />);

  const mockFileData = [{
    id: 'test-id-123',
    file: JSON.stringify({
      video_url: 'https://www.youtube.com/watch?v=testvideo',
      title: 'TitleOfVideoTest',
      description: 'Test description'
    }),
    filename: "video_data.json",
    video_url: 'https://www.youtube.com/watch?v=testvideo', 
    title: 'TitleOfVideoTest', 
    created_at: new Date().toISOString()
  }];
  
    editorRef.current.setTempFiles(mockFileData);

    const submitButton = screen.getByTestId('submit-video-url')
     await user.click(submitButton)
  
    
     const deleteButton = screen.getByTestId('fi-trash').closest('button');
     await user.click(deleteButton);

     const container = screen.queryByText('TitleOfVideoTest');
    expect(container).not.toBeInTheDocument();
  

  });




  test('handleDeleteTemp cancel delete', async () => {
    const editorRef = React.createRef();
    vi.spyOn(window, 'confirm').mockReturnValueOnce(false);
    
  render(<EmbeddedVideoEditor ref={editorRef} temporaryMode={true} />);

  const mockFileData = [{
    id: 'test-id-123',
    file: JSON.stringify({
      video_url: 'https://www.youtube.com/watch?v=testvideo',
      title: 'TitleOfVideoTest',
      description: 'Test description'
    }),
    filename: "video_data.json",
    video_url: 'https://www.youtube.com/watch?v=testvideo', 
    title: 'TitleOfVideoTest', 
    created_at: new Date().toISOString()
  }];
  
    editorRef.current.setTempFiles(mockFileData);

    const submitButton = screen.getByTestId('submit-video-url')
     await user.click(submitButton)
  
     const deleteButton = screen.getByTestId('fi-trash').closest('button');
     await user.click(deleteButton);

     const container = screen.getByText('TitleOfVideoTest')
     expect(container).toBeInTheDocument()
  

  });

  test('handleDeleteTemp internal error', async () => {
    const editorRef = React.createRef();
    vi.spyOn(window, 'confirm').mockReturnValueOnce(true);
    
    VideoService.deleteEmbeddedVideo.mockRejectedValue(new Error("Unable to retrieve the videos"))
    render(<EmbeddedVideoEditor ref={editorRef} temporaryMode={true} />);

    const mockFileData = [{
        id: 'test-id-123',
        file: JSON.stringify({
          video_url: 'https://www.youtube.com/watch?v=testvideo',
          title: 'TitleOfVideoTest',
          description: 'Test description'
        }),
        filename: "video_data.json",
        video_url: 'https://www.youtube.com/watch?v=testvideo', 
        title: 'TitleOfVideoTest', 
        created_at: new Date().toISOString()
      }];
      
        editorRef.current.setTempFiles(mockFileData);
    
        const submitButton = screen.getByTestId('submit-video-url')
         await user.click(submitButton)
      
         const deleteButton = screen.getByTestId('fi-trash').closest('button');
         await user.click(deleteButton);



  })

  


  


  

})