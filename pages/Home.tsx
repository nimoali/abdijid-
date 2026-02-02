
import React, { useState, useEffect } from 'react';
import { Episode, Podcast } from '../types';
import { YOUTUBE_CHANNEL_NAME, YOUTUBE_CHANNEL_URL } from '../constants';
import { fetchChannelVideos, YouTubeVideo } from '../services/youtubeService';

interface HomeProps {
  onPlayEpisode: (episode: Episode) => void;
  onPodcastClick: (podcast: Podcast) => void;
}

const Home: React.FC<HomeProps> = ({ onPlayEpisode, onPodcastClick }) => {
  const [videos, setVideos] = useState<Episode[]>([]);
  const [popularVideos, setPopularVideos] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadVideos = async () => {
      try {
        setLoading(true);
        
        // Add overall timeout to prevent infinite loading (increased for fetching many videos)
        const timeoutPromise = new Promise<never>((_, reject) => 
          setTimeout(() => reject(new Error('Request timeout')), 30000) // 30 seconds for fetching many videos
        );
        
        // Fetch ALL videos from the channel - try to get as many as possible
        console.log('🚀 Starting to fetch ALL videos from YouTube channel...');
        const youtubeVideos = await Promise.race([
          fetchChannelVideos(500), // Fetch up to 500 videos (or all available)
          timeoutPromise
        ]);
        console.log(`📥 Received ${youtubeVideos.length} videos from YouTube`);
        
        // Convert YouTube videos to Episode format
        const episodes: Episode[] = youtubeVideos.map(video => ({
          id: video.id,
          title: video.title,
          podcastName: video.channelName,
          duration: video.duration,
          coverImage: video.thumbnail,
          audioUrl: '', // YouTube videos don't have direct audio URLs
          videoUrl: video.videoUrl,
          description: video.description,
          channelName: video.channelName,
          publishedAt: video.publishedAt
        }));
        
        if (episodes.length > 0) {
          console.log(`✅ Loaded ${episodes.length} videos total`);
          setVideos(episodes);
          // Popular videos are the most recent ones (first in the list)
          // You can also sort by views/popularity if that data is available
          setPopularVideos(episodes.slice(0, 30)); // Show 30 popular videos in carousel
          console.log(`📺 Displaying ${episodes.length} videos in "All Videos" section`);
          console.log(`⭐ Displaying ${Math.min(30, episodes.length)} videos in "Popular Videos" section`);
        } else {
          console.warn('No videos found from YouTube channel. This might be due to:');
          console.warn('1. CORS restrictions blocking the RSS feed');
          console.warn('2. Channel privacy settings');
          console.warn('3. Network connectivity issues');
          setVideos([]);
          setPopularVideos([]);
        }
      } catch (error: any) {
        console.error('Error loading videos:', error);
        // Only show error for critical issues, not quota (RSS will handle it)
        if (error.message?.includes('API_KEY_INVALID')) {
          setError('API key is invalid. Please check it in services/youtubeHelper.ts');
        } else if (error.message?.includes('API_NOT_ENABLED')) {
          setError('YouTube Data API v3 is not enabled. Enable it at: https://console.cloud.google.com/apis/library/youtube.googleapis.com');
        } else if (error.message === 'Request timeout') {
          setError('Request timed out. Check your network connection.');
        } else {
          // For quota errors and other issues, RSS feed should handle it - don't show error
          setError(null);
        }
        setVideos([]);
        setPopularVideos([]);
      } finally {
        setLoading(false);
      }
    };

    loadVideos();
  }, []);

  return (
    <div className="space-y-10 animate-fadeIn">

      {/* Featured Video Section */}
      {videos.length > 0 && (
        <section className="relative rounded-3xl overflow-hidden shadow-2xl">
          <div className="relative h-[400px] md:h-[500px]">
            <img 
              src={videos[0].coverImage} 
              alt={videos[0].title}
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (target.src.includes('maxresdefault')) {
                  target.src = target.src.replace('maxresdefault', 'hqdefault');
                }
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
              <div className="max-w-3xl">
                <h1 className="text-3xl md:text-4xl font-bold mb-3 leading-tight">{videos[0].title}</h1>
                <p className="text-gray-300 mb-4 line-clamp-2">{videos[0].description || 'Watch this video from Abdijaliil Show'}</p>
                <button 
                  onClick={() => onPlayEpisode(videos[0])}
                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full font-semibold hover:from-pink-600 hover:to-purple-700 transition-all shadow-lg shadow-pink-500/30 flex items-center gap-2"
                >
                  <PlayCircleIcon />
                  <span>Play / Dheh</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="ml-3 text-gray-400">Loading videos from YouTube... / Soo dejinaya fiidiyowyada YouTube...</p>
        </div>
      ) : videos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-2">No Videos Found / Ma jiro fiidiyowyada</h3>
          {error && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4 mb-4 max-w-md">
              <p className="text-red-400 font-semibold mb-2">⚠️ Error:</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
          )}
          <p className="text-gray-400 max-w-md mb-4">
            Unable to load videos from the YouTube channel. This might be due to:
            <br />
            Ma suurtogal ahayn in la soo dejiyo fiidiyowyada kanaalka YouTube. Tani waxay sabab u noqon kartaa:
          </p>
          <div className="text-left text-sm text-gray-400 max-w-md space-y-2">
            <p>• CORS restrictions blocking RSS feed access</p>
            <p>• Network connectivity issues</p>
            <p>• Channel privacy settings</p>
            <p>• RSS feed service temporarily unavailable</p>
            <p className="mt-4 text-amber-500">
              💡 <strong>Tip:</strong> Open browser console (F12) to see detailed error messages
            </p>
            <p className="text-xs text-gray-500 mt-2">
              The app is trying to fetch videos from: <br />
              <code className="text-amber-400 break-all">{YOUTUBE_CHANNEL_URL}</code>
            </p>
            <div className="mt-4 space-y-2">
              <button 
                onClick={() => {
                  // Clear cache and retry
                  window.location.reload();
                }} 
                className="px-4 py-2 bg-amber-500 text-slate-900 rounded-lg font-semibold hover:bg-amber-400 transition-colors"
              >
                Retry / Isku day mar kale
              </button>
              <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <p className="text-xs text-amber-400 font-semibold mb-3">🔧 Quick Fix - Get Channel ID (30 seconds):</p>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-xs text-gray-400 mb-2"><strong>⚡ Fastest Method:</strong></p>
                    <ol className="text-xs text-gray-500 list-decimal list-inside space-y-1 mb-2">
                      <li>Open <a href={YOUTUBE_CHANNEL_URL} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">{YOUTUBE_CHANNEL_URL}</a> in a new tab</li>
                      <li>Press <strong>F12</strong> → Go to <strong>Console</strong> tab</li>
                      <li>Paste this code and press Enter:</li>
                    </ol>
                    <div className="bg-slate-900 p-2 rounded text-xs font-mono text-gray-300 mb-2 overflow-x-auto">
                      document.querySelector('meta[itemprop="channelId"]')?.content
                    </div>
                    <p className="text-xs text-gray-500 mb-3">
                      Copy the result (looks like: <code className="text-amber-400">UCxxxxxxxxxxxxxxxxxxxxx</code>)
                    </p>
                    <p className="text-xs text-gray-400 mb-2">
                      Then run this command in your terminal (replace UC... with your channel ID):
                    </p>
                    <div className="bg-slate-900 p-2 rounded text-xs font-mono text-gray-300 mb-2 overflow-x-auto">
                      node update-channel-id.js UCxxxxxxxxxxxxxxxxxxxxx
                    </div>
                    <p className="text-xs text-gray-400">
                      Or manually update <code className="text-amber-400">services/youtubeHelper.ts</code>:
                    </p>
                    <div className="bg-slate-900 p-2 rounded text-xs font-mono text-gray-300 mt-1">
                      export const MANUAL_CHANNEL_ID = 'UC...';
                    </div>
                  </div>
                  
                  <div className="border-t border-slate-700 pt-3">
                    <p className="text-xs text-gray-400 mb-2"><strong>Alternative:</strong> Enable YouTube Data API v3</p>
                    <p className="text-xs text-amber-400 mb-2">⚠️ Your API quota is currently exceeded. Enable the API to use it:</p>
                    <ol className="text-xs text-gray-500 list-decimal list-inside space-y-1 mb-2">
                      <li>Go to: <a href="https://console.cloud.google.com/apis/library/youtube.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline">Enable YouTube Data API v3</a></li>
                      <li>Make sure project "niama" is selected</li>
                      <li>Click <strong>"Enable"</strong> button</li>
                      <li>Wait a few seconds, then refresh this page</li>
                    </ol>
                    <p className="text-xs text-gray-400 mt-2">
                      Your API key is already set in <code className="text-amber-400">services/youtubeHelper.ts</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
      {/* New Videos Carousel Section */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
            New Videos / Fiidiyowyada cusub
          </h2>
          <button className="text-purple-400 text-sm font-semibold hover:text-purple-300 transition-colors flex items-center gap-2">
            More / In badan
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
        <div className="relative">
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
            {videos.slice(1).map((episode) => (
              <div 
                key={episode.id}
                onClick={() => onPlayEpisode(episode)}
                className="min-w-[280px] md:min-w-[320px] bg-black/30 backdrop-blur-sm border border-purple-500/20 rounded-2xl overflow-hidden cursor-pointer hover:border-purple-400/40 hover:scale-[1.02] transition-all group shadow-lg snap-start flex-shrink-0"
              >
                <div className="relative aspect-video">
                  <img 
                    src={episode.coverImage} 
                    alt={episode.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src.includes('maxresdefault')) {
                        target.src = target.src.replace('maxresdefault', 'hqdefault');
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center">
                      <PlayCircleIcon />
                    </div>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-semibold text-sm mb-2 line-clamp-2">{episode.title}</h3>
                  <p className="text-xs text-gray-400">{episode.podcastName}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Popular Videos Carousel */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
            Popular Videos / Fiidiyowyada caanka ah
          </h2>
        </div>
        {popularVideos.length > 0 ? (
          <div className="relative">
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory">
              {popularVideos.map((video) => (
                <div 
                  key={video.id} 
                  onClick={() => onPlayEpisode(video)}
                  className="min-w-[200px] md:min-w-[240px] cursor-pointer group flex-shrink-0 snap-start"
                >
                <div className="relative aspect-square mb-3 rounded-2xl overflow-hidden border border-purple-500/20 group-hover:border-purple-400/40 transition-all">
                  <img 
                    src={video.coverImage} 
                    alt={video.title} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src.includes('maxresdefault')) {
                        target.src = target.src.replace('maxresdefault', 'hqdefault');
                      }
                    }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <div className="absolute bottom-3 left-3 w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white shadow-xl opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all">
                    <PlayIcon />
                  </div>
                </div>
                  <h3 className="font-bold text-sm md:text-base mb-1 line-clamp-2">{video.title}</h3>
                  <p className="text-xs text-gray-400 truncate">{video.channelName || video.podcastName}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No popular videos available / Ma jiro fiidiyowyada caanka ah</p>
        )}
      </section>

      {/* All Videos List */}
      <section className="pb-10">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-purple-300 to-pink-300 bg-clip-text text-transparent">
            All Videos / Dhammaan Fiidiyowyada
          </h2>
        </div>
        <div className="space-y-3">
          {videos.map((episode) => (
            <div 
              key={episode.id}
              onClick={() => onPlayEpisode(episode)}
              className="flex items-center gap-4 p-4 bg-black/20 backdrop-blur-sm border border-purple-500/10 hover:border-purple-400/30 rounded-xl cursor-pointer transition-all group"
            >
              <div className="relative w-20 h-20 flex-shrink-0">
                <img 
                  src={episode.coverImage} 
                  alt={episode.title}
                  className="w-full h-full rounded-lg object-cover" 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src.includes('maxresdefault')) {
                      target.src = target.src.replace('maxresdefault', 'hqdefault');
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-lg transition-opacity">
                  <PlayIcon />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1 line-clamp-2">{episode.title}</h4>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{episode.podcastName}</span>
                  <span>•</span>
                  <span>{episode.duration}</span>
                </div>
              </div>
              <button 
                className="p-2 text-gray-500 hover:text-purple-400 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <DotsIcon />
              </button>
            </div>
          ))}
        </div>
      </section>
        </>
      )}
    </div>
  );
};

const PlayCircleIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const PlayIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 fill-current" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
  </svg>
);

const DotsIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
  </svg>
);

export default Home;
