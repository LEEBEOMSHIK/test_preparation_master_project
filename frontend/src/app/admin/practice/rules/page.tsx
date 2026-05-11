'use client';

import { useEffect, useState } from 'react';
import { practiceAdminService, type PracticeRules } from '@/services/practiceAdminService';

export default function PracticeRulesPage() {
  const [rules, setRules] = useState<PracticeRules | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    practiceAdminService.getRules()
      .then(res => { if (res.data.success && res.data.data) setRules(res.data.data); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
              <div className="h-3 w-full bg-gray-100 dark:bg-gray-700 rounded" />
              <div className="h-3 w-5/6 bg-gray-100 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!rules) {
    return <p className="text-sm text-gray-400">규칙 정보를 불러올 수 없습니다.</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">규칙 관리</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">연습장에 적용되는 SQL 실행 규칙 현황입니다.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 금지 SQL 명령어 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-red-500" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">금지 SQL 명령어</h3>
          </div>
          <ul className="space-y-1.5">
            {rules.blockedCommands.map(cmd => (
              <li key={cmd} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                <code className="px-2 py-0.5 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded text-xs font-mono">
                  {cmd}
                </code>
              </li>
            ))}
          </ul>
        </div>

        {/* 테이블 접두사 규칙 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">허용 테이블 접두사</h3>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
            사용자가 CREATE/DROP/ALTER할 수 있는 테이블은 다음 접두사로 시작해야 합니다.
          </p>
          <code className="inline-block px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-mono font-semibold">
            {rules.allowedTablePrefix}*
          </code>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            예) prac_my_table, prac_test_data
          </p>
        </div>

        {/* 멀티 스테이트먼트 규칙 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">멀티 스테이트먼트 규칙</h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-300">{rules.multiStatementRule}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            세미콜론(;)으로 여러 SQL을 한 번에 실행할 수 없습니다.
          </p>
        </div>

        {/* 오타 감지 패턴 */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">오타 감지 패턴</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left text-gray-400 dark:text-gray-500 border-b border-gray-100 dark:border-gray-700">
                  <th className="pb-1.5 pr-4 font-medium">오타 패턴</th>
                  <th className="pb-1.5 font-medium">올바른 표현</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700">
                {rules.typoPatterns.map((p, i) => (
                  <tr key={i}>
                    <td className="py-1.5 pr-4">
                      <code className="text-red-600 dark:text-red-400 font-mono">{p.typo}</code>
                    </td>
                    <td className="py-1.5">
                      <code className="text-green-600 dark:text-green-400 font-mono">{p.correction}</code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* 연습 테이블 안내 */}
      <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-indigo-800 dark:text-indigo-300 mb-2">기본 연습 테이블 (4개)</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {['prac_departments (부서)', 'prac_employees (직원)', 'prac_products (상품)', 'prac_orders (주문)'].map(t => (
            <div key={t} className="bg-white dark:bg-gray-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-700">
              {t}
            </div>
          ))}
        </div>
        <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-2">
          사용자가 추가로 생성한 prac_* 테이블은 데이터 초기화 시 삭제됩니다.
        </p>
      </div>
    </div>
  );
}
