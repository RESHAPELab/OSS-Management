// API Configuration for dynamic URL switching
const API_CONFIG = {
  // Check if we're running in development (localhost) or production
  isDevelopment: () => {
    // Check for production deployment platforms first
    if (window.location.hostname.includes("vercel.app") || 
        window.location.hostname.includes("netlify.app") ||
        window.location.hostname.includes("surge.sh")) {
      return false; // Production deployment
    }
    
    // Only return true for actual localhost development
    return (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === ""
    );
  },

  // Get the appropriate backend URL based on environment
  getBaseURL: () => {
    const isDev = API_CONFIG.isDevelopment();
    const backendUrl = process.env.REACT_APP_BACKEND_URL;
    const backendPort = process.env.REACT_APP_BACKEND_PORT;
    
    console.log('🔍 [API_CONFIG] Environment detection:', {
      hostname: window.location.hostname,
      isDevelopment: isDev,
      REACT_APP_BACKEND_URL: backendUrl,
      REACT_APP_BACKEND_PORT: backendPort
    });
    
    if (isDev) {
      // Local development - use localhost
      const localhostUrl = `http://localhost:${backendPort || 8080}`;
      console.log('🔍 [API_CONFIG] Using localhost URL:', localhostUrl);
      return localhostUrl;
    } else {
      // Production - use Railway backend URL
      // Prioritize REACT_APP_BACKEND_URL over port
      if (backendUrl) {
        console.log('🔍 [API_CONFIG] Using production URL from env:', backendUrl);
        return backendUrl;
      }
      // Fallback to default Railway URL
      const fallbackUrl = "https://oss-michael.up.railway.app";
      console.log('🔍 [API_CONFIG] Using fallback URL:', fallbackUrl);
      return fallbackUrl;
    }
  },

  // Get the bot service URL
  getBotURL: () => {
    if (API_CONFIG.isDevelopment()) {
      return `http://localhost:${process.env.REACT_APP_BOT_PORT || 10000}`;
    } else {
      return process.env.REACT_APP_BOT_URL || "https://oss-timi.up.railway.app";
    }
  },
};

export default API_CONFIG;

// Named exports for backward compatibility
export const API_BASE_URL = API_CONFIG.getBaseURL();
export const BOT_BASE_URL = API_CONFIG.getBotURL();
