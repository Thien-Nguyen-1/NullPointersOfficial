import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import React from 'react';
import InlineRichTextEditor from '../../../components/superadmin-settings/InlineRichTextEditor';

// Mock execCommand since it's not available in jsdom
document.execCommand = vi.fn();

describe('InlineRichTextEditor', () => {
  // Setup before each test
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test initialization - Happy path
  it('should render with initial content', () => {
    const initialContent = '<p>Initial text</p>';
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(
      <InlineRichTextEditor
        initialContent={initialContent}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    // Check that the editor toolbar and buttons are rendered
    expect(screen.getByText('Bold')).toBeInTheDocument();
    expect(screen.getByText('List')).toBeInTheDocument();
    expect(screen.getByText('Align')).toBeInTheDocument();
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();

    // Check that editor content area is set up with initial content
    const editorContent = document.querySelector('.editor-content');
    expect(editorContent).toBeInTheDocument();
    expect(editorContent.innerHTML).toBe(initialContent);
  });

  // Test initialization with no content - Branch condition
  it('should initialize with empty content when no initialContent is provided', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<InlineRichTextEditor onSave={onSave} onCancel={onCancel} />);

    const editorContent = document.querySelector('.editor-content');
    expect(editorContent).toBeInTheDocument();
    expect(editorContent.innerHTML).toBe('');
  });

  // Test formatting buttons - Happy path
  it('should apply formatting when toolbar buttons are clicked', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<InlineRichTextEditor onSave={onSave} onCancel={onCancel} />);

    // Click Bold button
    fireEvent.click(screen.getByTitle('Bold'));
    expect(document.execCommand).toHaveBeenCalledWith('bold', false, null);

    // Click Italic button
    fireEvent.click(screen.getByTitle('Italic'));
    expect(document.execCommand).toHaveBeenCalledWith('italic', false, null);

    // Click Underline button
    fireEvent.click(screen.getByTitle('Underline'));
    expect(document.execCommand).toHaveBeenCalledWith('underline', false, null);
  });

  // Test dropdown buttons - List dropdown
  it('should show list options when List button is clicked', async () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<InlineRichTextEditor onSave={onSave} onCancel={onCancel} />);

    // List dropdown is initially hidden
    expect(screen.queryByText('Bullet List')).not.toBeInTheDocument();

    // Click List button
    fireEvent.click(screen.getByText('List'));

    // Dropdown should now be visible
    expect(screen.getByText('Bullet List')).toBeInTheDocument();
    expect(screen.getByText('Numbered List')).toBeInTheDocument();

    // Click Bullet List option
    fireEvent.click(screen.getByText('Bullet List'));
    expect(document.execCommand).toHaveBeenCalledWith('insertUnorderedList', false, null);

    // Dropdown should be closed after selection
    await waitFor(() => {
      expect(screen.queryByText('Bullet List')).not.toBeInTheDocument();
    });
  });

  // Test dropdown buttons - Align dropdown
  it('should show alignment options when Align button is clicked', async () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<InlineRichTextEditor onSave={onSave} onCancel={onCancel} />);

    // Alignment dropdown is initially hidden
    expect(screen.queryByText('Left')).not.toBeInTheDocument();

    // Click Align button
    fireEvent.click(screen.getByText('Align'));

    // Dropdown should now be visible
    expect(screen.getByText('Left')).toBeInTheDocument();
    expect(screen.getByText('Center')).toBeInTheDocument();
    expect(screen.getByText('Right')).toBeInTheDocument();
    expect(screen.getByText('Justify')).toBeInTheDocument();

    // Click Center option
    fireEvent.click(screen.getByText('Center'));
    expect(document.execCommand).toHaveBeenCalledWith('justifyCenter', false, null);

    // Dropdown should be closed after selection
    await waitFor(() => {
      expect(screen.queryByText('Left')).not.toBeInTheDocument();
    });
  });

  // Test font size selection - Happy path
  it('should apply font size when selected from dropdown', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<InlineRichTextEditor onSave={onSave} onCancel={onCancel} />);

    // Change font size to Small
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '0.875rem' } });
    expect(document.execCommand).toHaveBeenCalledWith('fontSize', false, '2');

    // Change font size to Large
    fireEvent.change(screen.getByRole('combobox'), { target: { value: '1.25rem' } });
    expect(document.execCommand).toHaveBeenCalledWith('fontSize', false, '5');
  });

  // Test content change - Happy path
  it('should update content state when input occurs', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<InlineRichTextEditor onSave={onSave} onCancel={onCancel} />);

    const editorContent = document.querySelector('.editor-content');

    // Simulate typing in the editor
    editorContent.innerHTML = '<p>New content</p>';
    fireEvent.input(editorContent);

    // Test that save button captures current content
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave).toHaveBeenCalledWith('<p>New content</p>');
  });

  // Test save functionality - Happy path
  it('should call onSave with current content when Save button is clicked', () => {
    const initialContent = '<p>Initial text</p>';
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(
      <InlineRichTextEditor
        initialContent={initialContent}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    // Click save without changing content
    fireEvent.click(screen.getByText('Save Changes'));
    expect(onSave).toHaveBeenCalledWith(initialContent);
  });

  // Test cancel functionality - Happy path
  it('should call onCancel when Cancel button is clicked', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<InlineRichTextEditor onSave={onSave} onCancel={onCancel} />);

    // Click cancel button
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  // Test clicking outside to close dropdowns - Branch condition
  it('should close dropdown menus when clicking outside', async () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<InlineRichTextEditor onSave={onSave} onCancel={onCancel} />);

    // Open List dropdown
    fireEvent.click(screen.getByText('List'));
    expect(screen.getByText('Bullet List')).toBeInTheDocument();

    // Click outside (on Save button)
    fireEvent.mouseDown(document.body);

    // Dropdown should close
    await waitFor(() => {
      expect(screen.queryByText('Bullet List')).not.toBeInTheDocument();
    });
  });

  // Test toggling dropdowns - Branch condition
  it('should toggle dropdowns when clicking their buttons', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    render(<InlineRichTextEditor onSave={onSave} onCancel={onCancel} />);

    // Open List dropdown
    fireEvent.click(screen.getByText('List'));
    expect(screen.getByText('Bullet List')).toBeInTheDocument();

    // Click again to close
    fireEvent.click(screen.getByText('List'));
    expect(screen.queryByText('Bullet List')).not.toBeInTheDocument();

    // Opening one dropdown should close the other
    fireEvent.click(screen.getByText('List'));
    expect(screen.getByText('Bullet List')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Align'));
    expect(screen.queryByText('Bullet List')).not.toBeInTheDocument();
    expect(screen.getByText('Left')).toBeInTheDocument();
  });

  // Test editor focus behavior - Edge case
  it('should focus the editor on mount', () => {
    const initialContent = '<p>Test</p>';
    const onSave = vi.fn();
    const onCancel = vi.fn();

    // Mock focus method
    const focusMock = vi.fn();
    HTMLElement.prototype.focus = focusMock;

    render(
      <InlineRichTextEditor
        initialContent={initialContent}
        onSave={onSave}
        onCancel={onCancel}
      />
    );

    // Check if focus was called on the editor element
    expect(focusMock).toHaveBeenCalled();
  });

  // Test cleanup of event listeners - Edge case
  it('should clean up event listeners on unmount', () => {
    const onSave = vi.fn();
    const onCancel = vi.fn();

    // Spy on addEventListener and removeEventListener
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const removeEventListenerSpy = vi.spyOn(document, 'removeEventListener');

    const { unmount } = render(
      <InlineRichTextEditor onSave={onSave} onCancel={onCancel} />
    );

    expect(addEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));

    // Unmount component
    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
  });
});