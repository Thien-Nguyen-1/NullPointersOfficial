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

const videoDataVimeo = {
  id: 'video2',
  title: 'Test Video - Vimeo',
  video_url: 'https://vimeo.com/76979871'
};
const completedContentIds = new Set();

describe('VideoContent Component', () => {
  beforeEach(() => {
    completedContentIds.clear();
  });


  const videoDataDailymotion = {
    id: 'video3',
    title: 'Test Video - Dailymotion',
    video_url: 'https://www.dailymotion.com/video/x7u5nqz'
  };


  const videoDataWistia = {
    id: 'video4',
    title: 'Test Video - Wistia',
    video_url: 'https://home.wistia.com/medias/e4a27b971d'
  };

  

  const videoDataLoom = {
    id: 'video5',
    title: 'Test Video - Loom',
    video_url: 'https://www.loom.com/share/8c69de6cf1f448bcb99f5731b4cde0d7'
  };
  



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

  it('validates embed URL generation for Vimeo', () => {
    render(<VideoContent videoData={videoDataVimeo} completedContentIds={completedContentIds} onComplete={vi.fn()} />);
    const iframe = screen.getByTitle('Embedded Video');
    expect(iframe.src).toBe('https://player.vimeo.com/video/76979871');
  });
  it('validates embed URL generation for Dailymotion', () => {
    render(<VideoContent videoData={videoDataDailymotion} completedContentIds={completedContentIds} onComplete={vi.fn()} />);
    const iframe = screen.getByTitle('Embedded Video');
    expect(iframe.src).toBe('https://www.dailymotion.com/embed/video/x7u5nqz');
  });
  it('validates embed URL generation for Wistia', () => {
    render(<VideoContent videoData={videoDataWistia} completedContentIds={completedContentIds} onComplete={vi.fn()} />);
    const iframe = screen.getByTitle('Embedded Video');
    expect(iframe.src).toBe('https://fast.wistia.net/embed/iframe/e4a27b971d');
  });


  it('validates embed URL generation for Loom', () => {
    render(<VideoContent videoData={videoDataLoom} completedContentIds={completedContentIds} onComplete={vi.fn()} />);
    const iframe = screen.getByTitle('Embedded Video');
    expect(iframe.src).toBe('https://www.loom.com/embed/8c69de6cf1f448bcb99f5731b4cde0d7');
  });

  it('validates embed URL generation for unsupported domain defaults to original URL', () => {
    const localVideoData = {...videoData, video_url: 'https://unsupportedvideohost.com/video123'};
    render(<VideoContent videoData={localVideoData} completedContentIds={completedContentIds} onComplete={vi.fn()} />);
    
    const noPreviewMessage = screen.getByText('Video preview is not available for this link.');
    expect(noPreviewMessage).toBeInTheDocument();
  
    const icon = screen.queryByTestId('no-preview-message'); 
  });
  
});

describe('VideoContent Component - URL Handling', () => {
  it('returns original URL for unsupported domains', () => {
    const unsupportedVideoData = {
      id: 'videoUnsupported',
      title: 'Test Video Unsupported Domain',
      video_url: 'https://unsupporteddomain.com/video123'
    };

    render(<VideoContent videoData={unsupportedVideoData} completedContentIds={new Set()} onComplete={vi.fn()} />);

    const message = screen.getByText("Video preview is not available for this link.");
    expect(message).toBeInTheDocument();

  });

  it('handles malformed URLs gracefully', () => {
    const malformedVideoData = {
      id: 'videoMalformed',
      title: 'Test Video Malformed URL',
      video_url: 'htp:/malformed-url'
    };

    render(<VideoContent videoData={malformedVideoData} completedContentIds={new Set()} onComplete={vi.fn()} />);

  
    const noPreviewMessage = screen.getByText("Video preview is not available for this link.");
    expect(noPreviewMessage).toBeInTheDocument();
  });
});