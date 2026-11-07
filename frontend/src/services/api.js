const API_BASE = '/api/v1';

class ApiClient {
  constructor() {
    this.accessToken = localStorage.getItem('lw_access_token') || null;
    this.refreshToken = localStorage.getItem('lw_refresh_token') || null;
  }

  setTokens({ accessToken, refreshToken }) {
    this.accessToken = accessToken;
    if (accessToken) localStorage.setItem('lw_access_token', accessToken);
    else localStorage.removeItem('lw_access_token');

    if (refreshToken) {
      this.refreshToken = refreshToken;
      localStorage.setItem('lw_refresh_token', refreshToken);
    } else if (refreshToken === null) {
      this.refreshToken = null;
      localStorage.removeItem('lw_refresh_token');
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('lw_access_token');
    localStorage.removeItem('lw_refresh_token');
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const headers = { ...options.headers };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (this.accessToken) {
      headers['Authorization'] = `Bearer ${this.accessToken}`;
    }

    let response = await fetch(url, { ...options, headers });

    // Handle token expiration: attempt 1 refresh
    if (response.status === 401 && this.refreshToken && !options._retry) {
      const refreshSuccess = await this.tryRefreshToken();
      if (refreshSuccess) {
        options._retry = true;
        headers['Authorization'] = `Bearer ${this.accessToken}`;
        response = await fetch(url, { ...options, headers });
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data.error?.message || data.message || `Request failed with status ${response.status}`;
      const err = new Error(errorMessage);
      err.code = data.error?.code || 'API_ERROR';
      err.status = response.status;
      err.details = data.error?.details || null;
      throw err;
    }

    return data;
  }

  async tryRefreshToken() {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        this.setTokens(json.data);
        return true;
      }
    } catch (_) {
      // Refresh failed
    }
    this.clearTokens();
    return false;
  }

  get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }

  put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }

  patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiClient();

