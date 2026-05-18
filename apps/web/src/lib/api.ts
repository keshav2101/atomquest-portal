// ============================================================
// Axios API Client — configured with JWT interceptors
// ============================================================

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export const apiClient = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Request interceptor — attach Bearer token
apiClient.interceptors.request.use(
  async (config) => {
    // In Next.js App Router, we get token from the session
    // Token is injected by the calling hook via getApiClient(token)
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — extract .data from envelope
apiClient.interceptors.response.use(
  (response) => {
    // API wraps responses in { success, data, timestamp }
    if (response.data?.success !== undefined) {
      return { ...response, data: response.data.data };
    }
    return response;
  },
  (error) => {
    const message =
      error.response?.data?.message ||
      error.response?.data?.errors?.join(', ') ||
      error.message ||
      'An unexpected error occurred';
    return Promise.reject(new Error(message));
  },
);

/** Creates an axios instance with the provided auth token. */
export function getApiClient(token: string) {
  const client = axios.create({
    baseURL: `${API_URL}/api/v1`,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    timeout: 30000,
  });

  client.interceptors.response.use(
    (response) => {
      if (response.data?.success !== undefined) {
        return { ...response, data: response.data.data };
      }
      return response;
    },
    (error) => {
      const message =
        error.response?.data?.message ||
        error.response?.data?.errors?.join(', ') ||
        error.message ||
        'An unexpected error occurred';
      return Promise.reject(new Error(message));
    },
  );

  return client;
}
