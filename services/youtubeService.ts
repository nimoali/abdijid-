export interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  publishedAt: string;
  duration: string;
  channelName: string;
  channelId: string;
}

const YOUTUBE_CHANNEL_HANDLE = 'Abdijaliil'; // @Abdijaliil
const YOUTUBE_CHANNEL_URL = 'https://www.youtube.com/@Abdijaliil';

// Cache for channel ID to avoid repeated fetches
let cachedChannelId: string | null = null;

// Manual channel ID - set this in youtubeHelper.ts if you know the channel ID
// You can find it by going to the channel page and checking the page source for "channelId"
// Note: These are loaded dynamically in fetchChannelVideos to avoid top-level await issues

// Fetch with timeout helper
const fetchWithTimeout = async (url: string, timeout: number = 5000): Promise<Response> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
};

// Fetch videos using YouTube Data API (if API key is provided)
const fetchWithYouTubeAPI = async (apiKey: string, channelIdOrHandle: string, maxResults: number): Promise<YouTubeVideo[]> => {
  if (!apiKey) {
    console.warn('No API key provided');
    return [];
  }
  
  try {
    let finalChannelId = channelIdOrHandle;
    
    // If it's not a channel ID (doesn't start with UC), search for the channel
    if (!finalChannelId || !finalChannelId.startsWith('UC')) {
      console.log('🔍 Searching for channel by handle:', YOUTUBE_CHANNEL_HANDLE);
      const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(YOUTUBE_CHANNEL_HANDLE)}&type=channel&maxResults=1&key=${apiKey}`;
      const searchResponse = await fetch(searchUrl);
      
      if (!searchResponse.ok) {
        const errorData = await searchResponse.json().catch(() => ({}));
        console.error('❌ YouTube API search error:', searchResponse.status, errorData);
        
        // Provide helpful error messages
        if (errorData.error) {
          const errorMsg = errorData.error.message || '';
          if (errorMsg.includes('API key not valid') || errorMsg.includes('invalid API key')) {
            throw new Error('API_KEY_INVALID: Your API key is invalid. Please check it in youtubeHelper.ts');
          } else if (errorMsg.includes('API has not been used') || errorMsg.includes('not enabled')) {
            throw new Error('API_NOT_ENABLED: YouTube Data API v3 is not enabled. Enable it at: https://console.cloud.google.com/apis/library/youtube.googleapis.com');
          } else if (errorMsg.includes('quota') || errorMsg.includes('exceeded')) {
            // Don't throw - just return empty array to allow fallback to RSS
            console.warn('⚠️ API quota exceeded, will try RSS feed instead');
            return [];
          } else {
            throw new Error(`API_ERROR: ${errorMsg}`);
          }
        }
        return [];
      }
      
      const searchData = await searchResponse.json();
      console.log('📡 Search response:', searchData);
      
      if (searchData.items && searchData.items.length > 0) {
        // Find the exact channel match
        const exactMatch = searchData.items.find((item: any) => 
          item.snippet.customUrl?.includes(YOUTUBE_CHANNEL_HANDLE.toLowerCase()) ||
          item.snippet.title?.toLowerCase().includes(YOUTUBE_CHANNEL_HANDLE.toLowerCase())
        );
        finalChannelId = exactMatch?.id?.channelId || searchData.items[0].id.channelId;
        console.log('✅ Found channel ID:', finalChannelId);
        console.log('📺 Channel name:', exactMatch?.snippet?.title || searchData.items[0].snippet.title);
      } else {
        console.error('❌ Channel not found in search results');
        console.error('Search response:', searchData);
        return [];
      }
    }
    
    // METHOD 1: Use uploads playlist (RECOMMENDED - gets ALL videos)
    console.log('📺 Step 1: Getting channel uploads playlist...');
    const channelUrl = `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${finalChannelId}&key=${apiKey}`;
    const channelResponse = await fetch(channelUrl);
    
    if (channelResponse.ok) {
      const channelData = await channelResponse.json();
      const uploadsPlaylistId = channelData.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
      
      if (uploadsPlaylistId) {
        console.log('✅ Found uploads playlist ID:', uploadsPlaylistId);
        console.log('📺 Step 2: Fetching ALL videos from uploads playlist...');
        
        const allVideos: YouTubeVideo[] = [];
        let nextPageToken: string | undefined = undefined;
        const maxPerRequest = 50;
        let requestCount = 0;
        
        do {
          const requestMax = Math.min(maxPerRequest, maxResults - allVideos.length);
          if (requestMax <= 0) break;
          
          const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${uploadsPlaylistId}&maxResults=${requestMax}&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
          const response = await fetch(playlistUrl);
      
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Playlist API error:', response.status, errorData);
            // Check if it's a quota error - if so, return empty to allow RSS fallback
            if (errorData.error?.message?.includes('quota') || errorData.error?.message?.includes('exceeded')) {
              console.warn('⚠️ API quota exceeded in playlist method, will try RSS feed');
              return [];
            }
            break;
          }
      
          const data = await response.json();
          requestCount++;
          
          if (data.items && data.items.length > 0) {
            const videos = data.items.map((item: any) => ({
              id: item.snippet.resourceId.videoId,
              title: item.snippet.title,
              description: item.snippet.description || '',
              thumbnail: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url || `https://img.youtube.com/vi/${item.snippet.resourceId.videoId}/maxresdefault.jpg`,
              videoUrl: `https://www.youtube.com/watch?v=${item.snippet.resourceId.videoId}`,
              publishedAt: item.snippet.publishedAt,
              duration: 'N/A',
              channelName: item.snippet.channelTitle,
              channelId: finalChannelId
            }));
            allVideos.push(...videos);
            nextPageToken = data.nextPageToken;
            console.log(`📹 Request ${requestCount}: Fetched ${videos.length} videos (Total: ${allVideos.length})`);
            
            if (!nextPageToken) {
              console.log(`✅ Reached end of playlist. Total: ${allVideos.length} videos`);
              break;
            }
            
            if (allVideos.length >= maxResults) {
              console.log(`✅ Reached max limit: ${maxResults} videos`);
              break;
            }
          } else {
            break;
          }
          
          await new Promise(resolve => setTimeout(resolve, 200));
        } while (nextPageToken && allVideos.length < maxResults);
        
        if (allVideos.length > 0) {
          console.log(`✅ Successfully fetched ${allVideos.length} videos via uploads playlist!`);
          return allVideos.slice(0, maxResults);
        }
      }
    }
    
    // METHOD 2: Fallback to search method if playlist method fails
    console.log('⚠️ Playlist method failed, trying search method...');
    const allVideos: YouTubeVideo[] = [];
    let nextPageToken: string | undefined = undefined;
    const maxPerRequest = 50;
    let requestCount = 0;
    
    do {
      const requestMax = Math.min(maxPerRequest, maxResults - allVideos.length);
      if (requestMax <= 0) break;
      
      const videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${finalChannelId}&maxResults=${requestMax}&order=date&type=video&key=${apiKey}${nextPageToken ? `&pageToken=${nextPageToken}` : ''}`;
      const response = await fetch(videosUrl);
    
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Search API error:', response.status, errorData);
        // Check if it's a quota error - if so, return empty to allow RSS fallback
        if (errorData.error?.message?.includes('quota') || errorData.error?.message?.includes('exceeded')) {
          console.warn('⚠️ API quota exceeded in search method, will try RSS feed');
          return [];
        }
        break;
      }
    
      const data = await response.json();
      requestCount++;
      console.log(`📹 Search Request ${requestCount}: Fetched ${data.items?.length || 0} videos (Total: ${allVideos.length + (data.items?.length || 0)})`);
      
      if (data.items && data.items.length > 0) {
        const videos = data.items.map((item: any) => ({
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description || '',
          thumbnail: item.snippet.thumbnails.maxres?.url || item.snippet.thumbnails.high?.url || `https://img.youtube.com/vi/${item.id.videoId}/maxresdefault.jpg`,
          videoUrl: `https://www.youtube.com/watch?v=${item.id.videoId}`,
          publishedAt: item.snippet.publishedAt,
          duration: 'N/A',
          channelName: item.snippet.channelTitle,
          channelId: finalChannelId
        }));
        allVideos.push(...videos);
        nextPageToken = data.nextPageToken;
        
        if (!nextPageToken || allVideos.length >= maxResults) break;
      } else {
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 200));
    } while (nextPageToken && allVideos.length < maxResults);
    
    if (allVideos.length > 0) {
      console.log(`✅ Successfully fetched ${allVideos.length} videos via search method`);
      return allVideos.slice(0, maxResults);
    } else {
      console.warn('⚠️ No videos found');
      return [];
    }
  } catch (error: any) {
    console.error('❌ YouTube API error:', error);
    // If quota exceeded, return empty array to allow RSS fallback
    if (error.message && error.message.includes('API_QUOTA_EXCEEDED')) {
      console.warn('⚠️ API quota exceeded, will try RSS feed instead');
      return [];
    }
    // Re-throw other API errors
    if (error.message && (error.message.includes('API_KEY_INVALID') || error.message.includes('API_NOT_ENABLED'))) {
      throw error;
    }
    // For other errors, return empty to allow RSS fallback
    console.warn('⚠️ YouTube API error, will try RSS feed instead');
    return [];
  }
};

// Fetch videos from YouTube channel using RSS feed (no API key needed)
export const fetchChannelVideos = async (maxResults: number = 50): Promise<YouTubeVideo[]> => {
  console.log('🔍 Starting to fetch videos from:', YOUTUBE_CHANNEL_URL);
  
  // Try to load manual settings
  let manualChannelId: string | null = null;
  let apiKey: string | null = null;
  try {
    const helper = await import('./youtubeHelper');
    manualChannelId = helper.MANUAL_CHANNEL_ID || null;
    apiKey = helper.YOUTUBE_API_KEY || null;
    if (apiKey) {
      console.log('✅ API key loaded from youtubeHelper.ts');
    } else {
      console.warn('⚠️ No API key found in youtubeHelper.ts');
    }
  } catch (e) {
    console.error('❌ Error loading youtubeHelper.ts:', e);
    // Helper not configured - continue with RSS
  }
  
  // Check for manual channel ID first
  let channelId = manualChannelId || cachedChannelId;
  
  // Try YouTube Data API if key is provided (most reliable)
  if (apiKey) {
    console.log('📡 Using YouTube Data API with key:', apiKey.substring(0, 10) + '...');
    try {
      // First, try to get channel ID using API if we don't have it
      if (!channelId) {
        console.log('🔍 Getting channel ID from API...');
        try {
          const searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(YOUTUBE_CHANNEL_HANDLE)}&type=channel&maxResults=1&key=${apiKey}`;
          const searchResponse = await fetch(searchUrl);
          if (searchResponse.ok) {
            const searchData = await searchResponse.json();
            if (searchData.items && searchData.items.length > 0) {
              channelId = searchData.items[0].id.channelId;
              cachedChannelId = channelId;
              console.log('✅ Got channel ID from API:', channelId);
            }
          }
        } catch (e) {
          console.warn('⚠️ Could not get channel ID from API, will try other methods');
        }
      }
      
      const apiVideos = await fetchWithYouTubeAPI(apiKey, channelId || YOUTUBE_CHANNEL_HANDLE, maxResults);
      if (apiVideos.length > 0) {
        console.log(`✅ Successfully loaded ${apiVideos.length} videos via YouTube API`);
        return apiVideos;
      } else {
        console.warn('⚠️ YouTube API returned no videos, will try RSS feed');
      }
    } catch (error: any) {
      // If quota exceeded or other API error, silently fall back to RSS
      if (error.message?.includes('API_QUOTA_EXCEEDED') || error.message?.includes('quota')) {
        console.warn('⚠️ API quota exceeded, automatically switching to RSS feed');
      } else if (error.message?.includes('API_KEY_INVALID')) {
        console.warn('⚠️ API key invalid, automatically switching to RSS feed');
      } else if (error.message?.includes('API_NOT_ENABLED')) {
        console.warn('⚠️ API not enabled, automatically switching to RSS feed');
      } else {
        console.warn('⚠️ YouTube API error, automatically switching to RSS feed:', error.message);
      }
    }
  } else {
    console.warn('⚠️ No API key configured. Using RSS feed instead');
  }
  
  // If we have a channel ID (manual or cached), try RSS feed directly
  if (channelId) {
    console.log('📺 Using channel ID for RSS feed:', channelId);
    const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
    const videos = await tryRSSFeed(rssUrl, channelId, maxResults);
    if (videos.length > 0) {
      console.log(`✅ Successfully loaded ${videos.length} videos`);
      return videos;
    }
  }
  
  // Try to get channel ID and then fetch videos
  console.log('📡 Attempting to get channel ID...');
  if (!channelId) {
    channelId = await Promise.race([
      getChannelIdFromPage(),
      new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 3000))
    ]) as string | null;
    
    if (channelId) {
      console.log('✅ Found channel ID:', channelId);
      cachedChannelId = channelId;
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
      const videos = await tryRSSFeed(rssUrl, channelId, maxResults);
      if (videos.length > 0) {
        return videos;
      }
    }
  }
  
  // Try multiple RSS approaches in parallel
  const attempts = [
    // Attempt 1: Try to get channel ID and use RSS
    (async () => {
      if (!channelId) {
        channelId = await Promise.race([
          getChannelIdFromPage(),
          new Promise<string | null>((resolve) => setTimeout(() => resolve(null), 2000))
        ]) as string | null;
        if (channelId) {
          cachedChannelId = channelId;
          console.log('✅ Found channel ID:', channelId);
        }
      }
      if (channelId) {
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        return await tryRSSFeed(rssUrl, channelId, maxResults);
      }
      return [];
    })(),
    
    // Attempt 2: Try direct RSS with user parameter (multiple proxy services)
    (async () => {
      const rssUrl = `https://www.youtube.com/feeds/videos.xml?user=${YOUTUBE_CHANNEL_HANDLE}`;
      const proxyServices = [
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`,
        `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&api_key=public`,
        `https://corsproxy.io/?${encodeURIComponent(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`)}`,
        `https://api.allorigins.win/get?url=${encodeURIComponent(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`)}`,
      ];
      
      for (const proxyUrl of proxyServices) {
        try {
          const response = await fetchWithTimeout(proxyUrl, 4000);
          if (response.ok) {
            let data = await response.json();
            // Handle allorigins.win format
            if (data.contents) {
              try {
                data = JSON.parse(data.contents);
              } catch (e) {
                continue;
              }
            }
            if (data.status === 'ok' && data.items && data.items.length > 0) {
              console.log(`✅ Found ${data.items.length} videos via RSS`);
              return processRSSItems(data.items.slice(0, maxResults), YOUTUBE_CHANNEL_HANDLE, 'Abdijaliil');
            }
          }
        } catch (e) {
          continue;
        }
      }
      return [];
    })(),
  ];

  // Wait for first successful result
  const results = await Promise.allSettled(attempts);
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value.length > 0) {
      console.log(`✅ Successfully loaded ${result.value.length} videos`);
      return result.value;
    }
  }

  // If all methods fail
  console.error('❌ All methods failed to fetch videos');
  console.error('');
  console.error('💡 WHY THIS IS HAPPENING:');
  console.error('   CORS (Cross-Origin Resource Sharing) restrictions are blocking');
  console.error('   the RSS feed access from your browser. This is a security feature.');
  console.error('');
  console.error('🔧 SOLUTIONS (Choose one):');
  console.error('');
  console.error('OPTION 1: Set Manual Channel ID (Easiest - No API key needed)');
  console.error('   1. Open: services/youtubeHelper.ts');
      console.error('   2. Visit: https://www.youtube.com/@Abdijaliil');
  console.error('   3. Press F12 → Network tab → Look for "channelId" in requests');
  console.error('      OR View page source (Ctrl+U) → Search for "channelId"');
  console.error('   4. Copy the UC... value and set:');
  console.error('      export const MANUAL_CHANNEL_ID = "UC...";');
  console.error('');
  console.error('OPTION 2: Use YouTube Data API (Most Reliable)');
  console.error('   1. Get free API key: https://console.cloud.google.com/apis/credentials');
  console.error('   2. Enable "YouTube Data API v3"');
  console.error('   3. In youtubeHelper.ts, set:');
  console.error('      export const YOUTUBE_API_KEY = "your-key-here";');
  console.error('');
  
  return [];
};

// Helper to try RSS feed with timeout - tries multiple proxy services
const tryRSSFeed = async (rssUrl: string, channelId: string, maxResults: number): Promise<YouTubeVideo[]> => {
  // Try multiple proxy services for better reliability
  const proxyServices = [
    `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`,
    `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&api_key=public`,
    `https://corsproxy.io/?${encodeURIComponent(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`)}`,
    `https://api.allorigins.win/get?url=${encodeURIComponent(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`)}`,
  ];
  
  for (const proxyUrl of proxyServices) {
    try {
      const response = await fetchWithTimeout(proxyUrl, 4000);
      if (response.ok) {
        let data = await response.json();
        // Handle allorigins.win format
        if (data.contents) {
          try {
            data = JSON.parse(data.contents);
          } catch (e) {
            continue;
          }
        }
        if (data.status === 'ok' && data.items && data.items.length > 0) {
          console.log(`✅ RSS feed success! Found ${data.items.length} videos`);
          return processRSSItems(data.items.slice(0, maxResults), channelId, 'Abdijaliil');
        }
      }
    } catch (error) {
      continue;
    }
  }
  return [];
};

// Helper function to process RSS items
const processRSSItems = (items: any[], channelId: string, channelName: string): YouTubeVideo[] => {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  return items.map((item: any) => {
    try {
      // Handle different RSS formats from rss2json
      let link = '';
      if (typeof item.link === 'string') {
        link = item.link;
      } else if (item.link && item.link[0] && item.link[0].$.href) {
        link = item.link[0].$.href;
      } else if (item.id) {
        link = item.id;
      }

      const title = typeof item.title === 'string' 
        ? item.title 
        : (item.title && item.title[0] ? item.title[0] : 'Untitled Video');
      
      const description = typeof item.description === 'string'
        ? item.description
        : (item.content || item.summary || '');
      
      const pubDate = typeof item.pubDate === 'string'
        ? item.pubDate
        : (item.published || item.updated || new Date().toISOString());
      
      const videoId = extractVideoId(link);
      
      if (!videoId) {
        console.warn('Could not extract video ID from:', link);
        return null;
      }
      
      return {
        id: videoId,
        title: title,
        description: extractDescription(description),
        thumbnail: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        videoUrl: link || `https://www.youtube.com/watch?v=${videoId}`,
        publishedAt: pubDate,
        duration: extractDuration(description),
        channelName: channelName,
        channelId: channelId
      };
    } catch (error) {
      console.warn('Error processing RSS item:', error);
      return null;
    }
  }).filter((video): video is YouTubeVideo => video !== null);
};

// Get the real channel ID from the channel page (with timeout)
const getChannelIdFromPage = async (): Promise<string | null> => {
  // Try using a public API service first (most reliable)
  try {
    // Use yt-dlp or similar service, but for now try a simpler approach
    // Try to get channel ID via YouTube's oEmbed or channel info
    const channelInfoUrl = `https://www.youtube.com/${YOUTUBE_CHANNEL_HANDLE}`;
    
    // Try multiple proxy services
    const proxies = [
      `https://api.allorigins.win/get?url=${encodeURIComponent(channelInfoUrl)}`,
      `https://corsproxy.io/?${encodeURIComponent(channelInfoUrl)}`,
    ];

    for (const proxyUrl of proxies) {
      try {
        const response = await fetchWithTimeout(proxyUrl, 5000);
        
        if (response.ok) {
          const data = await response.json();
          let html = '';
          
          // Handle different proxy response formats
          if (typeof data === 'string') {
            html = data;
          } else if (data.contents) {
            html = data.contents;
          } else if (data.body) {
            html = data.body;
          } else if (data.data) {
            html = data.data;
          }
          
          if (!html || html.length < 100) {
            continue;
          }
          
          // Try multiple patterns to find channel ID (YouTube stores it in various places)
          const patterns = [
            /"channelId"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/g,
            /"externalId"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/g,
            /"ucid"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/g,
            /channel_id[=:"](UC[a-zA-Z0-9_-]{22})/g,
            /"browseId"\s*:\s*"(UC[a-zA-Z0-9_-]{22})"/g,
            /"\/channel\/(UC[a-zA-Z0-9_-]{22})"/g,
            /channelId%3D(UC[a-zA-Z0-9_-]{22})/g,
            /"channelId":"(UC[a-zA-Z0-9_-]{22})"/g,
            /"channelId":\s*"(UC[a-zA-Z0-9_-]{22})"/g,
          ];
          
          for (const pattern of patterns) {
            const matches = Array.from(html.matchAll(pattern));
            for (const match of matches) {
              const id = match[1] || match[0].replace(/[^UCa-zA-Z0-9_-]/g, '').substring(0, 24);
              if (id && id.startsWith('UC') && id.length === 24) {
                console.log('✅ Extracted channel ID:', id);
                return id;
              }
            }
          }
        }
      } catch (error) {
        continue;
      }
    }
  } catch (error) {
    console.warn('Failed to get channel ID from page');
  }
  
  return null;
};


// Extract description from RSS content (remove HTML tags)
const extractDescription = (content: string): string => {
  if (!content) return '';
  // Remove HTML tags
  const text = content.replace(/<[^>]*>/g, '');
  // Clean up extra whitespace
  return text.replace(/\s+/g, ' ').trim().substring(0, 300);
};

// Try to extract duration from description if available
const extractDuration = (content: string): string => {
  const durationMatch = content.match(/(\d+):(\d+)/);
  if (durationMatch) {
    return durationMatch[0];
  }
  return 'N/A';
};

// Extract video ID from YouTube URL
const extractVideoId = (url: string): string => {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : '';
};

// Removed mock videos - we only use real data from YouTube

// Get video embed URL
export const getVideoEmbedUrl = (videoId: string): string => {
  return `https://www.youtube.com/embed/${videoId}`;
};

// Get video watch URL
export const getVideoWatchUrl = (videoId: string): string => {
  return `https://www.youtube.com/watch?v=${videoId}`;
};
