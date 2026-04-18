import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white px-4">
      <h1 className="text-3xl font-bold text-indigo-700 mb-2">TPMP</h1>
      <p className="text-gray-500 mb-8 text-center">시험 준비와 개념 정리를 위한 서비스</p>
      <div className="flex gap-4">
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
    </main>
  );
}
