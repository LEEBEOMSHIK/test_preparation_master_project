import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || '/api',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true, // Refresh Token cookie 전송
});

// Request interceptor: Access Token 주입
apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = sessionStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Response interceptor: 401 → 토큰 갱신 시도, 403 → 권한 없음 팝업
// /auth/ 엔드포인트는 인터셉트하지 않음 (로그인 실패 401이 갱신 루프에 빠지는 것 방지)
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthEndpoint = (originalRequest.url as string | undefined)?.includes('/auth/');

    if (isAuthEndpoint) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true });
        const newToken: string = data.data.accessToken;
        sessionStorage.setItem('accessToken', newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch {
        sessionStorage.removeItem('accessToken');
        const loginPath = window.location.pathname.startsWith('/admin/') ? '/admin/login' : '/user/login';
        window.location.href = loginPath;
      }
    }

    if (status === 403) {
      // 인증된 사용자의 권한 부족 — 토큰 유지, 팝업으로 안내
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('permission-denied'));
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
