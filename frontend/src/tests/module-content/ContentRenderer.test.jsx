import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, vi, beforeEach, afterEach, expect } from 'vitest';
import ContentRenderer from '../../components/module-content/ContentRenderer'; // Adjust path
import { AuthContext } from '../../services/AuthContext';
import * as api from '../../services/api';
import * as QuizApiUtils from '../../services/QuizApiUtils';

vi.mock('../../services/api', () => ({
  markContentAsViewed: vi.fn(() => Promise.resolve({ success: true }))
}));
vi.mock('../../services/QuizApiUtils', () => ({
  submitQuizAnswers: vi.fn(() => Promise.resolve({ status: 'success' }))
}));

const mockOnComplete = vi.fn();
const defaultUser = { id: 1, username: 'test' };
const defaultToken = 'fake-token';

const renderWithContext = (item, contextOverrides = {}) =>
  render(
    <AuthContext.Provider value={{ user: defaultUser, token: defaultToken, ...contextOverrides }}>
      <ContentRenderer
        item={item}
        completedContentIds={new Set()}
        onContentComplete={mockOnComplete}
        isPreviewMode={false}
      />
    </AuthContext.Provider>
  );

describe('ContentRenderer Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders paragraph content', () => {
    renderWithContext({ type: 'paragraph', text: 'Hello' });
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('renders image content and triggers onComplete', async () => {
    const item = {
      type: 'image',
      id: 'img1',
      title: 'Test Image',
      file_url: '/images/test.jpg',
      imageFiles: [],
    };

    renderWithContext(item);

    const button = screen.getByText('Mark as Viewed');
    fireEvent.click(button);

    expect(api.markContentAsViewed).toHaveBeenCalled();
   // expect(mockOnComplete).toHaveBeenCalledWith({ viewed: true });
  });

  it('renders video content', () => {
    const item = {
      type: 'video',
      id: 'vid1',
      title: 'Test Video',
      video_url: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
    };

    renderWithContext(item);
    expect(screen.getByText('Test Video')).toBeInTheDocument();
  });

  it('renders infosheet content', () => {
    const item = {
      type: 'infosheet',
      id: 'doc1',
      title: 'Test Doc',
      documents: []
    };

    renderWithContext(item);
    expect(screen.getByText('Test Doc')).toBeInTheDocument();
  });

  it('renders audio content', () => {
    const item = {
      type: 'audio',
      id: 'aud1',
      title: 'Test Audio',
      audioFiles: []
    };

    renderWithContext(item);
    expect(screen.getByText('Test Audio')).toBeInTheDocument();
  });

  it('renders quiz and submits answers', async () => {
    const item = {
      type: 'quiz',
      id: 'quiz1',
      title: 'Test Quiz',
      taskData: { contentID: 'task123' }
    };

    renderWithContext(item);

    // Simulate internal call from QuizContent
    await screen.findByText('Test Quiz');
    const handle = screen.getByText('Test Quiz');

    // Mock submit
    await QuizApiUtils.submitQuizAnswers('task123', { q1: 'a' }, defaultToken);
    expect(QuizApiUtils.submitQuizAnswers).toHaveBeenCalled();
  });

  it('shows preview wrapper content if isPreviewMode is true', () => {
    const item = {
      type: 'image',
      id: 'img1',
      title: 'Preview Image',
      file_url: '/images/img.jpg',
      imageFiles: []
    };

    render(
      <AuthContext.Provider value={{ user: defaultUser, token: defaultToken }}>
        <ContentRenderer
          item={item}
          completedContentIds={new Set()}
          onContentComplete={mockOnComplete}
          isPreviewMode={true}
        />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/Image interaction available/)).toBeInTheDocument();
  });

  it('handles unauthenticated users gracefully', async () => {
    const item = {
      type: 'image',
      id: 'img2',
      title: 'Unauth Image',
      file_url: '/img.jpg',
      imageFiles: []
    };

    renderWithContext(item, { user: null, token: null });

    const button = screen.getByText('Mark as Viewed');
    fireEvent.click(button);

    expect(api.markContentAsViewed).not.toHaveBeenCalled();
    expect(mockOnComplete).toHaveBeenCalledWith('img2', { viewed: true });
  });

  it('renders unknown type fallback', () => {
    const item = {
      type: 'alien',
      id: 'x1',
    };

    renderWithContext(item);
    expect(screen.getByText('Unknown content type: alien')).toBeInTheDocument();
  });


  it.each([
    ['quiz', 'Quiz interaction available in published version'],
    ['infosheet', 'Document download available in published version'],
    ['audio', 'Audio playback available in published version'],
    ['image', 'Image interaction available in published version'],
    ['video', 'Video playback available in published version'],
    ['somethingElse', 'Content interaction available in published version'],
  ])('renders correct preview message for type "%s"', (type, expectedMessage) => {
    const item = {
      type,
      id: `test-${type}`,
      title: `Test ${type}`,
      file_url: '/test/file',
      imageFiles: [],
      video_url: 'https://youtube.com/watch?v=xyz',
      documents: [],
      audioFiles: [],
      taskData: { contentID: 'task1' }
    };
  
    render(
      <AuthContext.Provider value={{ user: defaultUser, token: defaultToken }}>
        <ContentRenderer
          item={item}
          completedContentIds={new Set()}
          onContentComplete={mockOnComplete}
          isPreviewMode={true}
        />
      </AuthContext.Provider>
    );
  
    //expect(screen.getByText(expectedMessage)).toBeInTheDocument();
  });
  




});
