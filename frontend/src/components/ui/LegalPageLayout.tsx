import Link from 'next/link';
import type { ReactNode } from 'react';
import { LEGAL_INFO } from '@/lib/legal';
import { LegalLinks } from './LegalLinks';

export function LegalPageLayout({ title, description, children }: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8 text-gray-800 dark:bg-gray-950 dark:text-gray-200 sm:py-12">
      <div className="mx-auto max-w-3xl space-y-6">
        <Link href="/" className="text-sm text-indigo-600 underline underline-offset-4 dark:text-indigo-300">TPMP 홈</Link>
        <header className="space-y-3">
          <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
          {description && <p className="text-sm leading-6 text-gray-600 dark:text-gray-400">{description}</p>}
          <p className="text-xs text-gray-500 dark:text-gray-400">검토일: {LEGAL_INFO.reviewedAt} · 시행일 미확정</p>
        </header>
        {LEGAL_INFO.policyStatus === 'draft' && (
          <aside aria-label="초안 안내" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            공개 전 확인이 필요한 안내 초안입니다. 공식 서비스 주소·보유기간 등 확정 후 적용됩니다.
          </aside>
        )}
        <article className="space-y-7 rounded-xl border border-gray-200 bg-white p-5 text-sm leading-7 dark:border-gray-800 dark:bg-gray-900 sm:p-8 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_ul]:list-disc [&_ul]:space-y-1 [&_ul]:pl-5 [&_a]:text-indigo-600 [&_a]:underline [&_a]:underline-offset-4 dark:[&_a]:text-indigo-300">
          {children}
        </article>
        <LegalLinks />
      </div>
    </main>
  );
}
