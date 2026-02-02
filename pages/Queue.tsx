
import React, { useState, useEffect } from 'react';
import { Episode } from '../types';
import { fetchChannelVideos } from '../services/youtubeService';

interface QueueProps {
  currentEpisodeId: string | undefined;
  onPlayEpisode: (episode: Episode) => void;
}

const Queue: React.FC<QueueProps> = ({ currentEpisodeId, onPlayEpisode }) => {
  const [videos, setVideos] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true);
        const youtubeVideos = await fetchChannelVideos(500); // Fetch all available videos
        
        const episodes: Episode[] = youtubeVideos.map(video => ({
          id: video.id,
          title: video.title,
          podcastName: video.channelName,
          duration: video.duration,
          coverImage: video.thumbnail,
          audioUrl: '',
          videoUrl: video.videoUrl,
          description: video.description,
          channelName: video.channelName,
          publishedAt: video.publishedAt
        }));
        
        setVideos(episodes);
      } catch (error) {
        console.error('Error loading videos:', error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <header className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Queue / Liiska</h1>
        <button className="text-amber-500 text-sm font-semibold hover:underline">Clear All / Nadiifi dhammaan</button>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : videos.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <p>No videos in queue / Ma jiro fiidiyowyada liiska</p>
        </div>
      ) : (
        <div className="space-y-3">
          {videos.map((episode, index) => {
          const isActive = episode.id === currentEpisodeId;
          return (
            <div 
              key={episode.id}
              onClick={() => onPlayEpisode(episode)}
              className={`flex items-center gap-4 p-4 rounded-2xl transition-all cursor-pointer group ${isActive ? 'bg-slate-800 border-l-4 border-amber-500 shadow-xl' : 'hover:bg-slate-800/40'}`}
            >
              <div className="text-gray-600 text-sm font-mono w-6 text-center group-hover:hidden">
                {String(index + 1).padStart(2, '0')}
              </div>
              <div className="hidden group-hover:block w-6 text-amber-500">
                <PlayIconSmall />
              </div>
              
              <img 
                src={episode.coverImage} 
                alt={episode.title}
                className="w-12 h-12 rounded-lg object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src.includes('maxresdefault')) {
                    target.src = target.src.replace('maxresdefault', 'hqdefault');
                  }
                }}
              />
              
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-semibold truncate ${isActive ? 'text-amber-500' : 'text-white'}`}>
                  {episode.title}
                </h4>
                <p className="text-xs text-gray-400 truncate">{episode.podcastName}</p>
              </div>
              
              <div className="text-xs text-gray-500 font-mono">
                {episode.duration}
              </div>
              
              <button className="p-2 text-gray-600 hover:text-white">
                <DotsIcon />
              </button>
            </div>
          );
        })}
        </div>
      )}

      <div className="mt-12 bg-amber-500/10 border border-amber-500/20 p-6 rounded-3xl flex flex-col items-center text-center">
        <div className="w-12 h-12 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-500 mb-4">
           <AiIcon />
        </div>
        <h3 className="font-bold text-lg mb-2 text-amber-500">Smart Queue / Liiska Fikradaha</h3>
        <p className="text-gray-400 text-sm max-w-xs">
          Abdijaliil uses AI to suggest videos similar to what you like. / Abdijaliil waxay adeegsataa AI si ay u soo jeediso fiidiyowyada oo u eg waxa aad jeceshahay.
        </p>
      </div>
    </div>
  );
};

const PlayIconSmall = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const DotsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

const AiIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);

export default Queue;
