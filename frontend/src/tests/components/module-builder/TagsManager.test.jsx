import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { TagsManager } from '../../../components/module-builder/TagsManager';

describe('TagsManager', () => {
  // Mock styles object to avoid CSS module issues
  const mockStyles = {
    'tags-container': 'tags-container',
    'tag': 'tag',
    'remove-tag-btn': 'remove-tag-btn',
    'tag-button-wrapper': 'tag-button-wrapper',
    'plus-button': 'plus-button',
    'tag-label': 'tag-label'
  };

  // Sample data for testing
  const sampleTags = ['tag1', 'tag2', 'tag3'];
  const sampleAvailableTags = [
    { id: 'tag1', tag: 'JavaScript' },
    { id: 'tag2', tag: 'React' },
    { id: 'tag3', tag: 'Testing' },
    { id: 'tag4', tag: 'Frontend' }
  ];

  // Test props
  const mockAddTag = vi.fn();
  const mockRemoveTag = vi.fn();

  // Basic render test - happy path
  it('renders all tags correctly', () => {
    render(
      <TagsManager
        tags={sampleTags}
        availableTags={sampleAvailableTags}
        addTag={mockAddTag}
        removeTag={mockRemoveTag}
        styles={mockStyles}
      />
    );

    // Check all tags are rendered
    expect(screen.getByText('JavaScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Testing')).toBeInTheDocument();

    // Check add button is rendered
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('Add module tags')).toBeInTheDocument();
  });

  // Test add tag functionality
  it('calls addTag when add button is clicked', () => {
    render(
      <TagsManager
        tags={sampleTags}
        availableTags={sampleAvailableTags}
        addTag={mockAddTag}
        removeTag={mockRemoveTag}
        styles={mockStyles}
      />
    );

    // Click the add button
    fireEvent.click(screen.getByText('+'));

    // Verify addTag was called
    expect(mockAddTag).toHaveBeenCalledTimes(1);
  });

  // Test remove tag functionality
  it('calls removeTag with correct tagId when remove button is clicked', () => {
    render(
      <TagsManager
        tags={sampleTags}
        availableTags={sampleAvailableTags}
        addTag={mockAddTag}
        removeTag={mockRemoveTag}
        styles={mockStyles}
      />
    );

    // Find all remove buttons (x) and click the first one
    const removeButtons = screen.getAllByText('x');
    fireEvent.click(removeButtons[0]);

    // Verify removeTag was called with the correct tagId
    expect(mockRemoveTag).toHaveBeenCalledWith('tag1');
  });

  // Test edge case: tag not found in availableTags
  it('does not render tags that are not found in availableTags', () => {
    render(
      <TagsManager
        tags={[...sampleTags, 'nonexistent-tag']}
        availableTags={sampleAvailableTags}
        addTag={mockAddTag}
        removeTag={mockRemoveTag}
        styles={mockStyles}
      />
    );

    // Only the three valid tags should be rendered
    const tagElements = screen.getAllByText(/JavaScript|React|Testing/);
    expect(tagElements).toHaveLength(3);
  });

  // Test with empty tags array
  it('renders only the add button when tags array is empty', () => {
    render(
      <TagsManager
        tags={[]}
        availableTags={sampleAvailableTags}
        addTag={mockAddTag}
        removeTag={mockRemoveTag}
        styles={mockStyles}
      />
    );

    // Check no tags are rendered
    sampleAvailableTags.forEach(tag => {
      expect(screen.queryByText(tag.tag)).not.toBeInTheDocument();
    });

    // Check add button is still rendered
    expect(screen.getByText('+')).toBeInTheDocument();
    expect(screen.getByText('Add module tags')).toBeInTheDocument();
  });

  // Test with empty availableTags array
  it('renders nothing when availableTags is empty but tags has ids', () => {
    render(
      <TagsManager
        tags={sampleTags}
        availableTags={[]}
        addTag={mockAddTag}
        removeTag={mockRemoveTag}
        styles={mockStyles}
      />
    );

    // No tags should be rendered as none are found in availableTags
    expect(screen.queryByText(/JavaScript|React|Testing/)).not.toBeInTheDocument();

    // Add button should still be there
    expect(screen.getByText('+')).toBeInTheDocument();
  });
});