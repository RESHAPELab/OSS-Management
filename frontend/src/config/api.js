// Dynamic API configuration based on environment
// const isProduction = process.env.NODE_ENV === 'production';

// const API_BASE_URL = isProduction
//   ? "https://oss-michael-production.up.railway.app"
//   : `http://localhost:${process.env.REACT_APP_PORT || 8080}`;

// // Bot configuration (if needed separately)
// const BOT_BASE_URL = isProduction
//   ? "https://oss-timi.up.railway.app"
//   : `http://localhost:${process.env.REACT_APP_BOT_PORT || 3001}`;

//temporary
const API_BASE_URL = "https://oss-michael-production.up.railway.app";
const BOT_BASE_URL = "https://oss-timi.up.railway.app";

export { API_BASE_URL, BOT_BASE_URL };
