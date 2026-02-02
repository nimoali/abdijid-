
import React, { useState, useEffect, useRef } from 'react';
import Layout from './components/Layout';
import PlayerBar from './components/PlayerBar';
import Home from './pages/Home';
import Queue from './pages/Queue';
import NowPlaying from './pages/NowPlaying';
import Settings from './pages/Settings';
import { Episode, View, Podcast } from './types';

// Global Audio Player Component - Hidden YouTube iframe for audio-only playback
const AudioPlayer: React.FC<{ 
  videoUrl?: string; 
  isPlaying: boolean;
  onProgressUpdate?: (currentTime: number, duration: number) => void;
  onSkip?: (seconds: number) => void;
}> = ({ videoUrl, isPlaying, onProgressUpdate, onSkip }) => {
  const playerRef = useRef<HTMLIFrameElement>(null);
  const [playerReady, setPlayerReady] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string>('');
  const retryCountRef = useRef(0);
  const progressIntervalRef = useRef<any>(null);

  const extractVideoId = (url: string): string => {
    if (!url) return '';
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : '';
  };

  const videoId = extractVideoId(videoUrl || '');

  // Update video ID when it changes
  useEffect(() => {
    if (videoId && videoId !== currentVideoId) {
      setCurrentVideoId(videoId);
      setPlayerReady(false);
      retryCountRef.current = 0;
      startTimeRef.current = 0;
      pausedTimeRef.current = 0;
      if (onProgressUpdate) {
        onProgressUpdate(0, 0);
      }
    }
  }, [videoId, currentVideoId, onProgressUpdate]);

  // Control playback via postMessage (YouTube IFrame API)
  const sendCommand = (command: string, retryCount = 0) => {
    const iframe = playerRef.current;
    if (!iframe) {
      console.warn(`⚠️ Iframe not available for command: ${command}`);
      if (retryCount < 5) {
        setTimeout(() => sendCommand(command, retryCount + 1), 500);
      }
      return;
    }

    if (!iframe.contentWindow) {
      console.warn(`⚠️ Iframe contentWindow not available for command: ${command}`);
      if (retryCount < 5) {
        setTimeout(() => sendCommand(command, retryCount + 1), 500);
      }
      return;
    }

    try {
      const message = JSON.stringify({
        event: 'command',
        func: command,
        args: []
      });
      
      console.log(`📤 Sending command: ${command} to video: ${currentVideoId}`);
      iframe.contentWindow.postMessage(message, 'https://www.youtube.com');
      
      // Also try sending to the iframe directly (some browsers need this)
      if (iframe.contentDocument) {
        try {
          iframe.contentWindow.postMessage(message, '*');
        } catch (e) {
          // Cross-origin, ignore
        }
      }
    } catch (error) {
      console.error(`❌ Error sending command ${command} to YouTube player:`, error);
      if (retryCount < 5) {
        setTimeout(() => sendCommand(command, retryCount + 1), 500);
      }
    }
  };

  // Track playback time manually
  const startTimeRef = useRef<number>(0);
  const pausedTimeRef = useRef<number>(0);
  const currentTimeRef = useRef<number>(0);

  // Expose skip function via ref callback
  useEffect(() => {
    if (onSkip) {
      // Store skip handler
      (window as any).__youtubePlayerSkip = (seconds: number) => {
        if (playerReady && currentVideoId) {
          const newTime = Math.max(0, currentTimeRef.current + seconds);
          currentTimeRef.current = newTime;
          startTimeRef.current = Date.now() - newTime * 1000;
          
          // Seek in YouTube player
          const iframe = playerRef.current;
          if (iframe && iframe.contentWindow) {
            try {
              iframe.contentWindow.postMessage(
                JSON.stringify({
                  event: 'command',
                  func: 'seekTo',
                  args: [newTime, true]
                }),
                'https://www.youtube.com'
              );
              console.log(`⏩ Skipped ${seconds > 0 ? 'forward' : 'backward'} ${Math.abs(seconds)}s to ${newTime.toFixed(1)}s`);
            } catch (error) {
              console.error('Error seeking:', error);
            }
          }
          
          if (onProgressUpdate) {
            onProgressUpdate(newTime, 0);
          }
        }
      };
    }
    return () => {
      delete (window as any).__youtubePlayerSkip;
    };
  }, [onSkip, playerReady, currentVideoId, onProgressUpdate]);

  // Handle play/pause state changes
  useEffect(() => {
    if (!currentVideoId || !playerReady) {
      console.log(`⏳ Waiting for player: videoId=${currentVideoId}, playerReady=${playerReady}`);
      return;
    }

    const iframe = playerRef.current;
    if (!iframe) {
      console.warn('⚠️ Iframe ref not available');
      return;
    }

    // Wait a bit for iframe to be fully ready, with retry
    let attemptCount = 0;
    const maxAttempts = 5;
    const timeouts: any[] = [];
    
    const tryCommand = () => {
      if (attemptCount >= maxAttempts) {
        console.warn(`⚠️ Max attempts reached for command. Video might not play.`);
        return;
      }
      attemptCount++;
      
      const timeout = setTimeout(() => {
        if (isPlaying) {
          console.log(`▶️ Attempt ${attemptCount}/${maxAttempts}: Trying to play video`);
          sendCommand('playVideo', 0);
          // Start tracking time
          if (pausedTimeRef.current > 0) {
            startTimeRef.current = Date.now() - pausedTimeRef.current * 1000;
            currentTimeRef.current = pausedTimeRef.current;
            pausedTimeRef.current = 0;
          } else if (startTimeRef.current === 0) {
            startTimeRef.current = Date.now();
            currentTimeRef.current = 0;
          }
        } else {
          console.log(`⏸️ Attempt ${attemptCount}/${maxAttempts}: Trying to pause video`);
          sendCommand('pauseVideo', 0);
          // Calculate paused time
          if (startTimeRef.current > 0) {
            pausedTimeRef.current = (Date.now() - startTimeRef.current) / 1000;
          }
        }
        
        // Retry if still not working
        if (attemptCount < maxAttempts) {
          const retryTimeout = setTimeout(tryCommand, 1500);
          timeouts.push(retryTimeout);
        }
      }, 800 + (attemptCount * 400));
      
      timeouts.push(timeout);
    };

    tryCommand();
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [isPlaying, currentVideoId, playerReady]);

  // Handle iframe load and setup message listener
  useEffect(() => {
    const iframe = playerRef.current;
    if (!iframe || !currentVideoId) return;

    const handleLoad = () => {
      console.log('🎬 YouTube iframe loaded for video:', currentVideoId);
      // Wait a bit longer for YouTube player to initialize
      setTimeout(() => {
        setPlayerReady(true);
        retryCountRef.current = 0;
        startTimeRef.current = 0;
        pausedTimeRef.current = 0;
        currentTimeRef.current = 0;
        
        // Auto-play if isPlaying is true
        if (isPlaying) {
          // Try multiple times with increasing delays
          setTimeout(() => {
            console.log('▶️ Attempting to play video (attempt 1):', currentVideoId);
            sendCommand('playVideo');
            startTimeRef.current = Date.now();
          }, 2000);
          
          // Backup attempt
          setTimeout(() => {
            if (isPlaying) {
              console.log('▶️ Attempting to play video (attempt 2):', currentVideoId);
              sendCommand('playVideo');
            }
          }, 4000);
        }
      }, 1000);
    };

    // Listen for YouTube player events
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== 'https://www.youtube.com') return;
      
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        
        if (data.event === 'onReady') {
          console.log('✅ YouTube player ready for video:', currentVideoId);
          setPlayerReady(true);
          if (isPlaying) {
            setTimeout(() => {
              console.log('▶️ Sending play command after onReady');
              sendCommand('playVideo');
              startTimeRef.current = Date.now();
            }, 800);
          }
        } else if (data.event === 'onStateChange') {
          // Handle state changes - state 1 = playing, 2 = paused, 3 = buffering, 0 = ended
          console.log('📊 Player state changed:', data.info, 'for video:', currentVideoId);
          if (data.info === 1 && isPlaying) {
            // Video started playing
            console.log('▶️ Video is now playing');
            if (startTimeRef.current === 0) {
              startTimeRef.current = Date.now();
              currentTimeRef.current = 0;
            }
          } else if (data.info === 2) {
            // Video paused
            console.log('⏸️ Video paused');
            if (startTimeRef.current > 0) {
              pausedTimeRef.current = (Date.now() - startTimeRef.current) / 1000;
            }
          } else if (data.info === 3) {
            console.log('⏳ Video buffering');
          } else if (data.info === 0) {
            console.log('⏹️ Video ended');
          } else if (data.info === -1) {
            console.log('❌ Video error or unstarted');
          }
        } else if (data.event === 'onError') {
          console.error('❌ YouTube player error:', data.info);
          // Error codes: 2 = invalid video, 5 = HTML5 error, 100 = video not found, 101/150 = not allowed
          if (data.info === 2 || data.info === 100 || data.info === 101 || data.info === 150) {
            console.error('⚠️ Video may be restricted, private, or unavailable');
          }
        }
      } catch (e) {
        // Ignore non-JSON messages
      }
    };

    iframe.addEventListener('load', handleLoad);
    window.addEventListener('message', handleMessage);

    // Progress tracking interval
    if (onProgressUpdate) {
      progressIntervalRef.current = setInterval(() => {
        if (isPlaying && startTimeRef.current > 0) {
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          currentTimeRef.current = elapsed;
          onProgressUpdate(elapsed, 0); // Duration will be set from episode data
        } else if (!isPlaying && startTimeRef.current > 0) {
          // Keep current time updated even when paused
          currentTimeRef.current = pausedTimeRef.current;
        }
      }, 1000);
    }

    iframe.addEventListener('load', handleLoad);
    window.addEventListener('message', handleMessage);

    return () => {
      iframe.removeEventListener('load', handleLoad);
      window.removeEventListener('message', handleMessage);
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [currentVideoId, isPlaying, onProgressUpdate, playerReady]);

  // Cleanup progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  if (!currentVideoId) return null;

  // Use standard domain with better parameters for compatibility
  // Note: iframe needs to be at least 1x1 for some browsers to work properly
  // Added allowfullscreen=0 to prevent fullscreen issues
  const embedUrl = `https://www.youtube.com/embed/${currentVideoId}?enablejsapi=1&autoplay=${isPlaying ? 1 : 0}&controls=0&disablekb=1&fs=0&iv_load_policy=3&modestbranding=1&playsinline=1&rel=0&showinfo=0&origin=${encodeURIComponent(window.location.origin)}&mute=0&loop=0&playlist=${currentVideoId}&widget_referrer=${encodeURIComponent(window.location.origin)}&allowfullscreen=0`;

  return (
    <iframe
      key={currentVideoId}
      ref={playerRef}
      id="youtube-audio-player-global"
      width="1"
      height="1"
      src={embedUrl}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
      allowFullScreen={false}
      style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '1px', height: '1px', border: 'none', opacity: 0, pointerEvents: 'none' }}
    />
  );
};

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>('home');
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const handleProgressUpdate = (time: number, dur: number) => {
    setCurrentTime(time);
    // Only update duration if we don't already have it from episode data
    if (dur > 0 && duration === 0) {
      setDuration(dur);
    }
  };

  const handlePlayEpisode = (episode: Episode) => {
    setCurrentEpisode(episode);
    setIsPlaying(true);
    setCurrentTime(0);
    // Parse duration from episode if available
    if (episode.duration) {
      const timeParts = episode.duration.split(':').map(Number);
      if (timeParts.length === 2) {
        setDuration(timeParts[0] * 60 + timeParts[1]);
      } else if (timeParts.length === 3) {
        setDuration(timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2]);
      }
    } else {
      setDuration(0);
    }
  };

  const handleTogglePlay = () => {
    setIsPlaying(prev => !prev);
  };

  const handleViewChange = (view: View) => {
    setActiveView(view);
    // Auto-close full player if navigating via tabs
    if (isFullPlayerOpen) setIsFullPlayerOpen(false);
  };

  const renderView = () => {
    switch (activeView) {
      case 'home':
        return <Home onPlayEpisode={handlePlayEpisode} onPodcastClick={() => {}} />;
      case 'queue':
        return <Queue currentEpisodeId={currentEpisode?.id} onPlayEpisode={handlePlayEpisode} />;
      case 'settings':
        return <Settings />;
      case 'now-playing':
        // If we choose 'now-playing' from navigation, just show current episode in detail
        return currentEpisode ? (
          <div className="md:pt-10">
            <NowPlaying 
              episode={currentEpisode} 
              isPlaying={isPlaying} 
              onTogglePlay={handleTogglePlay} 
              onClose={() => setActiveView('home')}
              currentTime={currentTime}
              duration={duration}
              onSkip={(seconds) => {
                if ((window as any).__youtubePlayerSkip) {
                  (window as any).__youtubePlayerSkip(seconds);
                }
              }}
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-500">No video playing / Ma jiro fiidiyow oo la daawinayo</p>
          </div>
        );
      default:
        return <Home onPlayEpisode={handlePlayEpisode} onPodcastClick={() => {}} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 text-white selection:bg-purple-500/30">
      {/* Global Audio Player - Hidden YouTube iframe for audio playback */}
      {currentEpisode && (
        <AudioPlayer 
          videoUrl={currentEpisode.videoUrl} 
          isPlaying={isPlaying}
          onProgressUpdate={handleProgressUpdate}
          onSkip={(seconds) => {
            // Skip handler - will be called via window.__youtubePlayerSkip
          }}
        />
      )}

      <Layout activeView={activeView} onViewChange={handleViewChange}>
        {renderView()}
      </Layout>

      <PlayerBar 
        currentEpisode={currentEpisode}
        isPlaying={isPlaying}
        onTogglePlay={handleTogglePlay}
        onExpand={() => setIsFullPlayerOpen(true)}
        currentTime={currentTime}
        duration={duration}
      />

      {isFullPlayerOpen && currentEpisode && (
        <NowPlaying 
          episode={currentEpisode}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onClose={() => setIsFullPlayerOpen(false)}
          currentTime={currentTime}
          duration={duration}
          onSkip={(seconds) => {
            if ((window as any).__youtubePlayerSkip) {
              (window as any).__youtubePlayerSkip(seconds);
            }
          }}
        />
      )}

      {/* Global Transition Styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.4s ease-out forwards;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out forwards;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
};

export default App;
