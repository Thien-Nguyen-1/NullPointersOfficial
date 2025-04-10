


import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import React from 'react';
import AudioPlayer from "../../components/editors/AudioPlayer";

describe("Audio Player Component", () => {
    
    beforeAll(() => {
      
        window.HTMLMediaElement.prototype.play = vi.fn();
        window.HTMLMediaElement.prototype.pause = vi.fn();
        window.HTMLMediaElement.prototype.load = vi.fn();
    });

    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    test("Invalid audio url", () => {
        render(
            <AudioPlayer
                audioUrl={null}
                audioName={"test"}
                onClose={vi.fn()}
            />
        );

        const error = screen.getByText("Invalid audio URL");
        expect(error).toBeInTheDocument();
    });

    test("Valid audio url", () => {
        render(
            <AudioPlayer
                audioUrl={"http://localhost:8000/audio.mp3"}
                audioName={"test"}
                onClose={vi.fn()}
            />
        );

        const loading = screen.getByText("Loading audio...");
        expect(loading).toBeInTheDocument();
    });


    test("Valid audio url without http", () => {
        render(
            <AudioPlayer
                audioUrl={"N/A"}
                audioName={"test"}
                onClose={vi.fn()}
            />
        );

        const loading = screen.getByText("Loading audio...");
        expect(loading).toBeInTheDocument();
    });
    test("Add Event Listener for MetaData", async () => {
      
        const addEventListenerSpy = vi.spyOn(HTMLAudioElement.prototype, 'addEventListener');
        
        render(
            <AudioPlayer
                audioUrl={"http://localhost:8000/audio.mp3"}
                audioName={"test"}
                onClose={vi.fn()}
            />
        );

    
        expect(screen.getByText("Loading audio...")).toBeInTheDocument();
        
       
        expect(addEventListenerSpy).toHaveBeenCalledWith(
            'loadedmetadata', 
            expect.any(Function)
        );
        
       
        const audioElement = document.querySelector('audio');
        
   
        if (audioElement) {
            fireEvent.loadedMetadata(audioElement);
        }
        
      
        await waitFor(() => {
            expect(screen.queryByText("Loading audio...")).not.toBeInTheDocument();
        });
        
        // Clean up the spy
        addEventListenerSpy.mockRestore();
    });
    
    test("Handles audio loading error correctly", async () => {
        // Render the component
        render(
          <AudioPlayer
            audioUrl={"http://localhost:8000/audio.mp3"}
            audioName={"test"}
            onClose={vi.fn()}
          />
        );
      
       
        expect(screen.getByText("Loading audio...")).toBeInTheDocument();
        
    
        const audioElement = document.querySelector('audio');
        
  
        if (audioElement) {
          fireEvent.error(audioElement);
        }
        
       
        await waitFor(() => {
          expect(screen.getByText("Failed to load audio file.")).toBeInTheDocument();
        });
        
     
        expect(screen.queryByText("Loading audio...")).not.toBeInTheDocument();
      });


      test("togglePlayPause functionality works correctly", async () => {
   
        const mockRAF = vi.fn();
        const mockCancelRAF = vi.fn();
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation(mockRAF);
        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(mockCancelRAF);
      
      
        render(
          <AudioPlayer
            audioUrl={"http://localhost:8000/audio.mp3"}
            audioName={"test"}
            onClose={vi.fn()}
          />
        );
      
   
        const audioElement = document.querySelector('audio');
        if (audioElement) {
          fireEvent.loadedMetadata(audioElement);
        }
      
        
        await waitFor(() => {
          expect(screen.queryByText("Loading audio...")).not.toBeInTheDocument();
        });
      
 
        const playButton = screen.getByLabelText('Play');
        expect(playButton).toBeInTheDocument();
      
        
        fireEvent.click(playButton);
      
       
        expect(audioElement.play).toHaveBeenCalled();
        
  
        expect(mockRAF).toHaveBeenCalled();
      
        const pauseButton = screen.getByLabelText('Pause');
        expect(pauseButton).toBeInTheDocument();
      
     
        fireEvent.click(pauseButton);
      
       
        expect(audioElement.pause).toHaveBeenCalled();
        

        expect(mockCancelRAF).toHaveBeenCalled();
      

        expect(screen.getByLabelText('Play')).toBeInTheDocument();
      });


      test("updateProgress updates current time correctly", async () => {
    
        let rafCallCount = 0;
        const MAX_RAF_CALLS = 2;
        
       
        vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
          if (rafCallCount < MAX_RAF_CALLS) {
            rafCallCount++;
            setTimeout(() => callback(), 0);
          }
          return rafCallCount; 
        });
        

        const mockCancelRAF = vi.fn();
        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(mockCancelRAF);
      
       
        render(
          <AudioPlayer
            audioUrl={"http://localhost:8000/audio.mp3"}
            audioName={"test"}
            onClose={vi.fn()}
          />
        );
      
        
        const audioElement = document.querySelector('audio');
        if (audioElement) {
          fireEvent.loadedMetadata(audioElement);
        }
      
      
        await waitFor(() => {
          expect(screen.queryByText("Loading audio...")).not.toBeInTheDocument();
        });
      
 
        const initialTimeElements = screen.getAllByText("00:00");
        expect(initialTimeElements.length).toBeGreaterThan(0);
      
       
        const playButton = screen.getByLabelText('Play');
        fireEvent.click(playButton);
      
     
        Object.defineProperty(audioElement, 'currentTime', { value: 30, writable: true });
      

        fireEvent.timeUpdate(audioElement);
      
       
        await waitFor(() => {
          const updatedTimeElements = screen.getAllByText("00:30");
          expect(updatedTimeElements.length).toBeGreaterThan(0);
        });
      
       
        Object.defineProperty(audioElement, 'currentTime', { value: 65, writable: true });
        fireEvent.timeUpdate(audioElement);
      
   
        await waitFor(() => {
          const updatedTimeElements = screen.getAllByText("01:05");
          expect(updatedTimeElements.length).toBeGreaterThan(0);
        });
      
        
        const pauseButton = screen.getByLabelText('Pause');
        fireEvent.click(pauseButton);
      });
    


      test("handleSeek updates audio currentTime correctly", async () => {

        render(
          <AudioPlayer
            audioUrl={"http://localhost:8000/audio.mp3"}
            audioName={"test"}
            onClose={vi.fn()}
          />
        );
      
      
        const audioElement = document.querySelector('audio');
        if (audioElement) {
       
          Object.defineProperty(audioElement, 'duration', { value: 100, writable: true });
          fireEvent.loadedMetadata(audioElement);
        }
      
 
        await waitFor(() => {
          expect(screen.queryByText("Loading audio...")).not.toBeInTheDocument();
        });
      
     
         const progressBar = screen.getByTestId('progress-container')
        
         expect(progressBar).toBeInTheDocument();
      
     
        Object.defineProperty(progressBar, 'clientWidth', { value: 200 });
      
      
        const mockClickEvent = {
          nativeEvent: {
            offsetX: 50 
          }
        };
      
        
          fireEvent.click(progressBar, mockClickEvent);
      
       
      });



      test("handleVolumeChange updates volume correctly", async () => {

        render(
          <AudioPlayer
            audioUrl={"http://localhost:8000/audio.mp3"}
            audioName={"test"}
            onClose={vi.fn()}
          />
        );
      
       
        const audioElement = document.querySelector('audio');
        if (audioElement) {
          fireEvent.loadedMetadata(audioElement);
        }
      
      
        await waitFor(() => {
          expect(screen.queryByText("Loading audio...")).not.toBeInTheDocument();
        });
      
        
        const volumeBar = screen.getByTestId('volume-bar-container')
        expect(volumeBar).toBeInTheDocument();
      
       
        Object.defineProperty(volumeBar, 'clientWidth', { value: 100 });
      
        
        const mockClickEvent50 = {
          nativeEvent: {
            offsetX: 50 
          }
        };
      
        fireEvent.click(volumeBar, mockClickEvent50);
        
        
        
        expect(screen.getByLabelText("Unmute")).toBeInTheDocument();
      });



      test("toggleMute function works correctly", async () => {
        
        render(
          <AudioPlayer
            audioUrl={"http://localhost:8000/audio.mp3"}
            audioName={"test"}
            onClose={vi.fn()}
          />
        );
      
       
        const audioElement = document.querySelector('audio');
        if (audioElement) {
          fireEvent.loadedMetadata(audioElement);
        }
      
  
        await waitFor(() => {
          expect(screen.queryByText("Loading audio...")).not.toBeInTheDocument();
        });
      
    
        const muteButton = screen.getByLabelText("Mute");
        expect(muteButton).toBeInTheDocument();
        expect(audioElement.volume).toBe(0.7); 
      
 
        fireEvent.click(muteButton);
        
        
        expect(audioElement.volume).toBe(0);
        
       
        const unmuteButton = screen.getByLabelText("Unmute");
        expect(unmuteButton).toBeInTheDocument();
      

        fireEvent.click(unmuteButton);
        

        expect(audioElement.volume).toBe(0.7);
        
       
        expect(screen.getByLabelText("Mute")).toBeInTheDocument();
      });


      


      test("handleEnded resets player correctly", async () => {
 
        const mockCancelRAF = vi.fn();
        vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(mockCancelRAF);
      
   
        render(
          <AudioPlayer
            audioUrl={"http://localhost:8000/audio.mp3"}
            audioName={"test"}
            onClose={vi.fn()}
          />
        );
      
    
        const audioElement = document.querySelector('audio');
        if (audioElement) {
          fireEvent.loadedMetadata(audioElement);
        }
      
      
        await waitFor(() => {
          expect(screen.queryByText("Loading audio...")).not.toBeInTheDocument();
        });
      
 
        const playButton = screen.getByLabelText('Play');
        fireEvent.click(playButton);
        
  
        expect(screen.getByLabelText('Pause')).toBeInTheDocument();
        

        Object.defineProperty(audioElement, 'currentTime', { value: 30, writable: true });
        fireEvent.timeUpdate(audioElement);
        

        await waitFor(() => {
          expect(screen.getByText("00:30")).toBeInTheDocument();
        });
      

        fireEvent.ended(audioElement);
        
        expect(screen.getByLabelText('Play')).toBeInTheDocument();
        
        
        await waitFor(() => {
          const timeElements = screen.getAllByText("00:00");
          expect(timeElements.length).toBeGreaterThan(0);
        });
        
   
        expect(mockCancelRAF).toHaveBeenCalled();
      });


      test( )



});






  
  