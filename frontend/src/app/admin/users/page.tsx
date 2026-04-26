'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { adminUserService, type AdminUser } from '@/services/adminUserService';

type TabKey = 'ALL' | 'USER' | 'ADMIN';

const ROLE_LABEL: Record<string, string> = { USER: '사용자', ADMIN: '관리자' };
const ROLE_COLOR: Record<string, string> = {
  USER: 'bg-emerald-100 text-emerald-700',
  ADMIN: 'bg-indigo-100 text-indigo-700',
};

export default function AdminUsersPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>('ALL');
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async (activeTab: TabKey) => {
    setLoading(true);
    try {
      const role = activeTab === 'ALL' ? undefined : activeTab;
      const res = await adminUserService.getAll(role);
      if (res.data.success && res.data.data) setUsers(res.data.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(tab); }, [tab]);

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' });

  const TABS: { key: TabKey; label: string }[] = [
    { key: 'ALL', label: '전체' },
    { key: 'USER', label: '사용자' },
    { key: 'ADMIN', label: '관리자' },
  ];

  return (
    <div className="space-y-4">
      {/* 헤더 */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900">계정 관리</h2>
        <p className="text-sm text-gray-500 mt-0.5">등록된 사용자 및 관리자 계정을 조회하고 관리합니다.</p>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={[
              'px-4 py-1.5 text-sm font-medium rounded-md transition',
              tab === key
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {label}
          </button>
        ))}
      </div>

      {/* 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600 w-12">No.</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">이름</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">이메일</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-24">역할</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-32 whitespace-nowrap">가입일</th>
              <th className="px-4 py-3 text-center font-medium text-gray-600 w-20">상세</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">불러오는 중...</td>
              </tr>
            )}
            {!loading && users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-gray-400">계정이 없습니다.</td>
              </tr>
            )}
            {!loading && users.map((u, idx) => (
              <tr
                key={u.id}
                onClick={() => router.push(`/admin/users/${u.id}`)}
                className="hover:bg-gray-50 cursor-pointer"
              >
                <td className="px-4 py-3 text-gray-400">{idx + 1}</td>
                <td className="px-4 py-3 font-medium text-gray-800">{u.name}</td>
                <td className="px-4 py-3 text-gray-600">{u.email}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLOR[u.role] ?? 'bg-gray-100 text-gray-600'}`}>
                    {ROLE_LABEL[u.role] ?? u.role}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-gray-500 whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={(e) => { e.stopPropagation(); router.push(`/admin/users/${u.id}`); }}
                    className="px-2.5 py-1 text-xs bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition"
                  >
                    상세
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
