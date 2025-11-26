// API Configuration
// In development, uses Vite proxy (/api)
// In production, uses full API URL

const getApiBaseUrl = () => {
  // Check if we're in development (Vite dev server)
  if (import.meta.env.DEV) {
    // Use proxy in development
    return '/api';
  }
  
  // In production, use the full API URL
  // You can override this with VITE_API_URL environment variable
  return import.meta.env.VITE_API_URL || 'https://resumeparserats.netlify.app/api';
};

export const API_BASE_URL = getApiBaseUrl();

