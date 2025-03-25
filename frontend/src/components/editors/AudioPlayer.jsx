// A reusable audio player component
// A reusable audio player component
import React, { useState, useRef, useEffect } from 'react';
import { FiPlay, FiPause, FiVolume2, FiVolumeX, FiX } from 'react-icons/fi';
import styles from '../../styles/AudioPlayer.module.css';

const AudioPlayer = ({ audioUrl, audioName, onClose }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const volumeBarRef = useRef(null);
  const animationRef = useRef(null);

  // Initialize audio
  useEffect(() => {
    const audio = audioRef.current;
    
    // Handle backend URL formatting for audio source
    const backendUrl = "http://localhost:8000"; // Adjust to your Django port
    const formattedUrl = typeof audioUrl === 'string' ? 
      (audioUrl.startsWith('http') ? audioUrl : `${backendUrl}${audioUrl}`) : null;
    
    if (!formattedUrl) {
      setError("Invalid audio URL");
      setIsLoading(false);
      return;
    }
    
    audio.src = formattedUrl;
    audio.volume = volume;
    
    // When audio metadata is loaded
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    
    // Error handling
    const handleError = (e) => {
      setError("Failed to load audio file.");
      setIsLoading(false);
      console.error("Audio loading error:", e);
    };
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('error', handleError);
    
    // Clean up
    return () => {
      cancelAnimationFrame(animationRef.current);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, [audioUrl]);

  // Toggle play/pause
  const togglePlayPause = () => {
    const prevValue = isPlaying;
    setIsPlaying(!prevValue);
    
    if (!prevValue) {
      audioRef.current.play();
      animationRef.current = requestAnimationFrame(updateProgress);
    } else {
      audioRef.current.pause();
      cancelAnimationFrame(animationRef.current);
    }
  };

  // Update progress bar as audio plays
  const updateProgress = () => {
    const time = audioRef.current.currentTime;
    setCurrentTime(time);
    animationRef.current = requestAnimationFrame(updateProgress);
  };

  // Handle seeking in the progress bar
  const handleSeek = (e) => {
    const width = progressBarRef.current.clientWidth;
    const clickX = e.nativeEvent.offsetX;
    const seekTime = (clickX / width) * duration;
    
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  // Handle volume change
  const handleVolumeChange = (e) => {
    const width = volumeBarRef.current.clientWidth;
    const clickX = e.nativeEvent.offsetX;
    const newVolume = Math.max(0, Math.min(1, clickX / width));
    
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  // Handle mute toggle
  const toggleMute = () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    
    if (newMuted) {
      audioRef.current.volume = 0;
    } else {
      audioRef.current.volume = volume;
    }
  };

  // Format time display (mm:ss)
  const formatTime = (time) => {
    if (isNaN(time)) return "00:00";
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Handle audio end
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
    cancelAnimationFrame(animationRef.current);
  };

  return (
    <div className={styles.audioPlayer}>
      <div className={styles.header}>
        <div className={styles.audioTitle}>
          {audioName}
        </div>
        <button className={styles.closeButton} onClick={onClose}>
          <FiX />
        </button>
      </div>
      
      {isLoading ? (
        <div className={styles.loadingState}>Loading audio...</div>
      ) : error ? (
        <div className={styles.errorState}>{error}</div>
      ) : (
        <div className={styles.controls}>
          <div className={styles.mainControls}>
            <button 
              className={styles.playPauseButton} 
              onClick={togglePlayPause}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <FiPause /> : <FiPlay />}
            </button>
            
            <div className={styles.timeInfo}>
              <span>{formatTime(currentTime)}</span>
              <span>/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>
          
          <div 
            className={styles.progressContainer} 
            onClick={handleSeek}
            ref={progressBarRef}
          >
            <div 
              className={styles.progressBar}
              style={{ width: `${(currentTime / duration) * 100}%` }}
            />
          </div>
          
          <div className={styles.volumeControls}>
            <button 
              className={styles.muteButton} 
              onClick={toggleMute}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <FiVolumeX /> : <FiVolume2 />}
            </button>
            
            <div 
              className={styles.volumeBar} 
              onClick={handleVolumeChange}
              ref={volumeBarRef}
            >
              <div 
                className={styles.volumeLevel}
                style={{ width: `${isMuted ? 0 : volume * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
      
      <audio 
        ref={audioRef}
        onEnded={handleEnded}
        onTimeUpdate={() => setCurrentTime(audioRef.current.currentTime)}
      />
    </div>
  );
};

export default AudioPlayer;