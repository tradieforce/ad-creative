// Vercel Function entrypoint. The whole Express app runs here.
//
// vercel.json rewrites every /api/* request to this function. Static files
// in /public are served by Vercel's CDN directly (faster, free).
//
// This file is not used in local dev — `npm start` boots server.js directly
// and starts an HTTP listener on port 3000.

import app from '../server.js';

export default app;
