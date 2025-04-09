import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import ImageContent from '../../components/module-content/ImageContent'; // adjust import as needed

const mockOnComplete = vi.fn();

const imageData = {
  id: 'img123',
  title: 'Test Image',
  source: 'http://example.com/image.jpg',
  width: 300,
  height: 200,
  caption: 'This is a sample caption'
};

const completedIds = new Set();
const completedIdsWithImg = new Set(['img123']);

const setup = (overrides = {}) => {
  const props = {
    imageData: { ...imageData, ...overrides },
    completedContentIds: completedIds,
    onComplete: mockOnComplete
  };
  return render(<ImageContent {...props} />);
};

describe('ImageContent Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders title, image, and caption', () => {
    setup();

    expect(screen.getByText('Test Image')).toBeInTheDocument();
    expect(screen.getByAltText('Test Image')).toBeInTheDocument();
    expect(screen.getByText('This is a sample caption')).toBeInTheDocument();
  });

  it('applies correct image dimensions', () => {
    setup();

    const img = screen.getByAltText('Test Image');
    expect(img).toHaveStyle({ width: '300px', height: '200px', maxWidth: '100%' });
  });

  it('calls onComplete when "Mark as Viewed" is clicked', () => {
    setup();

    const button = screen.getByText('Mark as Viewed');
    fireEvent.click(button);

    expect(mockOnComplete).toHaveBeenCalledWith('img123', { viewed: true });
  });

  it('does not show "Mark as Viewed" if already completed', () => {
    render(
      <ImageContent
        imageData={imageData}
        completedContentIds={completedIdsWithImg}
        onComplete={mockOnComplete}
      />
    );

    expect(screen.queryByText('Mark as Viewed')).not.toBeInTheDocument();
    expect(screen.getByText('✓')).toBeInTheDocument();
  });

  it('handles missing width/height gracefully', () => {
    setup({ width: null, height: null });

    const img = screen.getByAltText('Test Image');
    expect(img).toHaveStyle({ width: 'auto', height: 'auto' });
  });

  it('renders fallback image on error', () => {
    setup();

    const img = screen.getByAltText('Test Image');

    fireEvent.error(img);

    expect(img.src).toContain('data:image/svg+xml');
    expect(img.style.opacity).toBe('0.5');
  });

  it('does not render caption if not provided', () => {
    setup({ caption: '' });

    expect(screen.queryByText('This is a sample caption')).not.toBeInTheDocument();
  });
});
