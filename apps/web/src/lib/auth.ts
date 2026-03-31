'use client';

export const setToken = (token: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('wowcado_token', token);
  }
};

export const getToken = () => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('wowcado_token');
  }
  return null;
};

export const clearToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wowcado_token');
  }
};

/** Decode JWT payload without verifying signature (client-side only check). */
function decodeJwtPayload(token: string): Record<string, any> | null {
  try {
    const base64 = token.split('.')[1];
    return JSON.parse(atob(base64.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

/**
 * Returns true only if a token exists AND its exp claim hasn't passed.
 * Automatically clears stale tokens so the layout redirects cleanly.
 */
export const isAuthenticated = () => {
  const token = getToken();
  if (!token) return false;
  const payload = decodeJwtPayload(token);
  if (!payload || !payload.exp) return false;
  const nowSec = Math.floor(Date.now() / 1000);
  if (payload.exp < nowSec) {
    // Token expired — clear it so the guard redirects to login
    clearToken();
    return false;
  }
  return true;
};

export const getUserRole = (): string | null => {
  const token = getToken();
  if (!token) return null;
  const payload = decodeJwtPayload(token);
  return payload?.roles?.[0] || null;
};
