'use client';

import { useState, useEffect } from 'react';
import { domainService } from '@/services/domainService';
import type { DomainMaster, DomainSlave } from '@/types';

export default function AdminDomainsPage() {
  const [masters, setMasters] = useState<DomainMaster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  // 마스터 추가 폼
  const [newMasterName,    setNewMasterName]    = useState('');
  const [addingMaster,     setAddingMaster]     = useState(false);

  // 마스터 수정 인라인
  const [editingMasterId,  setEditingMasterId]  = useState<number | null>(null);
  const [editingMasterVal, setEditingMasterVal] = useState('');

  // 슬레이브 추가 폼 (마스터별)
  const [newSlaveInputs, setNewSlaveInputs] = useState<Record<number, string>>({});
  const [addingSlave,    setAddingSlave]    = useState<number | null>(null);

  // 슬레이브 수정 인라인
  const [editingSlaveId,  setEditingSlaveId]  = useState<number | null>(null);
  const [editingSlaveVal, setEditingSlaveVal] = useState('');

  // ── 로드 ─────────────────────────────────────────────────────────────────────

  const loadDomains = () => {
    setLoading(true);
    domainService.getDomains()
      .then((res) => setMasters(res.data.data ?? []))
      .catch(() => setError('도메인 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadDomains(); }, []);

  // ── 마스터 CRUD ───────────────────────────────────────────────────────────────

  const handleAddMaster = async () => {
    if (!newMasterName.trim()) return;
    setAddingMaster(true);
    try {
      await domainService.createMaster(newMasterName.trim());
      setNewMasterName('');
      loadDomains();
    } catch {
      setError('마스터 추가에 실패했습니다.');
    } finally {
      setAddingMaster(false);
    }
  };

  const handleUpdateMaster = async (masterId: number) => {
    if (!editingMasterVal.trim()) return;
    try {
      await domainService.updateMaster(masterId, editingMasterVal.trim());
      setEditingMasterId(null);
      loadDomains();
    } catch {
      setError('마스터 수정에 실패했습니다.');
    }
  };

  const handleDeleteMaster = async (masterId: number, masterName: string) => {
    if (!confirm(`"${masterName}" 마스터와 모든 하위 항목을 삭제하시겠습니까?`)) return;
    try {
      await domainService.deleteMaster(masterId);
      loadDomains();
    } catch {
      setError('마스터 삭제에 실패했습니다.');
    }
  };

  // ── 슬레이브 CRUD ─────────────────────────────────────────────────────────────

  const handleAddSlave = async (masterId: number, slaves: DomainSlave[]) => {
    const name = (newSlaveInputs[masterId] ?? '').trim();
    if (!name) return;
    setAddingSlave(masterId);
    try {
      const nextOrder = slaves.length > 0
        ? Math.max(...slaves.map((s) => s.displayOrder ?? 0)) + 1
        : 1;
      await domainService.createSlave(masterId, name, nextOrder);
      setNewSlaveInputs((prev) => ({ ...prev, [masterId]: '' }));
      loadDomains();
    } catch {
      setError('슬레이브 추가에 실패했습니다.');
    } finally {
      setAddingSlave(null);
    }
  };

  const handleUpdateSlave = async (masterId: number, slave: DomainSlave) => {
    if (!editingSlaveVal.trim()) return;
    try {
      await domainService.updateSlave(masterId, slave.id, editingSlaveVal.trim(), slave.displayOrder ?? 0);
      setEditingSlaveId(null);
      loadDomains();
    } catch {
      setError('슬레이브 수정에 실패했습니다.');
    }
  };

  const handleDeleteSlave = async (masterId: number, slaveId: number, slaveName: string) => {
    if (!confirm(`"${slaveName}" 항목을 삭제하시겠습니까?`)) return;
    try {
      await domainService.deleteSlave(masterId, slaveId);
      loadDomains();
    } catch {
      setError('슬레이브 삭제에 실패했습니다.');
    }
  };

  // ── 렌더 ─────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">도메인 관리</h2>
        <p className="text-sm text-gray-500 mt-1">
          도메인 마스터와 슬레이브 코드 값을 관리합니다.
          (예: 문제 유형, 시험 유형)
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>
      )}

      {/* ── 마스터 추가 ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <p className="text-sm font-semibold text-gray-700 mb-3">새 마스터 추가</p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newMasterName}
            onChange={(e) => setNewMasterName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddMaster()}
            placeholder="마스터 이름 (예: 자격증 유형)"
            maxLength={100}
            className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          />
          <button
            type="button"
            onClick={handleAddMaster}
            disabled={addingMaster || !newMasterName.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {addingMaster ? '추가 중...' : '추가'}
          </button>
        </div>
      </div>

      {/* ── 마스터 목록 ── */}
      {masters.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
          등록된 도메인이 없습니다.
        </div>
      ) : (
        masters.map((master) => (
          <div key={master.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* 마스터 헤더 */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 bg-gray-50/50">
              {editingMasterId === master.id ? (
                <>
                  <input
                    type="text"
                    value={editingMasterVal}
                    onChange={(e) => setEditingMasterVal(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleUpdateMaster(master.id);
                      if (e.key === 'Escape') setEditingMasterId(null);
                    }}
                    autoFocus
                    maxLength={100}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-indigo-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => handleUpdateMaster(master.id)}
                    className="text-xs text-indigo-600 font-medium hover:underline"
                  >저장</button>
                  <button
                    type="button"
                    onClick={() => setEditingMasterId(null)}
                    className="text-xs text-gray-400 hover:text-gray-600"
                  >취소</button>
                </>
              ) : (
                <>
                  <p className="flex-1 text-sm font-semibold text-gray-800">{master.name}</p>
                  <span className="text-xs text-gray-400">{master.slaves.length}개</span>
                  <button
                    type="button"
                    onClick={() => { setEditingMasterId(master.id); setEditingMasterVal(master.name); }}
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

            {/* 슬레이브 목록 */}
            <ul className="divide-y divide-gray-50">
              {master.slaves.map((slave) => (
                <li key={slave.id} className="flex items-center gap-3 px-5 py-3">
                  {editingSlaveId === slave.id ? (
                    <>
                      <input
                        type="text"
                        value={editingSlaveVal}
                        onChange={(e) => setEditingSlaveVal(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateSlave(master.id, slave);
                          if (e.key === 'Escape') setEditingSlaveId(null);
                        }}
                        autoFocus
                        maxLength={100}
                        className="flex-1 px-3 py-1 rounded-lg border border-indigo-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                      />
                      <button type="button" onClick={() => handleUpdateSlave(master.id, slave)}
                        className="text-xs text-indigo-600 font-medium hover:underline">저장</button>
                      <button type="button" onClick={() => setEditingSlaveId(null)}
                        className="text-xs text-gray-400 hover:text-gray-600">취소</button>
                    </>
                  ) : (
                    <>
                      <span className="w-6 text-xs text-gray-300 font-mono shrink-0">{slave.displayOrder}</span>
                      <span className="flex-1 text-sm text-gray-700">{slave.name}</span>
                      <button
                        type="button"
                        onClick={() => { setEditingSlaveId(slave.id); setEditingSlaveVal(slave.name); }}
                        className="text-xs text-gray-400 hover:text-indigo-600 transition"
                      >수정</button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSlave(master.id, slave.id, slave.name)}
                        className="text-xs text-gray-400 hover:text-red-500 transition"
                      >삭제</button>
                    </>
                  )}
                </li>
              ))}
            </ul>

            {/* 슬레이브 추가 */}
            <div className="px-5 py-3 border-t border-gray-50 flex gap-2">
              <input
                type="text"
                value={newSlaveInputs[master.id] ?? ''}
                onChange={(e) => setNewSlaveInputs((prev) => ({ ...prev, [master.id]: e.target.value }))}
                onKeyDown={(e) => e.key === 'Enter' && handleAddSlave(master.id, master.slaves)}
                placeholder="새 값 추가..."
                maxLength={100}
                className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
              />
              <button
                type="button"
                onClick={() => handleAddSlave(master.id, master.slaves)}
                disabled={addingSlave === master.id || !(newSlaveInputs[master.id] ?? '').trim()}
                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-indigo-50 hover:text-indigo-700 disabled:opacity-50 transition"
              >
                {addingSlave === master.id ? '추가 중...' : '+ 추가'}
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
