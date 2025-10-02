/**
 * Google AI Configuration
 * This file is kept for backwards compatibility but uses direct Google AI SDK
 */

// Google AI is now initialized directly in genkitFlows.ts
export const googleAIConfig = {
  apiKey: process.env.GOOGLE_AI_API_KEY,
  model: 'gemini-1.5-flash',
};
