/**
 * API base URL.
 * - In development: empty string → Vite proxy forwards /api/* to localhost:3000
 * - In production (Vercel): set VITE_API_URL=https://your-app.onrender.com in Vercel env vars
 */
export const API_BASE = import.meta.env.VITE_API_URL ?? '';

export const apiFetch = (path: string, init?: RequestInit) =>
  fetch(`${API_BASE}${path}`, init);
