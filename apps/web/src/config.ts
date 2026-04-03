const DEFAULT_API_URL = 'http://localhost:3000';

export function getApiUrl(): string {
  return import.meta.env.VITE_API_URL || DEFAULT_API_URL;
}
