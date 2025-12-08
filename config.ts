// Application configuration
// These values should be set via environment variables in production
// For local development, create a .env.local file with these values

export const CONFIG = {
  openai: {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  },
  livekit: {
    url: import.meta.env.VITE_LIVEKIT_URL || 'wss://vec-tor-sxq3ar52.livekit.cloud',
    apiKey: import.meta.env.VITE_LIVEKIT_API_KEY || '',
    apiSecret: import.meta.env.VITE_LIVEKIT_API_SECRET || '',
  },
};
