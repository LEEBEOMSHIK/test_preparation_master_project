'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { authService } from '@/services/authService';
import { useAuthStore } from '@/store/authStore';

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setAuth } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const error = searchParams.get('error');

    if (error || !token) {
      router.push('/auth/login?error=oauth_failed');
      return;
    }

    sessionStorage.setItem('accessToken', token);

    authService.me()
      .then(res => {
        const user = res.data.data!;
        setAuth(user, token);
        if (user.role === 'ADMIN') {
          router.push('/admin/exams');
        } else if (user.isFirstLogin) {
          router.push('/onboarding');
        } else {
          router.push('/user/exam-info');
        }
      })
      .catch(() => {
        sessionStorage.removeItem('accessToken');
        router.push('/auth/login?error=oauth_failed');
      });
  }, [searchParams, router, setAuth]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-950 dark:to-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Google 로그인 처리 중...</p>
      </div>
    </div>
  );
}
