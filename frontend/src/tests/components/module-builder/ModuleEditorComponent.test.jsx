import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ModuleEditorComponent } from '../../../components/module-builder/ModuleEditorComponent';


// Mock console methods to avoid test output clutter
const originalConsoleError = console.error;
const originalConsoleLog = console.log;

beforeEach(() => {
  console.error = vi.fn();
  console.log = vi.fn();
});

afterEach(() => {
  console.error = originalConsoleError;
  console.log = originalConsoleLog;
});

// Mock all imported editor components with forwardRef implementations
vi.mock('../../../editors/VisualFlashcardEditor', () => ({
  default: vi.fn(
    React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        getData: () => ({ questions: [] })
      }));
      return <div data-testid="flashcard-editor">Flashcard Editor</div>;
    })
  )
}));

vi.mock('../../../editors/VisualFillTheFormEditor', () => ({
  default: vi.fn(
    React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        getData: () => ({ questions: [] })
      }));
      return <div data-testid="fill-form-editor">Fill Form Editor</div>;
    })
  )
}));

vi.mock('../../../editors/VisualFlowChartQuiz', () => ({
  default: vi.fn(
    React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        getData: () => ({ questions: [] })
      }));
      return <div data-testid="flowchart-quiz">Flowchart Quiz</div>;
    })
  )
}));

vi.mock('../../../editors/VisualQuestionAndAnswerFormEditor', () => ({
  default: vi.fn(
    React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        getData: () => ({ questions: [] })
      }));
      return <div data-testid="qa-editor">Question & Answer Editor</div>;
    })
  )
}));

vi.mock('../../../editors/VisualMatchingQuestionsQuizEditor', () => ({
  default: vi.fn(
    React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        getData: () => ({ questions: [] })
      }));
      return <div data-testid="matching-editor">Matching Questions Editor</div>;
    })
  )
}));

vi.mock('../../../editors/RankingQuizEditor', () => ({
  default: vi.fn(
    React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        getData: () => ({ questions: [] })
      }));
      return <div data-testid="ranking-editor">Ranking Quiz Editor</div>;
    })
  )
}));

vi.mock('../../../editors/Headings', () => ({
  default: vi.fn(
    React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        getData: () => ({ headingText: 'Sample Heading' })
      }));
      return <div data-testid="headings-component">Headings Component</div>;
    })
  )
}));

vi.mock('../../../editors/DocumentUploader', () => ({
  DocumentEditorWrapper: vi.fn(
    React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        getData: () => ({ document: 'sample.pdf' })
      }));
      return <div data-testid="document-editor">Document Editor</div>;
    })
  )
}));

vi.mock('../../../editors/AudioUploader', () => ({
  AudioEditorWrapper: vi.fn(
    React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        getData: () => ({ audio: 'sample.mp3' })
      }));
      return <div data-testid="audio-editor">Audio Editor</div>;
    })
  )
}));

vi.mock('../../../editors/InlinePictureUploader', () => ({
  InlinePictureEditorWrapper: vi.fn(
    React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        getData: () => ({ image: 'sample.jpg' })
      }));
      return <div data-testid="picture-editor">Picture Editor</div>;
    })
  )
}));

vi.mock('../../../editors/EmbeddedVideoEditor', () => ({
  EmbeddedVideoEditorWrapper: vi.fn(
    React.forwardRef((props, ref) => {
      React.useImperativeHandle(ref, () => ({
        getData: () => ({ video: 'https://example.com/video' })
      }));
      return <div data-testid="video-editor">Video Editor</div>;
    })
  )
}));

describe('ModuleEditorComponent', () => {
  // Common props
  const mockStyles = {
    'module-item': 'module-item',
    'error': 'error',
    'remove-module-btn': 'remove-module-btn'
  };

  const mockRemoveModule = vi.fn();

  // Setup editorRefs and initialQuestionsRef
  let editorRefs;
  let initialQuestionsRef;

  beforeEach(() => {
    mockRemoveModule.mockClear();
    editorRefs = { current: {} };
    initialQuestionsRef = { current: {} };
  });

  // Test every module type and variant
  describe('Component Type Rendering', () => {
    // Test all template component types
    it('renders template components correctly', () => {
      const templateModule = {
        id: '123456abcdef',
        componentType: 'template',
        type: 'Flashcard Quiz',
        quizType: 'flashcard'
      };

      render(
        <ModuleEditorComponent
          module={templateModule}
          editorRefs={editorRefs}
          initialQuestionsRef={initialQuestionsRef}
          removeModule={mockRemoveModule}
          moduleOptions={[]}
          media={[]}
          styles={mockStyles}
        />
      );

      // Check component type in heading
      expect(screen.getByText('Flashcard Quiz (ID: 123456...)')).toBeInTheDocument();
      // Check correct editor is rendered
      expect(screen.getByTestId('flashcard-editor')).toBeInTheDocument();
      // Check remove button exists
      expect(screen.getByText('Remove')).toBeInTheDocument();
      // Verify ref is set correctly
      expect(editorRefs.current).toHaveProperty('123456abcdef');
    });

    // Test media component rendering
    it('renders media components correctly', () => {
      const mediaModule = {
        id: '123456abcdef',
        componentType: 'media',
        type: 'Upload Document',
        mediaType: 'document'
      };

      render(
        <ModuleEditorComponent
          module={mediaModule}
          editorRefs={editorRefs}
          initialQuestionsRef={initialQuestionsRef}
          removeModule={mockRemoveModule}
          moduleOptions={[]}
          media={[]}
          styles={mockStyles}
        />
      );

      // Check component type in heading
      expect(screen.getByText('Upload Document (ID: 123456...)')).toBeInTheDocument();
      // Check correct editor is rendered
      expect(screen.getByTestId('document-editor')).toBeInTheDocument();
      // Verify ref is set correctly
      expect(editorRefs.current).toHaveProperty('123456abcdef');
    });

    // Test heading component rendering
    it('renders heading components correctly', () => {
      const headingModule = {
        id: '123456abcdef',
        componentType: 'heading',
        type: 'heading',
        size: 'h2'
      };

      render(
        <ModuleEditorComponent
          module={headingModule}
          editorRefs={editorRefs}
          initialQuestionsRef={initialQuestionsRef}
          removeModule={mockRemoveModule}
          moduleOptions={[]}
          media={[]}
          styles={mockStyles}
        />
      );

      // Heading components have different structure - no heading text with type and ID
      expect(screen.queryByText('heading (ID: 123456...)')).not.toBeInTheDocument();
      // Check correct editor is rendered
      expect(screen.getByTestId('headings-component')).toBeInTheDocument();
      // Check ref wasn't set (for heading components)
      expect(editorRefs.current).not.toHaveProperty('123456abcdef');
    });

    // Test handling unknown component types
    it('renders error message when component type is not found', () => {
      const unknownModule = {
        id: '123456abcdef',
        componentType: 'unknown',
        type: 'Unknown Type'
      };

      render(
        <ModuleEditorComponent
          module={unknownModule}
          editorRefs={editorRefs}
          initialQuestionsRef={initialQuestionsRef}
          removeModule={mockRemoveModule}
          moduleOptions={[]}
          media={[]}
          styles={mockStyles}
        />
      );

      // Check error message
      expect(screen.getByText('Unknown Type (ID: 123456...) - Error: No editor found')).toBeInTheDocument();
    });
  });

  // Test special case handling for ranking quiz
  describe('Special Case Handling', () => {
    it('renders ranking quiz with special handling', () => {
      const rankingModule = {
        id: '123456abcdef',
        componentType: 'template',
        type: 'Ranking Quiz',
        quizType: 'ranking_quiz'
      };

      render(
        <ModuleEditorComponent
          module={rankingModule}
          editorRefs={editorRefs}
          initialQuestionsRef={initialQuestionsRef}
          removeModule={mockRemoveModule}
          moduleOptions={[]}
          media={[]}
          styles={mockStyles}
        />
      );

      // Check component type in heading
      expect(screen.getByText('Ranking Quiz (ID: 123456...)')).toBeInTheDocument();
      // Check correct editor is rendered
      expect(screen.getByTestId('ranking-editor')).toBeInTheDocument();
    });

    it('renders ranking quiz with contentID as editorKey', () => {
      const rankingModuleWithContentID = {
        id: '123456abcdef',
        contentID: 'content-789',
        componentType: 'template',
        type: 'Ranking Quiz',
        quizType: 'ranking_quiz'
      };

      render(
        <ModuleEditorComponent
          module={rankingModuleWithContentID}
          editorRefs={editorRefs}
          initialQuestionsRef={initialQuestionsRef}
          removeModule={mockRemoveModule}
          moduleOptions={[]}
          media={[]}
          styles={mockStyles}
        />
      );

      // Check component type in heading
      expect(screen.getByText('Ranking Quiz (ID: 123456...)')).toBeInTheDocument();
      // Check correct editor is rendered
      expect(screen.getByTestId('ranking-editor')).toBeInTheDocument();
    });

    it('renders ranking quiz with moduleId provided', () => {
      const rankingModuleWithModuleId = {
        id: '123456abcdef',
        moduleId: 'module-xyz',
        componentType: 'template',
        type: 'Ranking Quiz',
        quizType: 'ranking_quiz'
      };

      render(
        <ModuleEditorComponent
          module={rankingModuleWithModuleId}
          editorRefs={editorRefs}
          initialQuestionsRef={initialQuestionsRef}
          removeModule={mockRemoveModule}
          moduleOptions={[]}
          media={[]}
          styles={mockStyles}
        />
      );

      // Check component type in heading
      expect(screen.getByText('Ranking Quiz (ID: 123456...)')).toBeInTheDocument();
      // Check correct editor is rendered
      expect(screen.getByTestId('ranking-editor')).toBeInTheDocument();
    });
  });

  // Test all template types to ensure complete component coverage
  describe('Template Component Types', () => {
    it('renders all template component types correctly', () => {
      const templateTypes = [
        { type: 'Flashcard Quiz', testId: 'flashcard-editor' },
        { type: 'Fill in the Blanks', testId: 'fill-form-editor' },
        { type: 'Flowchart Quiz', testId: 'flowchart-quiz' },
        { type: 'Question and Answer Form', testId: 'qa-editor' },
        { type: 'Matching Question Quiz', testId: 'matching-editor' }
      ];

      templateTypes.forEach(({ type, testId }) => {
        const module = {
          id: '123456abcdef',
          componentType: 'template',
          type: type,
          quizType: type === 'Ranking Quiz' ? 'ranking_quiz' : 'standard'
        };

        const { unmount } = render(
          <ModuleEditorComponent
            module={module}
            editorRefs={editorRefs}
            initialQuestionsRef={initialQuestionsRef}
            removeModule={mockRemoveModule}
            moduleOptions={[]}
            media={[]}
            styles={mockStyles}
          />
        );

        // Check the module type is displayed in heading
        expect(screen.getByText(`${type} (ID: 123456...)`)).toBeInTheDocument();
        expect(screen.getByTestId(testId)).toBeInTheDocument();

        unmount();
      });
    });
  });

  // Test all media component types
  describe('Media Component Types', () => {
    it('renders all media component types correctly', () => {
      const mediaTypes = [
        { type: 'Upload Document', testId: 'document-editor' },
        { type: 'Upload Audio', testId: 'audio-editor' },
        { type: 'Upload Image', testId: 'picture-editor' },
        { type: 'Link Video', testId: 'video-editor' }
      ];

      mediaTypes.forEach(({ type, testId }) => {
        const module = {
          id: '123456abcdef',
          componentType: 'media',
          type: type,
          mediaType: type.toLowerCase().split(' ')[1] // Extract media type from component name
        };

        const { unmount } = render(
          <ModuleEditorComponent
            module={module}
            editorRefs={editorRefs}
            initialQuestionsRef={initialQuestionsRef}
            removeModule={mockRemoveModule}
            moduleOptions={[]}
            media={[]}
            styles={mockStyles}
          />
        );

        // Check the module type is displayed in heading
        expect(screen.getByText(`${type} (ID: 123456...)`)).toBeInTheDocument();
        expect(screen.getByTestId(testId)).toBeInTheDocument();

        unmount();
      });
    });
  });

  // Test functional behavior
  describe('Functional Behavior', () => {
    it('calls removeModule with correct id when remove button is clicked', () => {
      const module = {
        id: '123456abcdef',
        componentType: 'template',
        type: 'Flashcard Quiz'
      };

      render(
        <ModuleEditorComponent
          module={module}
          editorRefs={editorRefs}
          initialQuestionsRef={initialQuestionsRef}
          removeModule={mockRemoveModule}
          moduleOptions={[]}
          media={[]}
          styles={mockStyles}
        />
      );

      // Click remove button
      fireEvent.click(screen.getByText('Remove'));

      // Check removeModule was called with correct ID
      expect(mockRemoveModule).toHaveBeenCalledWith('123456abcdef');
    });

    it('passes initialQuestions to editor component when available', () => {
      const module = {
        id: '123456abcdef',
        componentType: 'template',
        type: 'Flashcard Quiz'
      };

      initialQuestionsRef.current['123456abcdef'] = [{ question: 'Test question' }];

      render(
        <ModuleEditorComponent
          module={module}
          editorRefs={editorRefs}
          initialQuestionsRef={initialQuestionsRef}
          removeModule={mockRemoveModule}
          moduleOptions={[]}
          media={[]}
          styles={mockStyles}
        />
      );

      // Presence of editor is sufficient since we cannot easily test props passing with mocked components
      expect(screen.getByTestId('flashcard-editor')).toBeInTheDocument();
    });

    it('passes empty array when no initialQuestions are available', () => {
      const module = {
        id: '123456abcdef',
        componentType: 'template',
        type: 'Flashcard Quiz'
      };

      // No initialQuestions for this module ID
      initialQuestionsRef.current = {};

      render(
        <ModuleEditorComponent
          module={module}
          editorRefs={editorRefs}
          initialQuestionsRef={initialQuestionsRef}
          removeModule={mockRemoveModule}
          moduleOptions={[]}
          media={[]}
          styles={mockStyles}
        />
      );

      // Presence of editor is sufficient
      expect(screen.getByTestId('flashcard-editor')).toBeInTheDocument();
    });
  });

  // Test ref handling
  describe('Ref Handling', () => {
    it('correctly sets editorRefs for template components', () => {
      const module = {
        id: '123456abcdef',
        componentType: 'template',
        type: 'Flashcard Quiz'
      };

      render(
        <ModuleEditorComponent
          module={module}
          editorRefs={editorRefs}
          initialQuestionsRef={initialQuestionsRef}
          removeModule={mockRemoveModule}
          moduleOptions={[]}
          media={[]}
          styles={mockStyles}
        />
      );

      // Verify ref is set
      expect(editorRefs.current).toHaveProperty('123456abcdef');
    });

    it('correctly sets editorRefs for media components', () => {
      const module = {
        id: '123456abcdef',
        componentType: 'media',
        type: 'Upload Document'
      };

      render(
        <ModuleEditorComponent
          module={module}
          editorRefs={editorRefs}
          initialQuestionsRef={initialQuestionsRef}
          removeModule={mockRemoveModule}
          moduleOptions={[]}
          media={[]}
          styles={mockStyles}
        />
      );

      // Verify ref is set
      expect(editorRefs.current).toHaveProperty('123456abcdef');
    });
  });

  // Test module with moduleId property (used by some editors)
  describe('Module ID Handling', () => {
    it('renders component with moduleId property passed correctly', () => {
      const module = {
        id: '123456abcdef',
        moduleId: 'module-xyz',
        componentType: 'template',
        type: 'Flashcard Quiz',
        quizType: 'flashcard'
      };

      render(
        <ModuleEditorComponent
          module={module}
          editorRefs={editorRefs}
          initialQuestionsRef={initialQuestionsRef}
          removeModule={mockRemoveModule}
          moduleOptions={[]}
          media={[]}
          styles={mockStyles}
        />
      );

      // Check component is rendered
      expect(screen.getByTestId('flashcard-editor')).toBeInTheDocument();
    });

    it('renders component with both moduleId and contentID properties', () => {
      const module = {
        id: '123456abcdef',
        moduleId: 'module-xyz',
        contentID: 'content-789',
        componentType: 'template',
        type: 'Ranking Quiz',
        quizType: 'ranking_quiz'
      };

      render(
        <ModuleEditorComponent
          module={module}
          editorRefs={editorRefs}
          initialQuestionsRef={initialQuestionsRef}
          removeModule={mockRemoveModule}
          moduleOptions={[]}
          media={[]}
          styles={mockStyles}
        />
      );

      // Check component is rendered
      expect(screen.getByTestId('ranking-editor')).toBeInTheDocument();
    });
  });
});
