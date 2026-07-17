import axios from 'axios';
import type { ApiResponse, RefreshResponse } from '@/types';

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
const NO_RETRY_AUTH_ENDPOINTS = ['/auth/login', '/auth/refresh', '/auth/signup', '/auth/logout'];

// single-flight: 동시에 여러 요청이 401을 받아도 Refresh 요청은 1회만 보내고
// 나머지는 동일한 진행 중 Promise를 공유한다. 완료 후 초기화하여 다음 만료 시 재발급 가능.
let refreshPromise: Promise<string> | null = null;
function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    // 사용자/관리자 탭이 같은 브라우저에서 동시에 열려도 refresh 쿠키가 role별로 분리되어 있으므로
    // 현재 경로 기준으로 scope를 판정해 올바른 쿠키를 사용하도록 서버에 알려준다.
    const scope = window.location.pathname.startsWith('/admin') ? 'admin' : 'user';
    refreshPromise = axios
      .post<ApiResponse<RefreshResponse>>(`/api/auth/refresh?scope=${scope}`, {}, { withCredentials: true })
      .then((res) => {
        const data = res.data.data;
        if (!data) {
          throw new Error('Invalid refresh response');
        }
        const responseEmail = data.user?.email;
        const storedEmail = sessionStorage.getItem('authEmail');

        // 쿠키 분리가 어긋난 경우(레거시 쿠키 잔존 등) 다른 계정의 토큰이 내려올 수 있으므로
        // 저장된 계정과 응답 계정이 다르면 절대 저장하지 않고 실패 처리한다(호출부가 로그아웃 처리).
        if (storedEmail && responseEmail && storedEmail !== responseEmail) {
          throw new Error('Refresh account mismatch');
        }
        if (!storedEmail && responseEmail) {
          sessionStorage.setItem('authEmail', responseEmail);
        }

        sessionStorage.setItem('accessToken', data.accessToken);
        return data.accessToken;
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
        sessionStorage.removeItem('authEmail');
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
