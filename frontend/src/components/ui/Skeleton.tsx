'use client';

import React from 'react';

// ── Atom ─────────────────────────────────────────────────────────────────────

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return <div className={`bg-gray-200 rounded-md ${className}`} style={style} />;
}

// ── TableSkeleton ─────────────────────────────────────────────────────────────
// 용도: 관리자/사용자 테이블 목록 페이지

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
}

export function TableSkeleton({ rows = 5, cols = 5 }: TableSkeletonProps) {
  return (
    <div className="animate-pulse">
      <div className="flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-100">
        <Skeleton className="h-3 w-8 shrink-0" />
        <Skeleton className="h-3 flex-1" />
        {cols > 2 && <Skeleton className="h-3 w-24 shrink-0" />}
        {cols > 3 && <Skeleton className="h-3 w-24 shrink-0" />}
        {cols > 4 && <Skeleton className="h-3 w-20 shrink-0" />}
        {cols > 5 && <Skeleton className="h-3 w-28 shrink-0" />}
        {cols > 6 && <Skeleton className="h-3 w-20 shrink-0" />}
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50 last:border-0">
          <Skeleton className="h-3.5 w-8 shrink-0" />
          <Skeleton className={`h-3.5 shrink-0 ${i % 3 === 0 ? 'w-1/2' : i % 3 === 1 ? 'w-3/5' : 'w-2/5'}`} />
          <div className="flex-1" />
          {cols > 2 && <Skeleton className="h-3.5 w-16 shrink-0" />}
          {cols > 3 && <Skeleton className="h-3.5 w-20 shrink-0" />}
          {cols > 4 && <Skeleton className="h-3.5 w-16 shrink-0" />}
          {cols > 5 && <Skeleton className="h-3.5 w-24 shrink-0" />}
          {cols > 6 && <Skeleton className="h-3.5 w-20 shrink-0" />}
        </div>
      ))}
    </div>
  );
}

// ── CardListSkeleton ──────────────────────────────────────────────────────────
// 용도: 카드형 목록 (시험 목록, 개념노트 등)

interface CardListSkeletonProps {
  rows?: number;
}

export function CardListSkeleton({ rows = 6 }: CardListSkeletonProps) {
  return (
    <div className="grid gap-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 px-5 py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 space-y-2">
              <Skeleton className={`h-4 ${i % 2 === 0 ? 'w-1/2' : 'w-2/5'}`} />
              <Skeleton className={`h-3 ${i % 3 === 0 ? 'w-1/3' : 'w-1/4'}`} />
            </div>
            <Skeleton className="w-4 h-4 shrink-0 rounded-sm" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ── ExamInfoCardSkeleton ──────────────────────────────────────────────────────
// 용도: 시험 정보 카드 (user/exam-info)

interface ExamInfoCardSkeletonProps {
  count?: number;
}

export function ExamInfoCardSkeleton({ count = 4 }: ExamInfoCardSkeletonProps) {
  return (
    <div className="grid gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className={`h-5 ${i % 2 === 0 ? 'w-40' : 'w-32'}`} />
            </div>
            <Skeleton className="h-4 w-20 shrink-0" />
          </div>
          <Skeleton className="h-3.5 w-full mb-1.5" />
          <Skeleton className="h-3.5 w-3/4 mb-4" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((j) => (
              <div key={j} className="bg-gray-50 rounded-xl p-3 space-y-2">
                <Skeleton className="h-2.5 w-12" />
                <Skeleton className="h-3.5 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── AccordionSkeleton ─────────────────────────────────────────────────────────
// 용도: 아코디언 목록 (FAQ)

interface AccordionSkeletonProps {
  rows?: number;
}

export function AccordionSkeleton({ rows = 6 }: AccordionSkeletonProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-4 gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Skeleton className="w-6 h-6 rounded-full shrink-0" />
            <Skeleton className={`h-4 ${i % 3 === 0 ? 'w-3/5' : i % 3 === 1 ? 'w-4/5' : 'w-1/2'}`} />
          </div>
          <Skeleton className="w-4 h-4 shrink-0 rounded-sm" />
        </div>
      ))}
    </div>
  );
}

// ── CardGridSkeleton ──────────────────────────────────────────────────────────
// 용도: 카드 그리드 (퀴즈 카테고리)

export function CardGridSkeleton() {
  const groups = [4, 3];
  return (
    <div className="space-y-6 animate-pulse">
      {groups.map((count, gi) => (
        <div key={gi}>
          <Skeleton className="h-3.5 w-24 mb-2" />
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-xl px-4 py-5">
                <Skeleton className="w-9 h-9 rounded-lg mb-3" />
                <Skeleton className={`h-3.5 mb-1.5 ${i % 2 === 0 ? 'w-3/4' : 'w-2/3'}`} />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── DashboardSkeleton ─────────────────────────────────────────────────────────
// 용도: 사용자 통계 대시보드 (요약카드 4개 + 도메인 막대 + 추이 막대 + 약점 Top5)

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 요약 카드 4개 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-4 space-y-3">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        ))}
      </div>

      {/* 도메인별 수평 막대 */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-5 space-y-3">
        <Skeleton className="h-3.5 w-28 mb-4" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <Skeleton className={`h-3 shrink-0 ${i % 2 === 0 ? 'w-24' : 'w-20'}`} />
            <Skeleton className={`h-5 rounded-sm ${i % 3 === 0 ? 'w-3/4' : i % 3 === 1 ? 'w-1/2' : 'w-2/3'}`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* 날짜별 추이 막대 */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-5">
          <Skeleton className="h-3.5 w-24 mb-4" />
          <div className="flex items-end gap-1 h-24">
            {Array.from({ length: 14 }).map((_, i) => (
              <Skeleton key={i} className="flex-1 rounded-sm" style={{ height: `${25 + (i % 5) * 15}%` }} />
            ))}
          </div>
        </div>

        {/* 약점 도메인 Top 5 */}
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-700 p-5 space-y-3">
          <Skeleton className="h-3.5 w-28 mb-4" />
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="flex justify-between">
                <Skeleton className={`h-3 ${i % 2 === 0 ? 'w-28' : 'w-20'}`} />
                <Skeleton className="h-3 w-10" />
              </div>
              <Skeleton className="h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
