
import React, { useState, useEffect } from 'react';
import { Episode } from '../types';

interface PlayerBarProps {
  currentEpisode: Episode | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onExpand: () => void;
  currentTime: number;
  duration: number;
}

const PlayerBar: React.FC<PlayerBarProps> = ({ currentEpisode, isPlaying, onTogglePlay, onExpand, currentTime, duration }) => {
  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayDuration = duration > 0 ? formatTime(duration) : (currentEpisode?.duration || 'N/A');

  if (!currentEpisode) return null;

  return (
    <div className="fixed bottom-16 left-0 right-0 bg-black/60 backdrop-blur-xl border-t border-purple-500/30 px-4 py-3 z-40 md:bottom-0 md:px-8 shadow-2xl">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        
        <div className="flex items-center gap-3 flex-1 min-w-0" onClick={onExpand}>
          <img src={currentEpisode.coverImage} alt="" className="w-14 h-14 rounded-xl object-cover shadow-lg border border-purple-500/20" />
          <div className="min-w-0">
            <h4 className="text-white text-sm font-semibold truncate">{currentEpisode.title}</h4>
            <p className="text-gray-400 text-xs truncate">{currentEpisode.podcastName}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="hidden md:block text-gray-400 hover:text-purple-400 transition-colors">
            <PrevIcon />
          </button>
          
          <button 
            onClick={onTogglePlay}
            className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-pink-500/30 hover:scale-105 transition-transform"
          >
            {isPlaying ? <PauseIcon /> : <PlayIcon />}
          </button>
          
          <button className="hidden md:block text-gray-400 hover:text-purple-400 transition-colors">
            <NextIcon />
          </button>
        </div>

        <div className="hidden md:flex flex-col gap-1 flex-1 max-w-md">
          <div className="flex justify-between text-[10px] text-gray-400">
            <span>{formatTime(currentTime)}</span>
            <span>{displayDuration}</span>
          </div>
          <div className="w-full bg-purple-900/30 h-1.5 rounded-full overflow-hidden">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 h-full transition-all duration-300" style={{ width: `${Math.min(progress, 100)}%` }}></div>
          </div>
        </div>

        <div className="hidden lg:flex items-center gap-3">
          <button className="text-gray-400 hover:text-purple-400 transition-colors">
            <ShareIcon />
          </button>
          <button className="text-gray-400 hover:text-purple-400 transition-colors">
            <VolumeIcon />
          </button>
        </div>

      </div>
    </div>
  );
};

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 fill-current" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const PauseIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 fill-current" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const PrevIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
  </svg>
);

const NextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 005 8v8a1 1 0 001.6.8l5.334-4zM19.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" />
  </svg>
);

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const VolumeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
  </svg>
);

export default PlayerBar;
