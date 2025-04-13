import React, { useState } from "react";
import { FiMusic, FiPlay, FiPause } from "react-icons/fi";
import AudioPlayer from "../editors/AudioPlayer";

/**
 * Component for rendering audio content in the module
 * 
 * @param {Object} audioData - The audio data to render
 * @param {Set} completedContentIds - Set of IDs of completed content items
 * @param {Function} onComplete - Callback function when content is completed
 */
const AudioContent = ({audioData, completedContentIds, onComplete}) => {
    const [currentlyPlaying, setCurrentlyPlaying] = useState(null);
    
    // Use audio files directly from audioData
    const audioFiles = audioData.audioFiles || [];
    
    const handlePlayAudio = (audio) => {
        const audioId = audio.contentID || audio.id;
        
        // If we're toggling the same audio, turn it off
        if (currentlyPlaying === audioId) {
            setCurrentlyPlaying(null);
            return;
        }
        
        // Otherwise, set this as the currently playing audio
        setCurrentlyPlaying(audioId);
    };
    
    const getAudioUrl = (audio) => {
        // For server-stored files
        const backendUrl = import.meta.env.VITE_API_URL; // Django port
        return audio.file_url && typeof audio.file_url === 'string' && audio.file_url.startsWith('http') 
            ? audio.file_url 
            : `${backendUrl}${audio.file_url}`;
    };
    
    const getFileIcon = (filename) => {
        const extension = filename.split('.').pop().toLowerCase();
        
        switch (extension) {
            case 'mp3':
            case 'wav':
            case 'ogg':
            case 'm4a':
                return <FiMusic className="audio-icon" />;
            default:
                return <FiMusic />;
        }
    };
    
    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    const handleClosePlayer = () => {
        setCurrentlyPlaying(null);
    };

    return (
        <div className="alt-component">
            <div className="alt-component-header">
                <h3>{audioData.title}</h3>
                {completedContentIds.has(audioData.id) && (
                    <span className="completed-check">✓</span>
                )}
            </div>
            <div className="alt-component-content">
                <div className="alt-audio">
                    <p>{audioData.content}</p>
                    
                    {/* Audio files listing */}
                    {audioFiles.length > 0 && (
                        <div className="audio-files-list">
                            <h4>Listen to the audio</h4>
                            <div className="audio-items">
                                {audioFiles.map((audio) => (
                                    <div 
                                        key={audio.contentID || audio.id} 
                                        className={`audio-item ${currentlyPlaying === (audio.contentID || audio.id) ? 'playing' : ''}`}
                                    >
                                        <div className="audio-info">
                                            {getFileIcon(audio.filename)}
                                            <span className="audio-name">{audio.title || audio.filename}</span>
                                            <span className="audio-size">{formatFileSize(audio.file_size)}</span>
                                        </div>
                                        <div className="audio-actions">
                                            <button 
                                                className="play-button" 
                                                onClick={() => handlePlayAudio(audio)}
                                                title={currentlyPlaying === (audio.contentID || audio.id) ? "Pause" : "Play"}
                                            >
                                                {currentlyPlaying === (audio.contentID || audio.id) ? <FiPause /> : <FiPlay />}
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="alt-mark-complete">
                    {!completedContentIds.has(audioData.id) && (
                        <button 
                            className="mark-complete-button"
                            onClick={() => onComplete(audioData.id, { viewed: true })}
                        >
                            Mark as Listened
                        </button>
                    )}
                </div>
            </div>
            
            {/* Audio Player */}
            {currentlyPlaying && audioFiles.length > 0 && (
                <div className="audio-player-container">
                    {audioFiles.map(audio => {
                        const audioId = audio.contentID || audio.id;
                        if (audioId === currentlyPlaying) {
                            return (
                                <AudioPlayer 
                                    key={audioId}
                                    audioUrl={getAudioUrl(audio)}
                                    audioName={audio.title || audio.filename}
                                    onClose={handleClosePlayer}
                                />
                            );
                        }
                        return null;
                    })}
                </div>
            )}
        </div>
    );
};

export default AudioContent;