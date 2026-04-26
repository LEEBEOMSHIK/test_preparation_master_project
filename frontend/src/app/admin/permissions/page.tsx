'use client';

import { useState, useEffect } from 'react';
import { permissionService } from '@/services/permissionService';
import type { PermissionMaster } from '@/types';

export default function AdminPermissionsPage() {
  const [masters, setMasters] = useState<PermissionMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 마스터 추가
  const [showAddMaster, setShowAddMaster] = useState(false);
  const [newMasterCode, setNewMasterCode] = useState('');
  const [newMasterName, setNewMasterName] = useState('');
  const [newMasterDesc, setNewMasterDesc] = useState('');
  const [addingMaster, setAddingMaster] = useState(false);

  // 마스터 수정
  const [editingMasterId, setEditingMasterId] = useState<number | null>(null);
  const [editingMasterName, setEditingMasterName] = useState('');
  const [editingMasterDesc, setEditingMasterDesc] = useState('');

  // 세부 권한 추가 (마스터별)
  const [newDetailInputs, setNewDetailInputs] = useState<Record<number, { name: string; desc: string }>>({});
  const [addingDetail, setAddingDetail] = useState<number | null>(null);

  // 세부 권한 수정
  const [editingDetailId, setEditingDetailId] = useState<number | null>(null);
  const [editingDetailName, setEditingDetailName] = useState('');
  const [editingDetailDesc, setEditingDetailDesc] = useState('');

  const load = () => {
    setLoading(true);
    permissionService.getAll()
      .then((res) => setMasters(res.data.data ?? []))
      .catch(() => setError('권한 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  // ── 마스터 CRUD ───────────────────────────────────────────────────────────────

  const handleAddMaster = async () => {
    if (!newMasterCode.trim() || !newMasterName.trim()) return;
    setAddingMaster(true);
    try {
      await permissionService.createMaster({
        code: newMasterCode.trim().toUpperCase(),
        name: newMasterName.trim(),
        description: newMasterDesc.trim() || undefined,
      });
      setNewMasterCode(''); setNewMasterName(''); setNewMasterDesc('');
      setShowAddMaster(false);
      load();
    } catch {
      setError('권한 마스터 추가에 실패했습니다.');
    } finally {
      setAddingMaster(false);
    }
  };

  const handleUpdateMaster = async (id: number) => {
    if (!editingMasterName.trim()) return;
    try {
      await permissionService.updateMaster(id, {
        code: masters.find(m => m.id === id)?.code ?? '',
        name: editingMasterName.trim(),
        description: editingMasterDesc.trim() || undefined,
      });
      setEditingMasterId(null);
      load();
    } catch {
      setError('권한 마스터 수정에 실패했습니다.');
    }
  };

  const handleDeleteMaster = async (id: number, name: string) => {
    if (!confirm(`"${name}" 권한 마스터와 모든 세부 권한을 삭제하시겠습니까?`)) return;
    try {
      await permissionService.deleteMaster(id);
      load();
    } catch {
      setError('권한 마스터 삭제에 실패했습니다.');
    }
  };

  // ── 세부 권한 CRUD ─────────────────────────────────────────────────────────────

  const handleAddDetail = async (masterId: number) => {
    const input = newDetailInputs[masterId] ?? { name: '', desc: '' };
    if (!input.name.trim()) return;
    setAddingDetail(masterId);
    try {
      await permissionService.createDetail({
        masterId,
        name: input.name.trim(),
        description: input.desc.trim() || undefined,
      });
      setNewDetailInputs((prev) => ({ ...prev, [masterId]: { name: '', desc: '' } }));
      load();
    } catch {
      setError('세부 권한 추가에 실패했습니다.');
    } finally {
      setAddingDetail(null);
    }
  };

  const handleUpdateDetail = async (id: number, masterId: number) => {
    if (!editingDetailName.trim()) return;
    try {
      await permissionService.updateDetail(id, {
        masterId,
        name: editingDetailName.trim(),
        description: editingDetailDesc.trim() || undefined,
      });
      setEditingDetailId(null);
      load();
    } catch {
      setError('세부 권한 수정에 실패했습니다.');
    }
  };

  const handleDeleteDetail = async (id: number, name: string) => {
    if (!confirm(`"${name}" 세부 권한을 삭제하시겠습니까?`)) return;
    try {
      await permissionService.deleteDetail(id);
      load();
    } catch {
      setError('세부 권한 삭제에 실패했습니다.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">권한 관리</h2>
          <p className="text-sm text-gray-500 mt-1">
            권한 마스터(USER, ADMIN)와 세부 권한을 관리합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAddMaster((v) => !v)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          권한 추가
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>
      )}

      {/* ── 마스터 추가 폼 ── */}
      {showAddMaster && (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-700">새 권한 마스터 추가</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">권한 코드 (예: MANAGER)</label>
              <input
                type="text"
                value={newMasterCode}
                onChange={(e) => setNewMasterCode(e.target.value)}
                placeholder="MANAGER"
                maxLength={50}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">권한 이름</label>
              <input
                type="text"
                value={newMasterName}
                onChange={(e) => setNewMasterName(e.target.value)}
                placeholder="매니저"
                maxLength={100}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">설명 (선택)</label>
            <input
              type="text"
              value={newMasterDesc}
              onChange={(e) => setNewMasterDesc(e.target.value)}
              placeholder="권한 설명"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowAddMaster(false)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition"
            >취소</button>
            <button
              type="button"
              onClick={handleAddMaster}
              disabled={addingMaster || !newMasterCode.trim() || !newMasterName.trim()}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
            >{addingMaster ? '추가 중...' : '추가'}</button>
          </div>
        </div>
      )}

      {/* ── 마스터 목록 ── */}
      {masters.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
          등록된 권한이 없습니다.
        </div>
      ) : (
        masters.map((master) => (
          <div key={master.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* 마스터 헤더 */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              {editingMasterId === master.id ? (
                <>
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={editingMasterName}
                      onChange={(e) => setEditingMasterName(e.target.value)}
                      autoFocus
                      maxLength={100}
                      className="px-3 py-1.5 rounded-lg border border-indigo-300 text-sm focus:outline-none"
                      placeholder="권한 이름"
                    />
                    <input
                      type="text"
                      value={editingMasterDesc}
                      onChange={(e) => setEditingMasterDesc(e.target.value)}
                      maxLength={200}
                      className="px-3 py-1.5 rounded-lg border border-indigo-300 text-sm focus:outline-none"
                      placeholder="설명 (선택)"
                    />
                  </div>
                  <button type="button" onClick={() => handleUpdateMaster(master.id)}
                    className="text-xs text-indigo-600 font-medium hover:underline">저장</button>
                  <button type="button" onClick={() => setEditingMasterId(null)}
                    className="text-xs text-gray-400 hover:text-gray-600">취소</button>
                </>
              ) : (
                <>
                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded text-xs font-mono font-bold shrink-0">
                    {master.code}
                  </span>
                  <p className="flex-1 text-sm font-semibold text-gray-800">{master.name}</p>
                  {master.description && (
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{master.description}</p>
                  )}
                  <span className="text-xs text-gray-400">{master.details.length}개</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingMasterId(master.id);
                      setEditingMasterName(master.name);
                      setEditingMasterDesc(master.description ?? '');
                    }}
                    className="text-xs text-gray-400 hover:text-indigo-600 transition"
                  >수정</button>
                  <button
                    type="button"
                    onClick={() => handleDeleteMaster(master.id, master.name)}
                    className="text-xs text-gray-400 hover:text-red-500 transition"
                  >삭제</button>
                </>
              )}
            </div>

            {/* 세부 권한 목록 */}
            <ul className="divide-y divide-gray-50">
              {master.details.map((detail) => (
                <li key={detail.id} className="flex items-center gap-3 px-5 py-3">
                  {editingDetailId === detail.id ? (
                    <>
                      <input
                        type="text"
                        value={editingDetailName}
                        onChange={(e) => setEditingDetailName(e.target.value)}
                        autoFocus
                        maxLength={100}
                        className="flex-1 px-3 py-1 rounded-lg border border-indigo-300 text-sm focus:outline-none"
                        placeholder="세부 권한 이름"
                      />
                      <input
                        type="text"
                        value={editingDetailDesc}
                        onChange={(e) => setEditingDetailDesc(e.target.value)}
                        maxLength={200}
                        className="flex-1 px-3 py-1 rounded-lg border border-indigo-300 text-sm focus:outline-none"
                        placeholder="설명 (선택)"
                      />
                      <button type="button" onClick={() => handleUpdateDetail(detail.id, master.id)}
                        className="text-xs text-indigo-600 font-medium hover:underline">저장</button>
                      <button type="button" onClick={() => setEditingDetailId(null)}
                        className="text-xs text-gray-400 hover:text-gray-600">취소</button>
                    </>
                  ) : (
                    <>
                      <span className="flex-1 text-sm text-gray-700">{detail.name}</span>
                      {detail.description && (
                        <span className="text-xs text-gray-400 truncate max-w-[160px]">{detail.description}</span>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDetailId(detail.id);
                          setEditingDetailName(detail.name);
                          setEditingDetailDesc(detail.description ?? '');
                        }}
                        className="text-xs text-gray-400 hover:text-indigo-600 transition"
                      >수정</button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDetail(detail.id, detail.name)}
                        className="text-xs text-gray-400 hover:text-red-500 transition"
                      >삭제</button>
                    </>
                  )}
                </li>
              ))}
            </ul>

            {/* 세부 권한 추가 */}
            <div className="px-5 py-3 border-t border-gray-50 flex gap-2">
              <input
                type="text"
                value={newDetailInputs[master.id]?.name ?? ''}
                onChange={(e) => setNewDetailInputs((prev) => ({
                  ...prev,
                  [master.id]: { ...prev[master.id], name: e.target.value },
                }))}
                onKeyDown={(e) => e.key === 'Enter' && handleAddDetail(master.id)}
                placeholder="세부 권한 이름..."
                maxLength={100}
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              />
              <input
                type="text"
                value={newDetailInputs[master.id]?.desc ?? ''}
                onChange={(e) => setNewDetailInputs((prev) => ({
                  ...prev,
                  [master.id]: { ...prev[master.id], desc: e.target.value },
                }))}
                placeholder="설명 (선택)"
                maxLength={200}
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              />
              <button
                type="button"
                onClick={() => handleAddDetail(master.id)}
                disabled={addingDetail === master.id || !(newDetailInputs[master.id]?.name ?? '').trim()}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50 transition"
              >
                {addingDetail === master.id ? '추가 중...' : '+ 추가'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
