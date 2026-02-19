/**
 * API client utility with automatic 401 handling
 * Usage: import { apiClient } from '@/utils/apiClient'
 * Then use apiClient(url, options) instead of fetch(url, options)
 */

let navigate401Handler: ((path: string) => void) | null = null;

export const setNavigate401Handler = (handler: (path: string) => void) => {
  navigate401Handler = handler;
};

export const apiClient = async (
  url: string,
  options?: RequestInit
): Promise<Response> => {
  const response = await fetch(url, options);

  // Handle 401 Unauthorized
  if (response.status === 401) {
    if (navigate401Handler) {
      navigate401Handler("/login");
    }
    throw new Error("Unauthorized - Session expired");
  }

  return response;
};

/**
 * Convenience method for JSON responses with automatic 401 handling
 */
export const apiClientJson = async <T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> => {
  const response = await apiClient(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }
  
  return response.json();
};
