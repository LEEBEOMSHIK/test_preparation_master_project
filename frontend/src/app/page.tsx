'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { LegalLinks } from '@/components/ui/LegalLinks';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(user.role === 'ADMIN' ? '/admin/exams' : '/user/exam-info');
    }
  }, [isAuthenticated, user, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <h1 className="text-3xl font-bold text-indigo-700 mb-2">TPMP</h1>
      <p className="text-gray-500 mb-8 text-center">시험 준비와 개념 정리를 위한 서비스</p>

      <div className="flex gap-3 mb-4">
        <Link
          href="/user/login"
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          사용자 로그인
        </Link>
        <Link
          href="/admin/login"
          className="bg-gray-800 text-white px-6 py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
        >
          관리자 로그인
        </Link>
      </div>
      <Link
        href="/auth/signup"
        className="mb-10 border border-indigo-600 text-indigo-600 px-6 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition"
      >
        회원가입
      </Link>

      <footer className="w-full max-w-lg border-t border-gray-200 pt-6 pb-8">
        <LegalLinks className="justify-center" />
      </footer>
    </main>
  );
}
