'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import {
  adminDashboardService,
  type DashboardStats,
  type DashboardTrend,
  type DayCount,
} from '@/services/adminDashboardService';
import { Skeleton } from '@/components/ui/Skeleton';

type Period = 7 | 30 | 90;
const PERIODS: { label: string; value: Period }[] = [
  { label: '7일', value: 7 },
  { label: '30일', value: 30 },
  { label: '3개월', value: 90 },
];

interface StatCardProps {
  title: string;
  value: number;
  description: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
}

interface SectionProps {
  title: string;
  dot: string;
  children: React.ReactNode;
}

interface TrendChartProps {
  title: string;
  data: DayCount[];
  barColor: string;
  loading: boolean;
  period: Period;
}

function StatCard({ title, value, description, href, icon, color, loading }: StatCardProps) {
  return (
    <Link
      href={href}
      className="block bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md hover:border-indigo-300 dark:hover:border-indigo-600 transition-all group"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">
            {title}
          </p>
          {loading ? (
            <Skeleton className="h-8 w-20 mt-1" />
          ) : (
            <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              {value.toLocaleString()}
            </p>
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

function Section({ title, dot, children }: SectionProps) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${dot}`} />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {children}
      </div>
    </div>
  );
}

function TrendChart({ title, data, barColor, loading, period }: TrendChartProps) {
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  // 막대가 많으면 일부 레이블만 표시
  const tickInterval = period === 7 ? 0 : period === 30 ? 4 : 13;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
        {title}
      </p>
      {loading ? (
        <div className="flex items-end gap-1 h-24">
          {Array.from({ length: Math.min(period, 15) }).map((_, i) => (
            <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${30 + (i % 4) * 18}%` }} />
          ))}
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={96}>
          <BarChart data={data} barCategoryGap={period > 30 ? '10%' : '30%'}>
            <XAxis
              dataKey="date"
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              axisLine={false}
              tickLine={false}
              interval={tickInterval}
            />
            <YAxis hide domain={[0, maxVal + 1]} />
            <Tooltip
              cursor={{ fill: 'rgba(0,0,0,0.04)' }}
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
              }}
              formatter={(v) => [typeof v === 'number' ? v.toLocaleString() : '', '건수']}
            />
            <Bar dataKey="count" radius={[3, 3, 0, 0]}>
              {data.map((_, index) => (
                <Cell
                  key={index}
                  fill={index === data.length - 1 ? barColor : `${barColor}55`}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trend, setTrend] = useState<DashboardTrend | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [loadingTrend, setLoadingTrend] = useState(true);
  const [period, setPeriod] = useState<Period>(7);

  useEffect(() => {
    adminDashboardService.getStats()
      .then((res) => { if (res.data.success) setStats(res.data.data!); })
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, []);

  useEffect(() => {
    setLoadingTrend(true);
    adminDashboardService.getTrend(period)
      .then((res) => { if (res.data.success) setTrend(res.data.data!); })
      .catch(() => {})
      .finally(() => setLoadingTrend(false));
  }, [period]);

  const empty: DayCount[] = Array.from({ length: period }, () => ({ date: '', count: 0 }));

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">대시보드</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">서비스 현황을 한눈에 확인하세요.</p>
      </div>

      <div className="space-y-8">

        {/* 회원 */}
        <Section title="회원" dot="bg-indigo-500">
          <StatCard
            title="오늘 로그인"
            value={stats?.todayLoginCount ?? 0}
            description="오늘 로그인한 사용자 수"
            href="/admin/login-history"
            color="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
            loading={loadingStats}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
            }
          />
          <StatCard
            title="전체 회원"
            value={stats?.totalMemberCount ?? 0}
            description="등록된 전체 회원 수"
            href="/admin/users"
            color="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
            loading={loadingStats}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
          />
        </Section>

        {/* 시험 */}
        <Section title="시험" dot="bg-emerald-500">
          <StatCard
            title="전체 시험"
            value={stats?.totalExamCount ?? 0}
            description="등록된 시험 수"
            href="/admin/exams"
            color="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
            loading={loadingStats}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            }
          />
          <StatCard
            title="오늘 시험 응시"
            value={stats?.todayExamAttemptCount ?? 0}
            description="오늘 시험을 응시한 횟수"
            href="/admin/exams/history"
            color="bg-teal-50 dark:bg-teal-900/40 text-teal-600 dark:text-teal-400"
            loading={loadingStats}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            }
          />
        </Section>

        {/* 퀴즈 */}
        <Section title="퀴즈" dot="bg-purple-500">
          <StatCard
            title="오늘 퀴즈 풀이"
            value={stats?.todayQuizAttemptCount ?? 0}
            description="오늘 데일리 퀴즈를 풀이한 횟수"
            href="/admin/quiz/history"
            color="bg-purple-50 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400"
            loading={loadingStats}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zM12 17h.007v.008H12V17z" />
              </svg>
            }
          />
        </Section>

        {/* 문의 */}
        <Section title="문의" dot="bg-amber-500">
          <StatCard
            title="오늘 새 문의"
            value={stats?.todayInquiryCount ?? 0}
            description="오늘 접수된 1:1 문의 건수"
            href="/admin/inquiries"
            color="bg-amber-50 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400"
            loading={loadingStats}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            }
          />
          <StatCard
            title="대기 문의"
            value={stats?.pendingInquiryCount ?? 0}
            description="미처리(대기) 문의 건수"
            href="/admin/inquiries"
            color="bg-rose-50 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400"
            loading={loadingStats}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
          />
          <StatCard
            title="버그 신고 대기"
            value={stats?.pendingBugCount ?? 0}
            description="미처리(대기) 버그 신고 건수"
            href="/admin/inquiries?type=BUG"
            color="bg-red-50 dark:bg-red-900/40 text-red-600 dark:text-red-400"
            loading={loadingStats}
            icon={
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            }
          />
        </Section>

        {/* 최근 추이 */}
        <div>
          {/* 섹션 헤더 + 기간 탭 */}
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2.5 h-2.5 rounded-full shrink-0 bg-violet-500" />
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">추이</h3>
            <div className="flex-1 h-px bg-gray-100 dark:bg-gray-800" />
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
              {PERIODS.map(({ label, value }) => (
                <button
                  key={value}
                  onClick={() => setPeriod(value)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap ${
                    period === value
                      ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <TrendChart
              title="로그인"
              data={trend?.loginTrend ?? empty}
              barColor="#6366f1"
              loading={loadingTrend}
              period={period}
            />
            <TrendChart
              title="시험 응시"
              data={trend?.examTrend ?? empty}
              barColor="#10b981"
              loading={loadingTrend}
              period={period}
            />
            <TrendChart
              title="퀴즈 풀이"
              data={trend?.quizTrend ?? empty}
              barColor="#a855f7"
              loading={loadingTrend}
              period={period}
            />
            <TrendChart
              title="문의 접수"
              data={trend?.inquiryTrend ?? empty}
              barColor="#f59e0b"
              loading={loadingTrend}
              period={period}
            />
          </div>
        </div>

      </div>
    </div>
  );
}
