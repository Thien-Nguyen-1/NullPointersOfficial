import React from 'react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup ,within} from '@testing-library/react';
import InfosheetContent from '../../components/module-content/InfosheetContent';

const mockOnComplete = vi.fn();

const infosheetData = {
  id: 'doc1',
  title: 'Test Infosheet',
  content: 'This is a test infosheet.',
  documents: [
    {
      id: 'file1',
      file_url: '/files/test.pdf',
      filename: 'test.pdf',
      title: 'Test PDF',
      file_size: 1024,
    },
    {
      id: 'file2',
      file_url: '/files/unsupported.xyz',
      filename: 'unsupported.xyz',
      title: 'Unsupported File',
      file_size: 2048,
    },
  ]
};

const completedContentIds = new Set();

const setup = () => {
  return render(
    <InfosheetContent
      infosheetData={infosheetData}
      completedContentIds={completedContentIds}
      onComplete={mockOnComplete}
    />
  );
};
global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/fake');
global.URL.revokeObjectURL = vi.fn();

describe('InfosheetContent Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it('renders infosheet with documents and content', () => {
    setup();
    expect(screen.getByText('Test Infosheet')).toBeInTheDocument();
    expect(screen.getByText('This is a test infosheet.')).toBeInTheDocument();
    expect(screen.getByText('Test PDF')).toBeInTheDocument();
    expect(screen.getByText('Unsupported File')).toBeInTheDocument();
  });

  it('marks as viewed when button clicked', () => {
    setup();
    const btn = screen.getByText('Mark as Viewed');
    fireEvent.click(btn);
    expect(mockOnComplete).toHaveBeenCalledWith('doc1', { viewed: true });
  });

  
it('opens PDF viewer modal when clicking view button', () => {
    const { container } = setup();
  
    const viewButton = screen.getByTitle('View PDF');
    fireEvent.click(viewButton);
  
    // Scope the query to the modal
    const modal = container.querySelector('.pdf-viewer-modal');
    expect(modal).toBeInTheDocument();
  
    const scoped = within(modal);
    expect(scoped.getByText('Test PDF')).toBeInTheDocument();
  });

  it('formats file size correctly', () => {
    setup();
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    expect(screen.getByText('2 KB')).toBeInTheDocument();
  });

  it('handles non-PDF download flow without crashing', async () => {
    setup();
  
    // Setup fake fetch for download
    const mockBlob = new Blob(['mock content'], { type: 'text/plain' });
    global.fetch = vi.fn(() => Promise.resolve({ ok: true, blob: () => Promise.resolve(mockBlob) }));
  
    // Mock necessary DOM APIs
    const link = document.createElement('a');
    link.click = vi.fn();
    vi.spyOn(document, 'createElement').mockReturnValue(link);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => {});
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => {});
    global.URL.createObjectURL = vi.fn(() => 'blob:http://localhost/fake');
    global.URL.revokeObjectURL = vi.fn();
  
    const downloadButtons = screen.getAllByTitle('Download');
    fireEvent.click(downloadButtons[1]);
  
    // Assert fetch call was made to non-PDF endpoint
    expect(fetch).toHaveBeenCalledWith('http://localhost:8000/files/unsupported.xyz', {
      credentials: 'include',
    });
  
    //expect(link.click).toHaveBeenCalled();
  });
  
//   it('does not crash with missing filename', () => {
//     const data = {
//       ...infosheetData,
//       documents: [ { ...infosheetData.documents[0], filename: undefined } ]
//     };

//    setup();

//     //expect(screen.getByText('Test PDF')).toBeInTheDocument();
//   });

//   it('closes PDF modal when close button clicked', () => {
//     setup();
//     fireEvent.click(screen.getByTitle('View PDF'));
//     const closeButton = screen.getByText('×');
//     fireEvent.click(closeButton);
//     expect(screen.queryByText('×')).not.toBeInTheDocument();
//   });
});