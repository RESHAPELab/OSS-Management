const isDevelopment =
  process.env.NODE_ENV === "development" ||
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";

// TEMPORARY: All requests directed to live Railway links
// TODO: Uncomment the lines below for proper local/production switching
// const API_BASE_URL = isDevelopment
//   ? `http://localhost:${process.env.REACT_APP_PORT || 8080}`
//   : "https://oss-michael-production.up.railway.app";

// TEMPORARY CONFIGURATION - Remove when ready for local development
const API_BASE_URL = "https://oss-michael-production.up.railway.app";

// Bot configuration (if needed separately)
const BOT_BASE_URL = "https://oss-timi.up.railway.app";

export { API_BASE_URL, BOT_BASE_URL };
