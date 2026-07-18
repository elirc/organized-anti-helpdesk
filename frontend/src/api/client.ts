import { useAuthStore } from '../auth/auth.store';

const BASE_URL = 'http://localhost:3000/api';

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch(endpoint: string, options: RequestOptions = {}) {
  const { accessToken, logout, setToken } = useAuthStore.getState();

  const headers = new Headers(options.headers || {});
  if (accessToken && !options.skipAuth) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const config: RequestInit = {
    ...options,
    headers,
  };

  let response = await fetch(`${BASE_URL}${endpoint}`, config);

  // If 401, attempt refresh token flow (Wait, for now we will just log out or handle refresh if available)
  if (response.status === 401 && accessToken && !options.skipAuth) {
    // Attempting refresh token flow could go here.
    // For MVP, we will trigger logout on authorization expiry.
    logout();
    throw new Error('Unauthorized');
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'API request failed');
  }

  return response.json();
}
