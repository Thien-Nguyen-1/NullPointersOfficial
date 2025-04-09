import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, fireEvent, screen } from '@testing-library/react';
import VideoContent from '../../components/module-content/VideoContent'; // Adjust the import path as needed

// Mock data setup
const videoData = {
  id: 'video1',
  title: 'Test Video',
  video_url: 'https://youtube.com/watch?v=dQw4w9WgXcQ'
};

const videoDataNoUrl = {
  id: 'video2',
  title: 'Test Video No URL',
};

const completedContentIds = new Set();

describe('VideoContent Component', () => {
  beforeEach(() => {
    completedContentIds.clear();
  });

  it('renders correctly with a YouTube URL', () => {
    render(<VideoContent videoData={videoData} completedContentIds={completedContentIds} onComplete={vi.fn()} />);
    expect(screen.getByTitle('Embedded Video')).toBeInTheDocument();
    expect(screen.getByTitle('Embedded Video').src).toContain('embed');
  });

  it('renders a message when there is no video URL', () => {
    render(<VideoContent videoData={videoDataNoUrl} completedContentIds={completedContentIds} onComplete={vi.fn()} />);
    expect(screen.getByText(/Video preview is not available for this link/)).toBeInTheDocument();
  });

  it('renders correctly in preview mode', () => {
    render(<VideoContent videoData={videoData} completedContentIds={completedContentIds} onComplete={vi.fn()} isPreviewMode={true} />);
    expect(screen.getByText(/Video playback available in published version/)).toBeInTheDocument();
  });

  it('does not render the video iframe in preview mode without URL', () => {
    render(<VideoContent videoData={videoDataNoUrl} completedContentIds={completedContentIds} onComplete={vi.fn()} isPreviewMode={true} />);
    expect(screen.queryByTitle('Embedded Video')).not.toBeInTheDocument();
  });

  it('handles mark as viewed interaction', () => {
    const onCompleteMock = vi.fn();
    render(<VideoContent videoData={videoData} completedContentIds={completedContentIds} onComplete={onCompleteMock} />);
    
    const button = screen.getByText('Mark as Viewed');
    fireEvent.click(button);
    expect(onCompleteMock).toHaveBeenCalledWith(videoData.id, { viewed: true });
  });

  it('validates embed URL generation for YouTube', () => {
    render(<VideoContent videoData={videoData} completedContentIds={completedContentIds} onComplete={vi.fn()} />);
    const iframe = screen.getByTitle('Embedded Video');
    expect(iframe.src).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
  });

  it('validates embed URL generation for unsupported domain defaults to original URL', () => {
    const localVideoData = {...videoData, video_url: 'https://unsupportedvideohost.com/video123'};
    render(<VideoContent videoData={localVideoData} completedContentIds={completedContentIds} onComplete={vi.fn()} />);
    // Ensure that the iframe is being targeted correctly. Adjust the query as necessary.
    const iframe = screen.getByDisplayValue('Embedded Video'); // Make sure this title is unique to iframes.
    expect(iframe).toBeInTheDocument(); // First check if it's rendered
    expect(iframe.src).toBe(localVideoData.video_url); // Then check the src
  });

  // Add tests for other supported domains like Vimeo, Dailymotion, Wistia, Loom etc.
});

