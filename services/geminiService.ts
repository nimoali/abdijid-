
import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.API_KEY || process.env.GEMINI_API_KEY || "";

export const getVideoSummary = async (title: string, description: string): Promise<string> => {
  if (!API_KEY) return "AI Summary is unavailable without an API Key. / Soo koobidaha AI ma heli karo iyadoon furaha API ahayn.";
  
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `As a smart video assistant, summarize this video in 3 key interesting points. Respond in both Somali and English languages (mix both languages naturally):
      Title: ${title}
      Description: ${description}
      
      Provide a summary that combines Somali and English naturally.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text || "Unable to summarize the video at this time. / Ma suurtogal ahayn in la soo koobo fiidiyowga hadda.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "An error occurred while trying to summarize the video. / Qalad ayaa dhacay markii la isku dayayay in la soo koobo fiidiyowga.";
  }
};

export const getVideoRecommendations = async (lastVideoTitle: string): Promise<string[]> => {
  if (!API_KEY) return [];
  
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Based on the user watching a video titled "${lastVideoTitle}", suggest 3 similar video topics for a Somali/English content channel with creative names. Respond with topic names only, separated by commas. Mix Somali and English naturally in the suggestions.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text?.split(',').map(s => s.trim()).filter(s => s.length > 0) || [];
  } catch (error) {
    console.error("Gemini Recommendations Error:", error);
    return [];
  }
};

// Generate video content ideas based on channel theme
export const generateVideoIdeas = async (theme: string = "Somali and English content"): Promise<string[]> => {
  if (!API_KEY) return [];
  
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `Generate 5 creative video ideas for a YouTube channel focused on ${theme}. The channel is @Abdijaliil and creates content in both Somali and English languages. Provide video title ideas that would appeal to both Somali and English speaking audiences. Return only the titles, separated by commas.`;
    
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    return text?.split(',').map(s => s.trim()).filter(s => s.length > 0) || [];
  } catch (error) {
    console.error("Gemini Video Ideas Error:", error);
    return [];
  }
};

// Legacy function name for compatibility
export const getEpisodeSummary = getVideoSummary;
export const getRecommendations = getVideoRecommendations;
