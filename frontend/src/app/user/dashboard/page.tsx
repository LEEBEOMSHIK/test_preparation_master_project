'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
} from 'recharts';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { userDashboardService, type DashboardPeriod } from '@/services/userDashboardService';
import type { UserDashboardData, DomainStat, DailyStat, QuizDomainStat, QuizDailyStat } from '@/types';

// ── 기간 탭 ──────────────────────────────────────────────────────────────────

const PERIODS: { label: string; value: DashboardPeriod }[] = [
  { label: '7일',  value: 7  },
  { label: '30일', value: 30 },
  { label: '전체', value: 0  },
];

// ── 도메인 정답률 구간별 색상 ─────────────────────────────────────────────────

function domainBarColor(rate: number): string {
  if (rate >= 70) return '#10b981'; // emerald
  if (rate >= 40) return '#f59e0b'; // amber
  return '#f43f5e';                  // rose
}

// ── 요약 카드 ─────────────────────────────────────────────────────────────────

interface SummaryCardProps {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: React.ReactNode;
}

function SummaryCard({ label, value, sub, color, icon }: SummaryCardProps) {
  return (
    <div className={`bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-4`}>
      <div className="flex items-start justify-between mb-2">
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">
          {label}
        </p>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
      {sub && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

// ── 페이지 컴포넌트 ────────────────────────────────────────────────────────────

export default function UserDashboardPage() {
  const [period, setPeriod]   = useState<DashboardPeriod>(30);
  const [loading, setLoading] = useState(true);
  const [data, setData]       = useState<UserDashboardData | null>(null);

  useEffect(() => {
    setLoading(true);
    userDashboardService.getStats(period)
      .then((res) => {
        if (res.data.success && res.data.data) {
          setData(res.data.data);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [period]);

  // ── 스켈레톤 ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-4">
        <PageHeader period={period} onPeriodChange={setPeriod} />
        <DashboardSkeleton />
      </div>
    );
  }

  // ── 데이터 없음 ────────────────────────────────────────────────────────────
  if (!data || (data.totalQuestions === 0 && data.quizTotalQuestions === 0)) {
    return (
      <div className="space-y-4">
        <PageHeader period={period} onPeriodChange={setPeriod} />
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
            className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3">
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            해당 기간에 응시 이력이 없습니다.
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            시험을 응시하면 통계가 쌓입니다.
          </p>
        </div>
      </div>
    );
  }

  const {
    totalQuestions,
    totalCorrect,
    overallCorrectRate,
    domainStats,
    weakDomains,
    dailyTrend,
    quizTotalQuestions,
    quizDomainStats,
    quizDailyStats,
  } = data;

  // ── 차트 데이터 변환 ────────────────────────────────────────────────────────
  const domainChartData = [...domainStats]
    .sort((a, b) => b.correctRate - a.correctRate) // 높은 쪽 위로 (수평 막대 위→아래 = 배열 역순)
    .map((d: DomainStat) => ({
      name: d.domainName,
      rate: Math.round(d.correctRate * 10) / 10,
    }));

  const dailyChartData = dailyTrend.map((d: DailyStat) => ({
    date: d.date.slice(5), // "MM-DD"
    rate: Math.round(d.correctRate * 10) / 10,
  }));

  // 퀴즈 도메인별 풀이량 — 많이 푼 도메인이 수평 막대 위로 오도록 오름차순 sort (recharts layout="vertical" 특성)
  const quizDomainChartData = [...quizDomainStats]
    .sort((a, b) => a.totalQuestions - b.totalQuestions)
    .map((d: QuizDomainStat) => ({
      name: d.domainName,
      count: d.totalQuestions,
    }));

  const quizDailyChartData = quizDailyStats.map((d: QuizDailyStat) => ({
    date: d.date.slice(5), // "MM-DD"
    count: d.totalQuestions,
  }));

  const quizDomainMaxCount = quizDomainChartData.reduce((max, d) => Math.max(max, d.count), 1);

  return (
    <div className="space-y-5">
      <PageHeader period={period} onPeriodChange={setPeriod} />

      {/* ── 요약 카드 (2x2 / sm:4열) ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="시험 풀이 문항"
          value={totalQuestions.toLocaleString()}
          sub="시험 누적 풀이 문항 수"
          color="bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          }
        />
        <SummaryCard
          label="시험 정답"
          value={totalCorrect.toLocaleString()}
          sub="시험 누적 정답 수"
          color="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          }
        />
        <SummaryCard
          label="시험 정답률"
          value={`${overallCorrectRate.toFixed(1)}%`}
          sub="시험 전체 평균"
          color="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10" />
            </svg>
          }
        />
        <SummaryCard
          label="시험 도메인"
          value={`${domainStats.length}개`}
          sub="응시한 도메인 수"
          color="bg-violet-50 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400"
          icon={
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round"
                d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          }
        />
      </div>

      {/* ── 도메인별 정답률 수평 BarChart ──────────────────────────────── */}
      {domainChartData.length > 0 && (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
            도메인별 정답률
          </p>
          <ResponsiveContainer width="100%" height={Math.max(180, domainChartData.length * 36)}>
            <BarChart
              layout="vertical"
              data={domainChartData}
              margin={{ left: 8, right: 24, top: 0, bottom: 0 }}
              barCategoryGap="30%"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tick={{ fontSize: 10, fill: '#9ca3af' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `${v}%`}
              />
              <YAxis
                type="category"
                dataKey="name"
                width={90}
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                contentStyle={{
                  fontSize: 12,
                  borderRadius: 8,
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                }}
                formatter={(v) => [typeof v === 'number' ? `${v}%` : '', '정답률']}
              />
              <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                {domainChartData.map((entry, index) => (
                  <Cell key={index} fill={domainBarColor(entry.rate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ── 날짜별 정답률 추이 수직 BarChart ─────────────────────── */}
        {dailyChartData.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
              날짜별 정답률 추이
            </p>
            <ResponsiveContainer width="100%" height={160}>
              <BarChart
                data={dailyChartData}
                margin={{ left: 0, right: 4, top: 0, bottom: 0 }}
                barCategoryGap={dailyChartData.length > 20 ? '10%' : '30%'}
              >
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fill: '#9ca3af' }}
                  axisLine={false}
                  tickLine={false}
                  interval={dailyChartData.length > 14 ? 3 : 0}
                />
                <YAxis
                  hide
                  domain={[0, 100]}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                  }}
                  formatter={(v) => [typeof v === 'number' ? `${v}%` : '', '정답률']}
                />
                <Bar dataKey="rate" radius={[3, 3, 0, 0]}>
                  {dailyChartData.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={index === dailyChartData.length - 1 ? '#6366f1' : '#6366f155'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* ── 약점 도메인 Top 5 (Tailwind 진행바) ──────────────────── */}
        {weakDomains.length > 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
              약점 도메인 Top {weakDomains.length}
            </p>
            <div className="space-y-3">
              {weakDomains.map((d: DomainStat, idx: number) => (
                <div key={idx}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate max-w-[70%]">
                      {d.domainName}
                    </span>
                    <span className={`text-xs font-bold ${
                      d.correctRate >= 70
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : d.correctRate >= 40
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}>
                      {d.correctRate.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(d.correctRate, 100)}%`,
                        backgroundColor: domainBarColor(d.correctRate),
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ── 퀴즈 풀이량 섹션 ──────────────────────────────────────── */}
      {quizTotalQuestions > 0 && (
        <div className="space-y-4">
          {/* 섹션 헤더 */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-gray-800 dark:text-gray-100">퀴즈 풀이량</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                데일리 퀴즈 풀이 현황 · 정오답 무관, 풀이 수 기준
              </p>
            </div>
            <span className="text-sm font-bold text-indigo-600 dark:text-indigo-400">
              총 {quizTotalQuestions.toLocaleString()}문제 풀이
            </span>
          </div>

          {/* 도메인별 풀이수 수평 BarChart */}
          {quizDomainChartData.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                도메인별 풀이량
              </p>
              <ResponsiveContainer width="100%" height={Math.max(160, quizDomainChartData.length * 36)}>
                <BarChart
                  layout="vertical"
                  data={quizDomainChartData}
                  margin={{ left: 8, right: 24, top: 0, bottom: 0 }}
                  barCategoryGap="30%"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis
                    type="number"
                    domain={[0, quizDomainMaxCount]}
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={90}
                    tick={{ fontSize: 11, fill: '#6b7280' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.03)' }}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                    formatter={(v) => [typeof v === 'number' ? `${v}문제` : '', '풀이 수']}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* 일자별 풀이수 수직 BarChart */}
          {quizDailyChartData.length > 0 && (
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-4">
                날짜별 퀴즈 풀이량
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart
                  data={quizDailyChartData}
                  margin={{ left: 0, right: 4, top: 0, bottom: 0 }}
                  barCategoryGap={quizDailyChartData.length > 20 ? '10%' : '30%'}
                >
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#9ca3af' }}
                    axisLine={false}
                    tickLine={false}
                    interval={quizDailyChartData.length > 14 ? 3 : 0}
                  />
                  <YAxis hide />
                  <Tooltip
                    cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                    contentStyle={{
                      fontSize: 12,
                      borderRadius: 8,
                      border: '1px solid #e5e7eb',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    }}
                    formatter={(v) => [typeof v === 'number' ? `${v}문제` : '', '풀이 수']}
                  />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {quizDailyChartData.map((_, index) => (
                      <Cell
                        key={index}
                        fill={index === quizDailyChartData.length - 1 ? '#6366f1' : '#6366f155'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 페이지 헤더 (제목 + 기간 탭) ─────────────────────────────────────────────

interface PageHeaderProps {
  period: DashboardPeriod;
  onPeriodChange: (p: DashboardPeriod) => void;
}

function PageHeader({ period, onPeriodChange }: PageHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">통계 대시보드</h2>
        <p className="text-sm text-gray-400 dark:text-gray-500 mt-0.5">
          내 시험 응시 결과를 한눈에 확인하세요.
        </p>
      </div>
      <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
        {PERIODS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => onPeriodChange(value)}
            className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
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
  );
}
