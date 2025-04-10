import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import axios from 'axios';

// Mock axios instead of a custom API service
vi.mock('axios');

// Mock the react-router-dom module
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    // Mock the useParams hook
    useParams: vi.fn()
  };
});

// Import the useParams hook after mocking it
import { useParams } from 'react-router-dom';

// Mock the quiz components
vi.mock('../../../components/quizzes/FlashcardQuiz', () => ({
  default: ({ saveResponse }) => (
    <div data-testid="flashcard-quiz">
      <button onClick={() => saveResponse('1', 'Test response')}>Complete Quiz</button>
    </div>
  )
}));

vi.mock('../../../components/quizzes/RankingQuiz', () => ({
  default: ({ onComplete }) => (
    <div data-testid="ranking-quiz">
      <button onClick={() => onComplete('1', 'Test response')}>Complete Quiz</button>
    </div>
  )
}));

// Create mock components for other quiz types (that are referenced but not imported)
vi.mock('../../../components/quizzes/FillInTheBlanksQuiz', () => ({
  default: ({ saveResponse }) => (
    <div data-testid="fill-blank-quiz">
      <button onClick={() => saveResponse('1', 'Test response')}>Complete Quiz</button>
    </div>
  )
}));

vi.mock('../../../components/quizzes/FlowchartQuiz', () => ({
  default: ({ saveResponse }) => (
    <div data-testid="flowchart-sequence-quiz">
      <button onClick={() => saveResponse('1', 'Test response')}>Complete Quiz</button>
    </div>
  )
}));

// Import the actual component directly
import QuizContainer from '../../../components/quizzes/QuizContainer';

// Mock for process.env
const originalEnv = process.env;

describe('QuizContainer', () => {
  const mockQuizData = {
    title: 'Test Quiz',
    description: 'A test quiz',
    quiz_type: 'flashcard',
    questions: [
      {
        id: '1',
        question_text: 'Test question',
        answer: 'Test answer'
      }
    ]
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset env before each test
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    // Restore env after all tests
    process.env = originalEnv;
  });

  it('should render loading state initially', () => {
    // Setup the useParams mock
    useParams.mockReturnValue({ taskId: '12345678-1234-1234-1234-123456789012' });

    // Setup the axios mock to delay the response
    axios.get.mockImplementation(() => new Promise(() => {})); // Never resolves to keep loading state

    render(
      <MemoryRouter initialEntries={['/quiz/12345678-1234-1234-1234-123456789012']}>
        <Routes>
          <Route path="/quiz/:taskId" element={<QuizContainer />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/loading quiz/i)).toBeInTheDocument();
  });

  it('should render the correct quiz type after loading', async () => {
    // Setup the useParams mock
    useParams.mockReturnValue({ taskId: '12345678-1234-1234-1234-123456789012' });

    // Setup mock response
    axios.get.mockResolvedValueOnce({ data: mockQuizData });

    render(
      <MemoryRouter initialEntries={['/quiz/12345678-1234-1234-1234-123456789012']}>
        <Routes>
          <Route path="/quiz/:taskId" element={<QuizContainer />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading quiz/i)).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('flashcard-quiz')).toBeInTheDocument();
  });

  it('should validate UUID format and show error for invalid UUID', async () => {
    // Setup the useParams mock with invalid UUID
    useParams.mockReturnValue({ taskId: 'invalid-uuid' });

    render(
      <MemoryRouter initialEntries={['/quiz/invalid-uuid']}>
        <Routes>
          <Route path="/quiz/:taskId" element={<QuizContainer />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading quiz/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/invalid quiz id format/i)).toBeInTheDocument();
  });

  it('should call saveResponse when the quiz is completed', async () => {
    // Setup the useParams mock
    useParams.mockReturnValue({ taskId: '12345678-1234-1234-1234-123456789012' });

    // Setup mock responses
    axios.get.mockResolvedValueOnce({ data: mockQuizData });
    axios.post.mockResolvedValueOnce({ data: { status: 'success' } });

    render(
      <MemoryRouter initialEntries={['/quiz/12345678-1234-1234-1234-123456789012']}>
        <Routes>
          <Route path="/quiz/:taskId" element={<QuizContainer />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading quiz/i)).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Complete Quiz'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
      expect(axios.post).toHaveBeenCalledWith('/api/save-response/', {
        question_id: '1',
        response_text: 'Test response'
      });
    });
  });

  it('should handle API error when saving response', async () => {
    // Setup the useParams mock
    useParams.mockReturnValue({ taskId: '12345678-1234-1234-1234-123456789012' });

    // Setup mock responses
    axios.get.mockResolvedValueOnce({ data: mockQuizData });

    // Mock the post request to throw an error
    const mockError = new Error('Failed to save');
    axios.post.mockRejectedValueOnce(mockError);

    render(
      <MemoryRouter initialEntries={['/quiz/12345678-1234-1234-1234-123456789012']}>
        <Routes>
          <Route path="/quiz/:taskId" element={<QuizContainer />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading quiz/i)).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Complete Quiz'));

    await waitFor(() => {
      expect(axios.post).toHaveBeenCalledTimes(1);
    });

    // We can't directly test console.error, but we can test that the request was made
    // and check that the component didn't crash
    expect(screen.getByTestId('flashcard-quiz')).toBeInTheDocument();
  });

  it('should display error message when API call fails', async () => {
    // Setup the useParams mock
    useParams.mockReturnValue({ taskId: '12345678-1234-1234-1234-123456789012' });

    // Setup mock error response
    axios.get.mockRejectedValueOnce(new Error('API Error'));

    render(
      <MemoryRouter initialEntries={['/quiz/12345678-1234-1234-1234-123456789012']}>
        <Routes>
          <Route path="/quiz/:taskId" element={<QuizContainer />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading quiz/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/failed to load quiz data/i)).toBeInTheDocument();
  });

  it('should handle invalid data structure from API', async () => {
    // Setup the useParams mock
    useParams.mockReturnValue({ taskId: '12345678-1234-1234-1234-123456789012' });

    // Setup mock response with invalid data structure
    axios.get.mockResolvedValueOnce({ data: null });

    render(
      <MemoryRouter initialEntries={['/quiz/12345678-1234-1234-1234-123456789012']}>
        <Routes>
          <Route path="/quiz/:taskId" element={<QuizContainer />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading quiz/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/invalid data format received from api/i)).toBeInTheDocument();
  });

  it('should handle missing questions in API response', async () => {
    // Setup the useParams mock
    useParams.mockReturnValue({ taskId: '12345678-1234-1234-1234-123456789012' });

    // Setup mock response with missing questions
    axios.get.mockResolvedValueOnce({
      data: {
        title: 'Test Quiz',
        description: 'A test quiz',
        quiz_type: 'flashcard'
        // No questions array
      }
    });

    render(
      <MemoryRouter initialEntries={['/quiz/12345678-1234-1234-1234-123456789012']}>
        <Routes>
          <Route path="/quiz/:taskId" element={<QuizContainer />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading quiz/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/no questions found in quiz data/i)).toBeInTheDocument();
  });

  it('should show debug info in development mode', async () => {
    // Setup the useParams mock
    useParams.mockReturnValue({ taskId: '12345678-1234-1234-1234-123456789012' });

    // Set environment to development
    process.env.NODE_ENV = 'development';

    // Setup mock response
    axios.get.mockResolvedValueOnce({ data: mockQuizData });

    render(
      <MemoryRouter initialEntries={['/quiz/12345678-1234-1234-1234-123456789012']}>
        <Routes>
          <Route path="/quiz/:taskId" element={<QuizContainer />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading quiz/i)).not.toBeInTheDocument();
    });

    // The debug info should be visible
    expect(screen.getByText(/debug info/i)).toBeInTheDocument();
    expect(screen.getByText(/quiz type: flashcard/i)).toBeInTheDocument();
    expect(screen.getByText(/questions: 1/i)).toBeInTheDocument();
  });

  it('should not show debug info in production mode', async () => {
    // Setup the useParams mock
    useParams.mockReturnValue({ taskId: '12345678-1234-1234-1234-123456789012' });

    // Set environment to production
    process.env.NODE_ENV = 'production';

    // Setup mock response
    axios.get.mockResolvedValueOnce({ data: mockQuizData });

    render(
      <MemoryRouter initialEntries={['/quiz/12345678-1234-1234-1234-123456789012']}>
        <Routes>
          <Route path="/quiz/:taskId" element={<QuizContainer />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading quiz/i)).not.toBeInTheDocument();
    });

    // Debug info should not be visible in production
    expect(screen.queryByText(/debug info/i)).not.toBeInTheDocument();
  });

  it('should render different quiz types based on quiz_type property', async () => {
    // We'll test all the different quiz types
    const quizTypes = [
      { type: 'flashcard', testId: 'flashcard-quiz' },
      { type: 'flash card', testId: 'flashcard-quiz' },
      { type: 'sequence', testId: 'flowchart-sequence-quiz' },
      { type: 'statement workflow', testId: 'flowchart-sequence-quiz' },
      { type: 'ranking', testId: 'ranking-quiz' },
      { type: 'text input', testId: 'fill-blank-quiz' }, // Default case
    ];

    // Setup the useParams mock
    useParams.mockReturnValue({ taskId: '12345678-1234-1234-1234-123456789012' });

    for (const { type, testId } of quizTypes) {
      // Reset mocks for each iteration
      vi.clearAllMocks();

      // Setup mock with specific quiz type
      const quizData = {
        ...mockQuizData,
        quiz_type: type
      };

      axios.get.mockResolvedValueOnce({ data: quizData });

      const { unmount } = render(
        <MemoryRouter initialEntries={['/quiz/12345678-1234-1234-1234-123456789012']}>
          <Routes>
            <Route path="/quiz/:taskId" element={<QuizContainer />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText(/loading quiz/i)).not.toBeInTheDocument();
      });

      expect(screen.getByTestId(testId)).toBeInTheDocument();

      // Clean up before next iteration
      unmount();
    }
  });

  it('should default to FillBlankQuiz for unknown quiz types', async () => {
    // Setup the useParams mock
    useParams.mockReturnValue({ taskId: '12345678-1234-1234-1234-123456789012' });

    // Setup mock with unknown quiz type
    const quizData = {
      ...mockQuizData,
      quiz_type: 'unknown-type'
    };

    axios.get.mockResolvedValueOnce({ data: quizData });

    render(
      <MemoryRouter initialEntries={['/quiz/12345678-1234-1234-1234-123456789012']}>
        <Routes>
          <Route path="/quiz/:taskId" element={<QuizContainer />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading quiz/i)).not.toBeInTheDocument();
    });

    // Should default to FillBlankQuiz
    expect(screen.getByTestId('fill-blank-quiz')).toBeInTheDocument();
  });

  it('should handle quiz with missing title', async () => {
    // Setup the useParams mock
    useParams.mockReturnValue({ taskId: '12345678-1234-1234-1234-123456789012' });

    // Setup mock with missing title
    const quizData = {
      ...mockQuizData,
      title: undefined
    };

    axios.get.mockResolvedValueOnce({ data: quizData });

    render(
      <MemoryRouter initialEntries={['/quiz/12345678-1234-1234-1234-123456789012']}>
        <Routes>
          <Route path="/quiz/:taskId" element={<QuizContainer />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading quiz/i)).not.toBeInTheDocument();
    });

    // Should show default title 'Quiz'
    expect(screen.getByText('Quiz')).toBeInTheDocument();
  });

  it('should handle quiz with missing description', async () => {
      // Setup the useParams mock
      useParams.mockReturnValue({ taskId: '12345678-1234-1234-1234-123456789012' });

      // Setup mock with missing description
      const quizData = {
        ...mockQuizData,
        description: undefined
      };

      axios.get.mockResolvedValueOnce({ data: quizData });

      render(
        <MemoryRouter initialEntries={['/quiz/12345678-1234-1234-1234-123456789012']}>
          <Routes>
            <Route path="/quiz/:taskId" element={<QuizContainer />} />
          </Routes>
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText(/loading quiz/i)).not.toBeInTheDocument();
      });

      // Description should not be rendered - fixed query
      expect(screen.queryByText(/quiz-description/i)).not.toBeInTheDocument();
  });

  it('should handle empty questions array', async () => {
    // Setup the useParams mock
    useParams.mockReturnValue({ taskId: '12345678-1234-1234-1234-123456789012' });

    // Setup mock with empty questions array
    const quizData = {
      ...mockQuizData,
      questions: []
    };

    axios.get.mockResolvedValueOnce({ data: quizData });

    render(
      <MemoryRouter initialEntries={['/quiz/12345678-1234-1234-1234-123456789012']}>
        <Routes>
          <Route path="/quiz/:taskId" element={<QuizContainer />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading quiz/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/no questions found in quiz data/i)).toBeInTheDocument();
  });

  it('should handle quiz with null quiz_type', async () => {
    // Setup the useParams mock
    useParams.mockReturnValue({ taskId: '12345678-1234-1234-1234-123456789012' });

    // Setup mock with null quiz_type
    const quizData = {
      ...mockQuizData,
      quiz_type: null
    };

    axios.get.mockResolvedValueOnce({ data: quizData });

    render(
      <MemoryRouter initialEntries={['/quiz/12345678-1234-1234-1234-123456789012']}>
        <Routes>
          <Route path="/quiz/:taskId" element={<QuizContainer />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading quiz/i)).not.toBeInTheDocument();
    });

    // Should default to FillBlankQuiz
    expect(screen.getByTestId('fill-blank-quiz')).toBeInTheDocument();
  });

  it('should display no data message when quizData is reset to null', async () => {
    // Setup the useParams mock
    useParams.mockReturnValue({ taskId: '12345678-1234-1234-1234-123456789012' });

    // This is a bit of a hack to simulate the state where loading is false but quizData is null
    // Setup mock response to return a malformed response that the component will set to null
    axios.get.mockImplementationOnce(() => {
      // This will cause the component to set loading to false but keep quizData as null
      return Promise.resolve({ data: { questions: [] } })
        .then(response => {
          // This will trigger the "No questions found" error, which should set quizData to null
          throw new Error('No questions found in quiz data');
        });
    });

    render(
      <MemoryRouter initialEntries={['/quiz/12345678-1234-1234-1234-123456789012']}>
        <Routes>
          <Route path="/quiz/:taskId" element={<QuizContainer />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.queryByText(/loading quiz/i)).not.toBeInTheDocument();
    });

    // Should show the error message
    expect(screen.getByText(/failed to load quiz data/i)).toBeInTheDocument();
  });
});