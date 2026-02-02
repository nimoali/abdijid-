// Helper function to manually set channel ID if RSS feed fails
// 
// HOW TO GET THE CHANNEL ID:
// Method 1 (Easiest):
// 1. Go to https://www.youtube.com/@Abdijaliil
// 2. Right-click and "View Page Source" (or press Ctrl+U)
// 3. Press Ctrl+F to search
// 4. Search for: "channelId"
// 5. You'll find something like: "channelId":"UCxxxxxxxxxxxxxxxxxxxxx"
// 6. Copy the part after "channelId":" (the UC... part)
//
// Method 2:
// 1. Go to https://www.youtube.com/@Abdijaliil
// 2. Open browser console (F12)
// 3. Type: document.querySelector('meta[itemprop="channelId"]')?.content
// 4. Copy the result
//
// Then set it below:
export const MANUAL_CHANNEL_ID: string | null = 'UCVgfaU1c2Ro0OkKHaZoIh2Q'; 
// Channel ID for @Abdijaliil - Found via evano.com

// Alternative: YouTube Data API v3 (Most Reliable)
// 1. Go to: https://console.cloud.google.com/apis/credentials
// 2. Create a new project or select existing
// 3. Enable "YouTube Data API v3"
// 4. Create credentials (API Key)
// 5. Copy the key and paste it below
export const YOUTUBE_API_KEY: string | null = 'AIzaSyBfbLTYpkKPeCXiL0NR6OgK3gsoeWVJVBE';
