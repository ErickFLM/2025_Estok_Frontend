// src/utils/authFetch.js

// where you store the token; here we use localStorage for simplicity
export function setToken(token) {
  if (token) localStorage.setItem('token', token);
  else localStorage.removeItem('token');
}
export function getToken() {
  return localStorage.getItem('token');
}
export function clearToken() {
  localStorage.removeItem('token');
}

// centralized fetch wrapper
export default async function authFetch(input, init = {}) {
  const token = getToken();

  // avoid mutating the caller's object
  const opts = {
    ...init,
    headers: {
      ...(init.headers || {})
    }
  };

  if (token) opts.headers['Authorization'] = 'Bearer ' + token;

  // send cookies if you use session cookies (adjust to your backend)
  // if (!opts.credentials) opts.credentials = 'include';

  const res = await fetch(input, opts);

  // If not 401, return the normal response
  if (res.status !== 401) return res;

  // If 401, clear token and redirect to login
  // (optional: inspect body to differentiate "expired" from "invalid")
  try {
    const body = await res.clone().json().catch(()=>null);
    // optional: only redirect if token is expired
    // const isExpired = body && (body.message === 'Token expired' || body.message === 'Token expirado');
    // if (!isExpired) return res;
  } catch(e) { /* ignore */ }

  clearToken();

  // if the request is already to the login route, don't redirect to avoid loop
  const url = (typeof input === 'string') ? input : (input.url || '');
  if (!url.includes('/auth/login')) {
    // if SPA, prefer using your router to navigate without reload.
    // here we do a simple reload:
    window.location.href = '/login';
  }

  return res;
}
