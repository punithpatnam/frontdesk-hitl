export const API_BASE =
  (import.meta.env.VITE_API_BASE as string) ?? "http://localhost:8000";

export const LIVEKIT_URL =
  (import.meta.env.VITE_LIVEKIT_URL as string) ?? "";

export const POLL_MS_PENDING = 3000; // only when status=pending
export const PAGE_SIZE = 25;         // UI default
