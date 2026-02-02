# How to Get YouTube Channel ID for @Abdijaliil

## Quick Method (Easiest)

1. **Open the channel page**: https://www.youtube.com/@Abdijaliil
2. **Press F12** to open Developer Tools
3. **Go to the "Console" tab**
4. **Paste this code and press Enter**:
   ```javascript
   document.querySelector('meta[itemprop="channelId"]')?.content || 
   (() => {
     const scripts = Array.from(document.querySelectorAll('script'));
     for (const script of scripts) {
       const match = script.textContent?.match(/"channelId":"(UC[a-zA-Z0-9_-]{22})"/);
       if (match) return match[1];
     }
     return null;
   })()
   ```
5. **Copy the result** (it will look like: `UCxxxxxxxxxxxxxxxxxxxxx`)
6. **Open `services/youtubeHelper.ts`**
7. **Set**: `export const MANUAL_CHANNEL_ID = 'UCxxxxxxxxxxxxxxxxxxxxx';`

## Alternative Method

1. Go to https://www.youtube.com/@Abdijaliil
2. Right-click → "View Page Source" (or press Ctrl+U)
3. Press Ctrl+F to search
4. Search for: `"channelId"`
5. Find the value that looks like: `"channelId":"UCxxxxxxxxxxxxxxxxxxxxx"`
6. Copy the `UC...` part
7. Set it in `youtubeHelper.ts`

## After Setting the Channel ID

1. Save the file
2. Refresh your app
3. Videos should load!
