import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://committee-injuries-combinations-karl.trycloudflare.com',
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

axiosInstance.interceptors.request.use(
  (config) => {
    // Prevent double slashes if baseURL ends with / and config.url starts with /
    if (config.baseURL?.endsWith('/') && config.url?.startsWith('/')) {
      config.url = config.url.substring(1);
    }

    const token = localStorage.getItem('token');
    const isPublicRoute = config.url?.includes('/api/auth/login');

    if (token && token !== 'undefined' && token !== 'null') {
      console.log(`Attaching Auth: Bearer ${token.substring(0, 10)}...`);
      config.headers.Authorization = `Bearer ${token}`;
    } else if (!isPublicRoute) {
      console.log('No token for request:', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthError = error.response?.status === 401;
    // Match /api/users/onboard even if it has baseURL or query params
    const driversEndpointPattern = /\/api\/users\/onboard/;
    const isDriversFetch = driversEndpointPattern.test(error.config?.url || '');

    // If it's a 401 on the drivers fetch, we let the component handle the error
    // instead of forcing a global logout.
    if (isAuthError && !isDriversFetch) {
      const wasAuthenticated = localStorage.getItem('isAuthenticated') === 'true';

      localStorage.removeItem('token');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');

      if (wasAuthenticated && !window.location.pathname.includes('/auth/login')) {
        window.location.href = '/auth/login';
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
