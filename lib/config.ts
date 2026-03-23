// Central place to read the API base URL with a safe fallback so the UI
// keeps working even when NEXT_PUBLIC_API_URL isn't provided at build time.
export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://log-server-mpod.onrender.com';
