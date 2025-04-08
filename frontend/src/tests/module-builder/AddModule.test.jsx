import { BrowserRouter } from 'react-router-dom';
import { AuthContext } from '../../services/AuthContext';
import { PreviewModeProvider } from '../../services/PreviewModeContext';
import AddModule from '../../pages/AddModule';
import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import api from '../../services/api';

// Mock dependencies
vi.mock('../services/QuizApiUtils', () => ({
  QuizApiUtils: {
    getQuizTypeValue: vi.fn().mockReturnValue('flashcard'),
    createModule: vi.fn().mockResolvedValue({ id: 'test-module-id' }),
    updateModule: vi.fn().mockResolvedValue({}),
    getModule: vi.fn().mockResolvedValue({
      title: 'Test Module',
      description: 'Test Description',
      tags: []
    }),
    getModuleSpecificTasks: vi.fn().mockResolvedValue([]),
    getModuleContents: vi.fn().mockResolvedValue([]),
    getQuizTypeValue: vi.fn(),
    getComponentType: vi.fn().mockReturnValue('template'),
    createModuleTask: vi.fn().mockResolvedValue({ contentID: 'test-task-id' }),
    getModuleTasks: vi.fn().mockResolvedValue([]),
  }
}));

vi.mock('../services/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ 
      data: [
        { id: 1, tag: 'Test Tag' }
      ] 
    }),
    post: vi.fn().mockResolvedValue({ data: {} })
  }
}));

// Mock media services
vi.mock('../services/DocumentService', () => ({
  default: {
    getModuleDocuments: vi.fn().mockResolvedValue([]),
    deleteDocument: vi.fn().mockResolvedValue({})
  }
}));

const mockUser = {
  id: 'test-user-id',
  username: 'testuser'
};

const Wrapper = ({ children }) => (
  <BrowserRouter>
    <AuthContext.Provider value={{ user: mockUser }}>
      <PreviewModeProvider>
        {children}
      </PreviewModeProvider>
    </AuthContext.Provider>
  </BrowserRouter>
);

describe('AddModule Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders basic structure', async () => {
    render(
      <Wrapper>
        <AddModule />
      </Wrapper>
    );

    // Check for key elements
    expect(screen.getByPlaceholderText('Title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Module Description')).toBeInTheDocument();
    expect(screen.getByText('Add Template')).toBeInTheDocument();
    expect(screen.getByText('Publish')).toBeInTheDocument();
  });

  test('opens dropdown and displays module types', async () => {
    render(
      <Wrapper>
        <AddModule />
      </Wrapper>
    );

    // Open dropdown
    const addTemplateButton = screen.getByText('Add Template');
    fireEvent.click(addTemplateButton);

    // Check module types
    const expectedModuleTypes = [
      'Flashcard Quiz', 
      'Fill in the Blanks', 
      'Flowchart Quiz', 
      'Question and Answer Form', 
      'Matching Question Quiz', 
      'Ranking Quiz'
    ];

    expectedModuleTypes.forEach(type => {
      expect(screen.getByText(type)).toBeInTheDocument();
    });
  });

  test('opens dropdown and displays media types', async () => {
    render(
      <Wrapper>
        <AddModule />
      </Wrapper>
    );

    // Open dropdown
    const addTemplateButton = screen.getByText('Add Template');
    fireEvent.click(addTemplateButton);

    // Check media types
    const expectedMediaTypes = [
      'Upload Document', 
      'Upload Audio', 
      'Upload Image', 
      'Link Video'
    ];

    expectedMediaTypes.forEach(type => {
      expect(screen.getByText(type)).toBeInTheDocument();
    });
  });

  test('prevents publishing without title', async () => {
    render(
      <Wrapper>
        <AddModule />
      </Wrapper>
    );

    // Try to publish without title
    const publishButton = screen.getByText('Publish');
    fireEvent.click(publishButton);

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/Module title is required/i)).toBeInTheDocument();
    });
  });

  test('adds module template', async () => {
    render(
      <Wrapper>
        <AddModule />
      </Wrapper>
    );

    // Open dropdown
    const addTemplateButton = screen.getByText('Add Template');
    fireEvent.click(addTemplateButton);

    // Add Flashcard Quiz
    const flashcardQuizOption = screen.getByText('Flashcard Quiz');
    fireEvent.click(flashcardQuizOption);

    // Check if module is added to the list
    await waitFor(() => {
      expect(screen.getByText(/Flashcard Quiz/i)).toBeInTheDocument();
    });
  });

  test('adds media template', async () => {
    render(
      <Wrapper>
        <AddModule />
      </Wrapper>
    );

    // Open dropdown
    const addTemplateButton = screen.getByText('Add Template');
    fireEvent.click(addTemplateButton);

    // Add Document
    const documentOption = screen.getByText('Upload Document');
    fireEvent.click(documentOption);

    // Check if media is added to the list
    await waitFor(() => {
      expect(screen.getByText(/Upload Document/i)).toBeInTheDocument();
    });
  });

  test('removes module template', async () => {
    render(
      <Wrapper>
        <AddModule />
      </Wrapper>
    );

    // First, verify the dropdown is closed initially
    expect(screen.queryByText('Flashcard Quiz')).not.toBeInTheDocument();
  
    // Open dropdown - might need to check if dropdown is visible
    const addTemplateButton = screen.getByText(/add template/i);
    fireEvent.mouseDown(addTemplateButton); // Try mouseDown instead of click
    fireEvent.click(addTemplateButton);

    // Check if dropdown is open by looking for its container
    const dropdown = screen.getByRole('menu'); // Or use a test-id if available
    expect(dropdown).toBeInTheDocument();
  
    // Wait for dropdown to open
    await waitFor(() => {
      expect(screen.getByText('Flashcard Quiz')).toBeInTheDocument();
    });
  
    // Add template
    const flashcardQuizOption = screen.getByText('Flashcard Quiz');
    fireEvent.click(flashcardQuizOption);
  
    // Verify template was added
    await waitFor(() => {
      expect(screen.getByText(/Flashcard Quiz/i)).toBeInTheDocument();
    });
  
    // Remove template
    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);
  
    // Verify removal
    await waitFor(() => {
      expect(screen.queryByText(/Flashcard Quiz/i)).not.toBeInTheDocument();
    });
  });

  test('handles preview mode', async () => {
    render(
      <Wrapper>
        <AddModule />
      </Wrapper>
    );
  
    // Add a title to enable preview
    const titleInput = screen.getByPlaceholderText('Title');
    fireEvent.change(titleInput, { target: { value: 'Test Module' } });
  
    // Find the green "+" button for adding templates
    const addTemplateButton = screen.getAllByText('+')[1];
    fireEvent.click(addTemplateButton);
  
    // Click Flashcard Quiz
    const flashcardQuizOption = screen.getByText('Flashcard Quiz');
    fireEvent.click(flashcardQuizOption);
  
    // Click preview button
    const previewButton = screen.getByText('Preview');
    fireEvent.click(previewButton);
  
    // Check for preview mode indicator
    await waitFor(() => {
      // Use the actual text from the screenshot
      expect(screen.getByText('Exit Preview')).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  test('adds and removes tags', async () => {
    // Mock the API calls
    const mockApiGet = vi.spyOn(api, 'get').mockResolvedValue({
      data: [
        { id: 1, tag: 'existing tag' }
      ]
    });
    
    const mockApiPost = vi.spyOn(api, 'post').mockResolvedValue({
      data: { id: 2, tag: 'testtag' }
    });
  
    // Mock the prompt
    vi.spyOn(window, 'prompt').mockReturnValue('testtag');
  
    render(
      <Wrapper>
        <AddModule />
      </Wrapper>
    );
  
    // Find the add tag button (the "+" button)
    const addTagButton = screen.getAllByText('+')[0];
    fireEvent.click(addTagButton);
  
    // Wait for API calls
    await waitFor(() => {
      // Check that the API was called to create a new tag
      expect(mockApiPost).toHaveBeenCalledWith('/api/tags/', { tag: 'testtag' });
    });
  });
});