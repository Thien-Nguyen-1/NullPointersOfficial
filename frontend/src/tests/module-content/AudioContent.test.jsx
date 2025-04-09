import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, fireEvent, cleanup, screen } from '@testing-library/react';
import AudioContent from '../../components/module-content/AudioContent'; // Update the path as needed
import { FiMusic } from 'react-icons/fi';

const audioData = {
    id: 'audio1',
    title: 'Test Audio',
    content: 'This is a test audio description.',
    audioFiles: [
        { contentID: '1', file_url: '/audio/test1.mp3', filename: 'test1.mp3', title: 'Test Audio 1', file_size: 1024 },
        { contentID: '2', file_url: '/audio/test2.mp3', filename: 'test2.mp3', title: 'Test Audio 2', file_size: 2048 },
        { contentID: '3', file_url: '/audio/test3.mp3', filename: 'test3.mp3', title: 'Test Audio 3', file_size: 0 },  // 0 byte file
        //{ contentID: '4', file_url: '/audio/test4.unknown', filename: 'test4.unknown', title: 'Unknown Audio 4', file_size: 1024 }  // Unsupported file extension

      
    ]
};

const completedContentIds = new Set();

const mockOnComplete = vi.fn();

// Helper to setup the render
const setup = () => render(
    <AudioContent
        audioData={audioData}
        completedContentIds={completedContentIds}
        onComplete={mockOnComplete}
    />
);

describe('AudioContent Component', () => {
    afterEach(cleanup);

    it('renders correctly with initial data', () => {
        setup();
        expect(screen.getByText('Test Audio')).toBeInTheDocument();
        expect(screen.getByText('This is a test audio description.')).toBeInTheDocument();
    });
});

it('handles play/pause audio correctly', async () => {
    setup();
    const playButton = screen.getAllByTitle('Play')[0];
    fireEvent.click(playButton);
    expect(playButton).toHaveAttribute('title', 'Pause');

    // Simulate pause
    fireEvent.click(playButton);
    expect(playButton).toHaveAttribute('title', 'Play');
});

it('marks audio as listened', () => {
    setup();
    const markAsListenedButton = screen.getByText('Mark as Listened');
    fireEvent.click(markAsListenedButton);
    expect(mockOnComplete).toHaveBeenCalledWith(audioData.id, { viewed: true });
});

it('displays audio player when an audio is played', () => {
    const { container } = setup();
    fireEvent.click(screen.getAllByTitle('Play')[0]);
    expect(container.querySelector('.audio-player-container')).toBeInTheDocument();
});

it('formats file size correctly', () => {
    setup();
    expect(screen.getByText('1 KB')).toBeInTheDocument();
    expect(screen.getByText('2 KB')).toBeInTheDocument();
});



it('stops playing audio when handleClosePlayer is invoked', async () => {
    setup();

    const playButtons = screen.getAllByTitle('Play');
    fireEvent.click(playButtons[0]);  

    const pauseButtons = screen.getAllByTitle('Pause');
    fireEvent.click(pauseButtons[0]); 

    const audioPlayer = screen.queryByTestId('audio-player-container');  
    expect(audioPlayer).not.toBeInTheDocument(); 

}); 
it('correctly formats file sizes from bytes to gigabytes', () => {
    setup();
   

    const fileSizeDisplays = screen.getAllByText(/KB/); 
    expect(fileSizeDisplays.length).toBe(2);
    expect(fileSizeDisplays[0]).toHaveTextContent('1 KB');
    expect(fileSizeDisplays[1]).toHaveTextContent('2 KB');
});

it('correctly formats file sizes including zero bytes', () => {
    setup();
    expect(screen.getByText('0 Bytes')).toBeInTheDocument(); 
});


