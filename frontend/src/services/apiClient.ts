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
// 토큰 발급 계열(login/refresh/signup)만 갱신 재시도에서 제외해 갱신 루프를 방지한다.
// /auth/me 처럼 인증이 필요한 엔드포인트는 401 시 정상적으로 Refresh→재시도 흐름을 탄다.
const NO_RETRY_AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/signup'];

// single-flight: 동시에 여러 요청이 401을 받아도 Refresh 요청은 1회만 보내고
// 나머지는 동일한 진행 중 Promise를 공유한다. 완료 후 초기화하여 다음 만료 시 재발급 가능.
let refreshPromise: Promise<string> | null = null;
function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post('/api/auth/refresh', {}, { withCredentials: true })
      .then((res) => {
        const newToken: string = res.data.data.accessToken;
        sessionStorage.setItem('accessToken', newToken);
        return newToken;
      })
      .finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const url = (originalRequest.url as string | undefined) ?? '';
    const isNoRetryEndpoint = NO_RETRY_AUTH_ENDPOINTS.some((p) => url.includes(p));

    if (isNoRetryEndpoint) {
      return Promise.reject(error);
    }

    if (status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const newToken = await refreshAccessToken();
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
