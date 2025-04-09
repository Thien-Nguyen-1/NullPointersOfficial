import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTags } from '../../hooks/useTags';
import api from '../../services/api';

// Mock the api module
vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn()
  }
}));

describe('useTags', () => {
  const mockTags = [
    { id: 1, tag: 'javascript' },
    { id: 2, tag: 'react' },
    { id: 3, tag: 'testing' }
  ];

  beforeEach(() => {
    // Reset all mocks
    vi.resetAllMocks();

    // Mock api.get to return mockTags
    api.get.mockResolvedValue({ data: mockTags });

    // Mock window.prompt
    vi.spyOn(window, 'prompt').mockImplementation(() => 'new-tag');

    // Mock window.alert
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    // Mock console.error
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('should initialize with empty arrays', () => {
    const { result } = renderHook(() => useTags());

    expect(result.current.tags).toEqual([]);
    expect(result.current.availableTags).toEqual([]);
    expect(typeof result.current.fetchTags).toBe('function');
    expect(typeof result.current.addTag).toBe('function');
    expect(typeof result.current.removeTag).toBe('function');
  });

  it('should fetch tags successfully', async () => {
    const { result } = renderHook(() => useTags());

    await act(async () => {
      await result.current.fetchTags();
    });

    // Verify API call was made
    expect(api.get).toHaveBeenCalledWith('/api/tags/');

    // Verify availableTags state was updated
    expect(result.current.availableTags).toEqual(mockTags);
  });

  it('should handle error when fetching tags', async () => {
    // Mock api.get to reject
    const apiError = new Error('API Error');
    api.get.mockRejectedValue(apiError);

    const { result } = renderHook(() => useTags());

    // Should throw the error from fetchTags
    await expect(async () => {
      await act(async () => {
        await result.current.fetchTags();
      });
    }).rejects.toThrow('API Error');

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith("Error fetching tags:", apiError);
  });

  it('should add a new tag that does not exist', async () => {
    // Mock api.post to return a new tag
    const newTag = { id: 4, tag: 'new-tag' };
    api.post.mockResolvedValue({ data: newTag });

    const { result } = renderHook(() => useTags());

    // Load available tags first
    await act(async () => {
      await result.current.fetchTags();
    });

    // Add a new tag
    await act(async () => {
      await result.current.addTag();
    });

    // Verify prompt was called
    expect(window.prompt).toHaveBeenCalledWith('Enter a new tag:');

    // Verify API call was made with correct parameters
    expect(api.post).toHaveBeenCalledWith('/api/tags/', { tag: 'new-tag' });

    // Verify availableTags and tags states were updated
    expect(result.current.availableTags).toEqual([...mockTags, newTag]);
    expect(result.current.tags).toEqual([4]); // The ID of the new tag
  });

  it('should add an existing tag that is not already selected', async () => {
    // Set prompt to return an existing tag name
    window.prompt.mockReturnValue('javascript');

    const { result } = renderHook(() => useTags());

    // Load available tags first
    await act(async () => {
      await result.current.fetchTags();
    });

    // Add an existing tag
    await act(async () => {
      await result.current.addTag();
    });

    // Verify prompt was called
    expect(window.prompt).toHaveBeenCalledWith('Enter a new tag:');

    // Verify API post was NOT called (since the tag already exists)
    expect(api.post).not.toHaveBeenCalled();

    // Verify only tags state was updated (with the existing tag ID)
    expect(result.current.availableTags).toEqual(mockTags);
    expect(result.current.tags).toEqual([1]); // The ID of the existing 'javascript' tag
  });

  it('should not add a tag if prompt returns empty string', async () => {
    // Set prompt to return empty string
    window.prompt.mockReturnValue('');

    const { result } = renderHook(() => useTags());

    // Load available tags first
    await act(async () => {
      await result.current.fetchTags();
    });

    // Try to add an empty tag
    await act(async () => {
      await result.current.addTag();
    });

    // Verify prompt was called
    expect(window.prompt).toHaveBeenCalledWith('Enter a new tag:');

    // Verify API post was NOT called
    expect(api.post).not.toHaveBeenCalled();

    // Verify states were not updated
    expect(result.current.availableTags).toEqual(mockTags);
    expect(result.current.tags).toEqual([]);
  });

  it('should not add a tag if prompt returns null', async () => {
    // Set prompt to return null (user clicked cancel)
    window.prompt.mockReturnValue(null);

    const { result } = renderHook(() => useTags());

    // Load available tags first
    await act(async () => {
      await result.current.fetchTags();
    });

    // Try to add with cancelled prompt
    await act(async () => {
      await result.current.addTag();
    });

    // Verify prompt was called
    expect(window.prompt).toHaveBeenCalledWith('Enter a new tag:');

    // Verify API post was NOT called
    expect(api.post).not.toHaveBeenCalled();

    // Verify states were not updated
    expect(result.current.availableTags).toEqual(mockTags);
    expect(result.current.tags).toEqual([]);
  });

  it('should not add a tag that is already selected', async () => {
    // Set prompt to return an existing tag name
    window.prompt.mockReturnValue('javascript');

    const { result } = renderHook(() => useTags());

    // Load available tags first
    await act(async () => {
      await result.current.fetchTags();
    });

    // First, add the tag
    await act(async () => {
      await result.current.addTag();
    });

    // Now try to add it again
    await act(async () => {
      await result.current.addTag();
    });

    // Verify alert was called
    expect(window.alert).toHaveBeenCalledWith('This tag is already added to the module.');

    // Verify tags state was not updated again
    expect(result.current.tags).toEqual([1]); // Still just the ID of the 'javascript' tag
  });

  it('should remove a tag successfully', async () => {
    const { result } = renderHook(() => useTags());

    // Load available tags first
    await act(async () => {
      await result.current.fetchTags();
    });

    // Add a tag
    await act(async () => {
      window.prompt.mockReturnValue('javascript');
      await result.current.addTag();
    });

    // Verify tag was added
    expect(result.current.tags).toEqual([1]);

    // Remove the tag
    act(() => {
      result.current.removeTag(1);
    });

    // Verify tag was removed
    expect(result.current.tags).toEqual([]);
  });

  it('should ignore removing a tag that does not exist', async () => {
    const { result } = renderHook(() => useTags());

    // Load available tags first
    await act(async () => {
      await result.current.fetchTags();
    });

    // Add a tag
    await act(async () => {
      window.prompt.mockReturnValue('javascript');
      await result.current.addTag();
    });

    // Verify tag was added
    expect(result.current.tags).toEqual([1]);

    // Try to remove a non-existent tag
    act(() => {
      result.current.removeTag(999);
    });

    // Verify tags state was not changed
    expect(result.current.tags).toEqual([1]);
  });

  it('should handle unique constraint violation when adding a tag', async () => {
      // Override the default prompt mock for this specific test
      window.prompt.mockImplementation(() => 'testing');

      // Mock api.post to reject with unique constraint error
      const uniqueConstraintError = {
        response: {
          data: {
            tag: ['tag with this name already exists.']
          }
        }
      };
      api.post.mockRejectedValueOnce(uniqueConstraintError);

      // Render the hook
      const { result } = renderHook(() => useTags());

      // Call addTag which should trigger the error
      await act(async () => {
        await result.current.addTag();
        // Small delay to ensure promises resolve
        await new Promise(resolve => setTimeout(resolve, 0));
      });

      // Verify alert was called with the correct message
      expect(window.alert).toHaveBeenCalledWith('This tag already exists in the system.');

      // Verify fetchTags was called by checking api.get was called
      expect(api.get).toHaveBeenCalledWith('/api/tags/');
  });

  it('should handle other errors when adding a tag', async () => {
    // Mock api.post to reject with a general error
    const generalError = new Error('General API Error');
    api.post.mockRejectedValue(generalError);

    const { result } = renderHook(() => useTags());

    // Should throw the error from addTag
    await expect(async () => {
      await act(async () => {
        await result.current.addTag();
      });
    }).rejects.toThrow('General API Error');

    // Verify error was logged
    expect(console.error).toHaveBeenCalledWith('Error creating tag:', generalError);
  });

  it('should handle case-insensitive tag comparison', async () => {
    // Set prompt to return an existing tag with different case
    window.prompt.mockReturnValue('JAVASCRIPT');

    const { result } = renderHook(() => useTags());

    // Load available tags first
    await act(async () => {
      await result.current.fetchTags();
    });

    // Add the tag with different case
    await act(async () => {
      await result.current.addTag();
    });

    // Verify it matched the existing tag (case-insensitive)
    expect(result.current.tags).toEqual([1]); // The ID of the existing 'javascript' tag
    expect(api.post).not.toHaveBeenCalled(); // No API call to create new tag
  });

  it('should trim whitespace from input tags', async () => {
    // Set prompt to return a tag with whitespace
    window.prompt.mockReturnValue('  new-tag  ');

    // Mock api.post to return a new tag
    const newTag = { id: 4, tag: 'new-tag' };
    api.post.mockResolvedValue({ data: newTag });

    const { result } = renderHook(() => useTags());

    // Load available tags first
    await act(async () => {
      await result.current.fetchTags();
    });

    // Add the tag with whitespace
    await act(async () => {
      await result.current.addTag();
    });

    // Verify API call was made with trimmed tag
    expect(api.post).toHaveBeenCalledWith('/api/tags/', { tag: 'new-tag' });
  });
});