'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      router.replace(user.role === 'ADMIN' ? '/admin/exams' : '/user/exams');
    }
  }, [isAuthenticated, user, router]);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <h1 className="text-3xl font-bold text-indigo-700 mb-2">TPMP</h1>
      <p className="text-gray-500 mb-8 text-center">시험 준비와 개념 정리를 위한 서비스</p>

      <div className="flex gap-4 mb-10">
        <Link
          href="/auth/login"
          className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-indigo-700 transition"
        >
          로그인
        </Link>
        <Link
          href="/auth/signup"
          className="border border-indigo-600 text-indigo-600 px-6 py-2 rounded-lg font-semibold hover:bg-indigo-50 transition"
        >
          회원가입
        </Link>
      </div>

      {/* 테스트용 바로가기 */}
      <div className="border border-dashed border-gray-300 rounded-xl p-5 text-center w-full max-w-xs">
        <p className="text-xs text-gray-400 mb-3 uppercase tracking-wide">테스트 바로가기</p>
        <div className="flex flex-col gap-2">
          <Link
            href="/user/exams"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
          >
            사용자 홈 (User)
          </Link>
          <Link
            href="/admin/exams"
            className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200 transition"
          >
            관리자 홈 (Admin)
          </Link>
        </div>
      </div>
    </main>
  );
}
