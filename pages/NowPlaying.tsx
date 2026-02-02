
import React, { useState, useEffect } from 'react';
import { Episode } from '../types';
import { getVideoSummary } from '../services/geminiService';

interface NowPlayingProps {
  episode: Episode;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
  currentTime: number;
  duration: number;
  onSkip?: (seconds: number) => void;
}

const NowPlaying: React.FC<NowPlayingProps> = ({ episode, isPlaying, onTogglePlay, onClose, currentTime, duration, onSkip }) => {
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);

  const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '00:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const displayDuration = duration > 0 ? formatTime(duration) : (episode.duration || 'N/A');

  const fetchAiSummary = async () => {
    setLoadingSummary(true);
    const result = await getVideoSummary(episode.title, episode.description);
    setSummary(result);
    setLoadingSummary(false);
  };

  useEffect(() => {
    setSummary(null);
  }, [episode]);

  return (
    <div className="fixed inset-0 bg-slate-900 z-[60] overflow-y-auto px-6 pt-12 pb-24 animate-slideUp">
      <div className="max-w-md mx-auto relative h-full flex flex-col">
        <button 
          onClick={onClose}
          className="absolute top-0 right-0 p-2 text-gray-400 hover:text-white"
        >
          <ChevronDownIcon />
        </button>

        <div className="mt-8 mb-10">
          <img 
            src={episode.coverImage} 
            alt="" 
            className="w-full aspect-square rounded-3xl object-cover shadow-2xl ring-1 ring-white/10" 
          />
        </div>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2 leading-tight">{episode.title}</h1>
          <p className="text-amber-500 font-semibold">{episode.podcastName}</p>
        </div>

        {/* Audio Controls */}
        <div className="space-y-6 mb-10">
          <div className="space-y-2">
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-amber-500 h-full transition-all duration-300" style={{ width: `${Math.min(progress, 100)}%` }}></div>
            </div>
            <div className="flex justify-between text-xs text-gray-500 font-mono">
              <span>{formatTime(currentTime)}</span>
              <span>{displayDuration}</span>
            </div>
          </div>

          <div className="flex items-center justify-between px-4">
             <button 
               onClick={() => onSkip && onSkip(-15)}
               className="text-gray-400 hover:text-white transition-colors"
               title="Skip backward 15 seconds"
             >
               <Back15Icon />
             </button>
             <button className="text-gray-400 hover:text-white transition-colors" title="Previous">
               <PrevIcon />
             </button>
             <button 
               onClick={onTogglePlay}
               className="w-20 h-20 bg-amber-500 rounded-full flex items-center justify-center text-slate-900 shadow-xl hover:scale-105 active:scale-95 transition-all"
             >
                {isPlaying ? <PauseLargeIcon /> : <PlayLargeIcon />}
             </button>
             <button className="text-gray-400 hover:text-white transition-colors" title="Next">
               <NextIcon />
             </button>
             <button 
               onClick={() => onSkip && onSkip(15)}
               className="text-gray-400 hover:text-white transition-colors"
               title="Skip forward 15 seconds"
             >
               <Forward15Icon />
             </button>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="flex justify-around mb-12 py-4 border-t border-b border-slate-800">
          <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-white">
            <SpeedIcon />
            <span className="text-[10px]">1.2x</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-white">
            <ShareIcon />
            <span className="text-[10px]">Share / Wadaag</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-white">
            <HeartIcon />
            <span className="text-[10px]">Favorite / Jecel</span>
          </button>
        </div>

        {/* Audio playback is handled by global AudioPlayer in App.tsx */}

        {/* AI Summary Section */}
        <div className="bg-slate-800/50 rounded-3xl p-6 border border-slate-700 mb-10">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <SparklesIcon />
              <h3 className="font-bold text-amber-500">AI Summary / Soo koobidaha AI</h3>
            </div>
            {!summary && !loadingSummary && (
              <button 
                onClick={fetchAiSummary}
                className="text-[10px] bg-amber-500 text-slate-900 px-3 py-1 rounded-full font-bold"
              >
                Generate / Samee
              </button>
            )}
          </div>
          
          {loadingSummary ? (
            <div className="py-8 flex flex-col items-center gap-3">
               <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
               <p className="text-xs text-gray-400">Analyzing video... / Baarista fiidiyowga...</p>
            </div>
          ) : summary ? (
            <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-line animate-fadeIn">
              {summary}
            </div>
          ) : (
            <p className="text-xs text-gray-500">Get key points with one click using Gemini AI. / Hel dhammaan muhiimada hal gujin oo adeegsiga Gemini AI.</p>
          )}
        </div>
      </div>
    </div>
  );
};

// Icons components
const ChevronDownIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

const PlayLargeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 fill-current" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const PauseLargeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-10 h-10 fill-current" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
  </svg>
);

const Back15Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0019 16V8a1 1 0 00-1.6-.8l-5.334 4zM4.066 11.2a1 1 0 000 1.6l5.334 4A1 1 0 0011 16V8a1 1 0 00-1.6-.8l-5.334 4z" />
  </svg>
);

const Forward15Icon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 005 8v8a1 1 0 001.6.8l5.334-4zM19.934 12.8a1 1 0 000-1.6l-5.334-4A1 1 0 0013 8v8a1 1 0 001.6.8l5.334-4z" />
  </svg>
);

const PrevIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const NextIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const SpeedIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

const ShareIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

const HeartIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-7.714 2.143L11 21l-2.286-6.857L1 12l7.714-2.143L11 3z" />
  </svg>
);

export default NowPlaying;
