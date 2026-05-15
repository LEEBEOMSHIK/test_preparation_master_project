'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { adminDashboardService, type DashboardStats } from '@/services/adminDashboardService';
import { Skeleton } from '@/components/ui/Skeleton';

interface StatCardProps {
  title: string;
  value: number | string;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

function StatCard({ title, value, description, href, icon, color, loading }: StatCardProps) {
  return (
    <Link
      href={href}
      className="block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{title}</p>
          {loading ? (
            <Skeleton className="h-8 w-20 mt-1" />
          ) : (
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value.toLocaleString()}</p>
          )}
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5">{description}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          {icon}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-1 text-xs font-medium text-indigo-600 dark:text-indigo-400 group-hover:gap-2 transition-all">
        자세히 보기
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="w-3.5 h-3.5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminDashboardService.getStats()
      .then((res) => { if (res.data.success) setStats(res.data.data!); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const cards: Omit<StatCardProps, 'loading'>[] = [
    {
      title: '오늘 로그인',
      value: stats?.todayLoginCount ?? 0,
      description: '오늘 로그인한 사용자 수',
      href: '/admin/login-history',
      color: 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
        </svg>
      ),
    },
    {
      title: '전체 회원',
      value: stats?.totalMemberCount ?? 0,
      description: '등록된 전체 회원 수',
      href: '/admin/users',
      color: 'bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
    },
    {
      title: '오늘 새 문의',
      value: stats?.todayInquiryCount ?? 0,
      description: '오늘 접수된 1:1 문의 건수',
      href: '/admin/inquiries',
      color: 'bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      ),
    },
    {
      title: '대기 문의',
      value: stats?.pendingInquiryCount ?? 0,
      description: '미처리(대기) 문의 건수',
      href: '/admin/inquiries',
      color: 'bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      title: '전체 시험',
      value: stats?.totalExamCount ?? 0,
      description: '등록된 시험 수',
      href: '/admin/exams',
      color: 'bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">대시보드</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">서비스 현황을 한눈에 확인하세요.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => (
          <StatCard key={card.title} {...card} loading={loading} />
        ))}
      </div>
    </div>
  );
}
