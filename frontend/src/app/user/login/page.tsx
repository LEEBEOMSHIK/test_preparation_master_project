'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/Skeleton';
import ThemeToggle from '@/components/ui/ThemeToggle';
import { extractApiErrorMessage } from '@/lib/apiError';

function UserLoginFallback() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Skeleton className="h-9 w-24 rounded-lg mx-auto mb-2" />
          <Skeleton className="h-4 w-32 rounded mx-auto" />
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8 space-y-4">
          <Skeleton className="h-6 w-28 rounded" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      </div>
    </div>
  );
}

function UserLoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth, clearAuth } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get('error') === 'oauth_failed') {
      setError('Google 로그인에 실패했습니다. 다시 시도해 주세요.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authService.login(email, password);
      const { user, accessToken } = res.data.data!;
      if (user.role === 'ADMIN') {
        clearAuth();
        setError('관리자 계정입니다. 관리자 로그인 페이지를 이용해 주세요.');
        return;
      }
      setAuth(user, accessToken);
      if (!user.interestedExamSlaveIds || user.interestedExamSlaveIds.length === 0) {
        router.push('/onboarding');
      } else {
        router.push('/user/exam-info');
      }
    } catch (err: unknown) {
      setError(extractApiErrorMessage(err, '이메일 또는 비밀번호가 올바르지 않습니다.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center px-4">
      <div className="fixed top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">TPMP</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">시험 준비 마스터</p>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">사용자 로그인</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="비밀번호를 입력하세요"
                required
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>

            {error && (
              <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/30 dark:border dark:border-red-800 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>

          <div className="mt-6">
            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
              <span className="mx-3 text-xs text-gray-400 dark:text-gray-500">또는</span>
              <div className="flex-grow border-t border-gray-200 dark:border-gray-700" />
            </div>

            <button
              type="button"
              onClick={() => { window.location.href = '/api/oauth2/authorization/google'; }}
              className="mt-4 w-full flex items-center justify-center gap-2.5 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-200 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                <path fill="none" d="M0 0h48v48H0z"/>
              </svg>
              Google로 로그인
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
            관리자이신가요?{' '}
            <Link href="/admin/login" className="text-gray-700 dark:text-gray-300 font-medium hover:underline">
              관리자 로그인
            </Link>
          </p>
        </div>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-5">
          계정이 없으신가요?{' '}
          <Link href="/auth/signup" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function UserLoginPage() {
  return (
    <Suspense fallback={<UserLoginFallback />}>
      <UserLoginContent />
    </Suspense>
  );
}
