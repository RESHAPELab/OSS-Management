// Force using Railway URLs for now (can be changed back later for local development)
const API_BASE_URL = "https://oss-michael-production.up.railway.app";

// For local development, uncomment the line below and comment out the line above
// const API_BASE_URL = `http://localhost:${process.env.REACT_APP_PORT || 8080}`;

// Bot configuration (if needed separately)
const BOT_BASE_URL = "https://oss-timi.up.railway.app";

export { API_BASE_URL, BOT_BASE_URL };
