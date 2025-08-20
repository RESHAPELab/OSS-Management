// API Configuration for dynamic URL switching
const API_CONFIG = {
  // Check if we're running in development (localhost) or production
  isDevelopment: () => {
    return (
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname === "" ||
      window.location.port === "3000"
    );
  },

  // Get the appropriate backend URL based on environment
  getBaseURL: () => {
    if (API_CONFIG.isDevelopment()) {
      // Local development - use localhost
      return `http://localhost:${process.env.REACT_APP_BACKEND_PORT || 8080}`;
    } else {
      // Production - use Railway backend URL
      return (
        process.env.REACT_APP_BACKEND_URL ||
        "https://oss-michael.up.railway.app/"
      );
    }
  },

  // Get the bot service URL
  getBotURL: () => {
    if (API_CONFIG.isDevelopment()) {
      return `http://localhost:${process.env.REACT_APP_BOT_PORT || 8081}`;
    } else {
      return process.env.REACT_APP_BOT_URL || "https://oss-timi.up.railway.app";
    }
  },
};

export default API_CONFIG;
