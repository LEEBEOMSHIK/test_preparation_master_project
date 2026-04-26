'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { adminUserService, type AdminUser } from '@/services/adminUserService';
import { permissionService } from '@/services/permissionService';
import type { PermissionDetail } from '@/types';

const ROLE_LABEL: Record<string, string> = { USER: '사용자', ADMIN: '관리자' };
const ROLE_COLOR: Record<string, string> = {
  USER: 'bg-emerald-100 text-emerald-700',
  ADMIN: 'bg-indigo-100 text-indigo-700',
};

export default function AdminUserDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = Number(params.id);

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  // 정보 수정
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState<'USER' | 'ADMIN'>('USER');
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');

  // 비밀번호 재설정
  const [newPassword, setNewPassword] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMsg, setResetMsg] = useState('');

  // 세부 권한 할당
  const [availableDetails, setAvailableDetails] = useState<PermissionDetail[]>([]);
  const [assignedIds, setAssignedIds] = useState<Set<number>>(new Set());
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [savingPerms, setSavingPerms] = useState(false);
  const [permMsg, setPermMsg] = useState('');

  const [deleting, setDeleting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [userRes, permRes, assignedRes] = await Promise.all([
        adminUserService.getOne(id),
        permissionService.getAll(),
        adminUserService.getUserPermissions(id),
      ]);

      if (userRes.data.success && userRes.data.data) {
        const u = userRes.data.data;
        setUser(u);
        setEditName(u.name);
        setEditRole(u.role);

        // 해당 역할과 같은 코드를 가진 마스터의 세부 권한만 표시
        const masters = permRes.data.data ?? [];
        const matchingMaster = masters.find((m) => m.code === u.role);
        setAvailableDetails(matchingMaster?.details ?? []);
      }

      const ids = new Set(assignedRes.data.data ?? []);
      setAssignedIds(ids);
      setPendingIds(new Set(ids));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  // 역할 변경 시 사용 가능한 세부 권한 목록 갱신
  const handleRoleChange = async (newRole: 'USER' | 'ADMIN') => {
    setEditRole(newRole);
    const permRes = await permissionService.getAll();
    const masters = permRes.data.data ?? [];
    const matchingMaster = masters.find((m) => m.code === newRole);
    setAvailableDetails(matchingMaster?.details ?? []);
    setPendingIds(new Set()); // 역할 변경 시 선택 초기화
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await adminUserService.update(id, { name: editName, role: editRole });
      if (res.data.success && res.data.data) {
        setUser(res.data.data);
        setSaveMsg('저장되었습니다.');
        setTimeout(() => setSaveMsg(''), 3000);
      }
    } finally {
      setSaving(false);
    }
  };

  const togglePerm = (detailId: number) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (next.has(detailId)) next.delete(detailId); else next.add(detailId);
      return next;
    });
  };

  const hasPermChanges = () => {
    if (pendingIds.size !== assignedIds.size) return true;
    for (const id of pendingIds) if (!assignedIds.has(id)) return true;
    return false;
  };

  const handleSavePerms = async () => {
    setSavingPerms(true);
    setPermMsg('');
    try {
      await adminUserService.updateUserPermissions(id, Array.from(pendingIds));
      setAssignedIds(new Set(pendingIds));
      setPermMsg('세부 권한이 저장되었습니다.');
      setTimeout(() => setPermMsg(''), 3000);
    } finally {
      setSavingPerms(false);
    }
  };

  const handleResetPassword = async () => {
    if (newPassword.length < 8) { setResetMsg('비밀번호는 8자 이상이어야 합니다.'); return; }
    if (!confirm('비밀번호를 재설정하시겠습니까?')) return;
    setResetting(true);
    setResetMsg('');
    try {
      await adminUserService.resetPassword(id, { newPassword });
      setNewPassword('');
      setResetMsg('비밀번호가 재설정되었습니다.');
      setTimeout(() => setResetMsg(''), 3000);
    } finally {
      setResetting(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`"${user?.name}" 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) return;
    setDeleting(true);
    try {
      await adminUserService.delete(id);
      router.replace('/admin/users');
    } finally {
      setDeleting(false);
    }
  };

  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleString('ko-KR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });

  if (loading) {
    return <div className="py-20 text-center text-gray-400 text-sm">불러오는 중...</div>;
  }

  if (!user) {
    return (
      <div className="py-20 text-center space-y-3">
        <p className="text-gray-500">계정을 찾을 수 없습니다.</p>
        <Link href="/admin/users" className="text-indigo-600 text-sm hover:underline">목록으로 돌아가기</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/admin/users" className="hover:text-indigo-600 transition">계정 관리</Link>
        <span>/</span>
        <span className="text-gray-800 font-medium">{user.name}</span>
      </div>

      {/* 계정 정보 카드 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xl font-bold shrink-0">
            {user.name.slice(0, 1).toUpperCase()}
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
          <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-semibold ${ROLE_COLOR[user.role]}`}>
            {ROLE_LABEL[user.role] ?? user.role}
          </span>
        </div>
        <div className="pt-2 border-t border-gray-100 text-xs text-gray-400">
          가입일: {fmtDate(user.createdAt)}
        </div>
      </div>

      {/* 정보 수정 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-800">정보 수정</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">이름</label>
            <input
              value={editName}
              onChange={e => setEditName(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">최상위 역할</label>
            <select
              value={editRole}
              onChange={e => handleRoleChange(e.target.value as 'USER' | 'ADMIN')}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
            >
              <option value="USER">사용자 (USER)</option>
              <option value="ADMIN">관리자 (ADMIN)</option>
            </select>
            <p className="text-xs text-gray-400 mt-1">최상위 역할은 API 접근 제어에 사용됩니다.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving || !editName.trim()}
            className="px-4 py-2 text-sm text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
          {saveMsg && <span className="text-sm text-emerald-600">{saveMsg}</span>}
        </div>
      </div>

      {/* 세부 권한 할당 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-800">세부 권한</h3>
            <p className="text-xs text-gray-400 mt-0.5">
              {ROLE_LABEL[editRole]} 역할의 세부 권한을 선택합니다. 권한 코드가 JWT에 포함되어 API 인가에 사용됩니다.
            </p>
          </div>
          {hasPermChanges() && (
            <button
              onClick={handleSavePerms}
              disabled={savingPerms}
              className="px-3 py-1.5 text-xs text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition font-medium"
            >
              {savingPerms ? '저장 중...' : '변경 사항 저장'}
            </button>
          )}
        </div>

        {permMsg && <p className="text-sm text-emerald-600">{permMsg}</p>}

        {availableDetails.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-200 p-6 text-center">
            <p className="text-sm text-gray-400">
              {ROLE_LABEL[editRole]} 역할에 등록된 세부 권한이 없습니다.
            </p>
            <Link href="/admin/permissions" className="text-xs text-indigo-500 hover:underline mt-1 inline-block">
              권한 관리에서 세부 권한을 추가하세요
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {availableDetails.map((detail) => {
              const checked = pendingIds.has(detail.id);
              return (
                <label
                  key={detail.id}
                  className={`flex items-start gap-3 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${
                    checked
                      ? 'border-indigo-200 bg-indigo-50'
                      : 'border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => togglePerm(detail.id)}
                    className="mt-0.5 w-4 h-4 accent-indigo-600 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-800">{detail.name}</span>
                      {detail.code && (
                        <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-600">
                          {detail.code}
                        </span>
                      )}
                    </div>
                    {detail.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{detail.description}</p>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}
      </div>

      {/* 비밀번호 재설정 */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
        <h3 className="text-base font-semibold text-gray-800">비밀번호 재설정</h3>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">새 비밀번호 (8자 이상)</label>
          <input
            type="password"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            placeholder="새 비밀번호를 입력하세요"
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleResetPassword}
            disabled={resetting || newPassword.length < 8}
            className="px-4 py-2 text-sm text-white bg-amber-500 rounded-lg hover:bg-amber-600 disabled:opacity-50 transition"
          >
            {resetting ? '처리 중...' : '비밀번호 재설정'}
          </button>
          {resetMsg && (
            <span className={`text-sm ${resetMsg.includes('8자') ? 'text-red-500' : 'text-emerald-600'}`}>
              {resetMsg}
            </span>
          )}
        </div>
      </div>

      {/* 계정 삭제 */}
      <div className="bg-white rounded-xl border border-red-200 p-6 space-y-3">
        <h3 className="text-base font-semibold text-red-700">계정 삭제</h3>
        <p className="text-sm text-gray-500">계정을 삭제하면 복구할 수 없습니다.</p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-4 py-2 text-sm text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
        >
          {deleting ? '삭제 중...' : '계정 삭제'}
        </button>
      </div>
    </div>
  );
}
