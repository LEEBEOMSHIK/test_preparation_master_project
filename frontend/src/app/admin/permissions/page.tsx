'use client';

import { useState, useEffect, useCallback } from 'react';
import { permissionService } from '@/services/permissionService';
import { menuService } from '@/services/menuService';
import { TableSkeleton } from '@/components/ui/Skeleton';
import type { PermissionMaster, PermissionScope, MenuConfig } from '@/types';

type Tab = 'USER' | 'ADMIN';

function buildMenuHierarchy(menus: MenuConfig[]) {
  const parents = menus.filter(m => !m.parentId).sort((a, b) => a.displayOrder - b.displayOrder);
  const result: Array<{ menu: MenuConfig; isChild: boolean }> = [];
  for (const parent of parents) {
    result.push({ menu: parent, isChild: false });
    menus
      .filter(m => m.parentId === parent.id)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .forEach(child => result.push({ menu: child, isChild: true }));
  }
  return result;
}

function setsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

export default function AdminPermissionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('USER');
  const [masters, setMasters] = useState<PermissionMaster[]>([]);
  const [allMenus, setAllMenus] = useState<{ USER: MenuConfig[]; ADMIN: MenuConfig[] }>({
    USER: [],
    ADMIN: [],
  });
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
  const [newDetailInputs, setNewDetailInputs] = useState<Record<number, { name: string; desc: string; code: string }>>({});
  const [addingDetail, setAddingDetail] = useState<number | null>(null);

  // 세부 권한 수정
  const [editingDetailId, setEditingDetailId] = useState<number | null>(null);
  const [editingDetailName, setEditingDetailName] = useState('');
  const [editingDetailDesc, setEditingDetailDesc] = useState('');
  const [editingDetailCode, setEditingDetailCode] = useState('');

  // 세부 권한별 메뉴 접근 상태: detailId → Set<menuId>
  const [pendingDetailMenus, setPendingDetailMenus] = useState<Record<number, Set<number>>>({});
  const [expandedMenuDetail, setExpandedMenuDetail] = useState<number | null>(null);
  const [savingDetailMenuFor, setSavingDetailMenuFor] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([
      permissionService.getAll(),
      menuService.adminGetFlat('USER'),
      menuService.adminGetFlat('ADMIN'),
    ])
      .then(([permRes, userMenuRes, adminMenuRes]) => {
        const loadedMasters = permRes.data.data ?? [];
        setMasters(loadedMasters);
        setAllMenus({
          USER: userMenuRes.data.data ?? [],
          ADMIN: adminMenuRes.data.data ?? [],
        });
        // 세부 권한별 메뉴 pending 상태 초기화
        const detailMenuInit: Record<number, Set<number>> = {};
        for (const m of loadedMasters) {
          for (const d of m.details) {
            detailMenuInit[d.id] = new Set(d.allowedMenuIds);
          }
        }
        setPendingDetailMenus(detailMenuInit);
      })
      .catch(() => setError('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredMasters = masters.filter((m) => m.scope === activeTab);

  // ── 마스터 CRUD ───────────────────────────────────────────────────────────────

  const handleAddMaster = async () => {
    if (!newMasterCode.trim() || !newMasterName.trim()) return;
    setAddingMaster(true);
    try {
      await permissionService.createMaster({
        code: newMasterCode.trim().toUpperCase(),
        name: newMasterName.trim(),
        description: newMasterDesc.trim() || undefined,
        scope: activeTab,
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
    const master = masters.find((m) => m.id === id);
    if (!master) return;
    try {
      await permissionService.updateMaster(id, {
        code: master.code,
        name: editingMasterName.trim(),
        description: editingMasterDesc.trim() || undefined,
        scope: master.scope,
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

  // ── 세부 권한별 메뉴 접근 관리 ────────────────────────────────────────────────

  const toggleDetailMenu = (detailId: number, menuId: number) => {
    setPendingDetailMenus(prev => {
      const set = new Set(prev[detailId] ?? []);
      if (set.has(menuId)) set.delete(menuId); else set.add(menuId);
      return { ...prev, [detailId]: set };
    });
  };

  const handleSaveDetailMenus = async (detailId: number, savedIds: number[]) => {
    setSavingDetailMenuFor(detailId);
    try {
      const ids = Array.from(pendingDetailMenus[detailId] ?? []);
      await permissionService.updateDetailMenuAccess(detailId, ids);
      load();
    } catch {
      setError('메뉴 접근 권한 저장에 실패했습니다.');
    } finally {
      setSavingDetailMenuFor(null);
    }
  };

  const hasDetailMenuChanges = (detailId: number, savedIds: number[]) => {
    const pending = pendingDetailMenus[detailId];
    if (!pending) return false;
    return !setsEqual(pending, new Set(savedIds));
  };

  // ── 세부 권한 CRUD ─────────────────────────────────────────────────────────────

  const setDetailInput = (masterId: number, field: 'name' | 'desc' | 'code', value: string) => {
    setNewDetailInputs(prev => {
      const current = prev[masterId] ?? { name: '', desc: '', code: '' };
      return { ...prev, [masterId]: { ...current, [field]: value } };
    });
  };

  const handleAddDetail = async (masterId: number) => {
    const input = newDetailInputs[masterId] ?? { name: '', desc: '', code: '' };
    if (!input.name.trim()) return;
    setAddingDetail(masterId);
    try {
      await permissionService.createDetail({
        masterId,
        name: input.name.trim(),
        description: input.desc.trim() || undefined,
        code: input.code.trim().toUpperCase() || undefined,
      });
      setNewDetailInputs(prev => ({ ...prev, [masterId]: { name: '', desc: '', code: '' } }));
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
        code: editingDetailCode.trim().toUpperCase() || undefined,
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
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <TableSkeleton rows={4} cols={4} />
        </div>
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <TableSkeleton rows={6} cols={3} />
        </div>
      </div>
    );
  }

  const currentMenus = allMenus[activeTab];
  const menuHierarchy = buildMenuHierarchy(currentMenus);

  return (
    <div className="max-w-2xl space-y-6">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">권한 관리</h2>
          <p className="text-sm text-gray-500 mt-1">
            사용자/관리자 권한과 접근 가능 메뉴를 관리합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setShowAddMaster((v) => !v); }}
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

      {/* ── 탭 ── */}
      <div className="flex border-b border-gray-200">
        {(['USER', 'ADMIN'] as Tab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => { setActiveTab(tab); setShowAddMaster(false); }}
            className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab === 'USER' ? '사용자 권한' : '관리자 권한'}
            <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${
              activeTab === tab ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-500'
            }`}>
              {masters.filter((m) => m.scope === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* ── 마스터 추가 폼 ── */}
      {showAddMaster && (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-700">
            새 {activeTab === 'USER' ? '사용자' : '관리자'} 권한 마스터 추가
          </p>
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
      {filteredMasters.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
          등록된 {activeTab === 'USER' ? '사용자' : '관리자'} 권한이 없습니다.
        </div>
      ) : (
        filteredMasters.map((master) => (
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
                  <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold shrink-0 ${
                    master.scope === 'USER'
                      ? 'bg-emerald-100 text-emerald-700'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {master.code}
                  </span>
                  <p className="flex-1 text-sm font-semibold text-gray-800">{master.name}</p>
                  {master.description && (
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{master.description}</p>
                  )}
                  <span className="text-xs text-gray-400">계정 {master.userCount}명</span>
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
              {master.details.map((detail) => {
                const isExpanded = expandedMenuDetail === detail.id;
                const detailMenuIds = pendingDetailMenus[detail.id] ?? new Set(detail.allowedMenuIds);
                const detailHasMenuChanges = hasDetailMenuChanges(detail.id, detail.allowedMenuIds);

                return (
                  <li key={detail.id}>
                    {editingDetailId === detail.id ? (
                      <div className="flex items-center gap-2 px-5 py-3">
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
                          value={editingDetailCode}
                          onChange={(e) => setEditingDetailCode(e.target.value.toUpperCase())}
                          maxLength={100}
                          className="w-32 px-3 py-1 rounded-lg border border-indigo-300 text-sm focus:outline-none font-mono"
                          placeholder="권한 코드"
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
                          className="text-xs text-indigo-600 font-medium hover:underline shrink-0">저장</button>
                        <button type="button" onClick={() => setEditingDetailId(null)}
                          className="text-xs text-gray-400 hover:text-gray-600 shrink-0">취소</button>
                      </div>
                    ) : (
                      <>
                        {/* 세부 권한 행 */}
                        <div className="flex items-center gap-3 px-5 py-3">
                          <span className="flex-1 text-sm text-gray-700">{detail.name}</span>
                          {detail.code && (
                            <span className="px-1.5 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-600 shrink-0">
                              {detail.code}
                            </span>
                          )}
                          {detail.description && (
                            <span className="text-xs text-gray-400 truncate max-w-[100px]">{detail.description}</span>
                          )}
                          <button
                            type="button"
                            onClick={() => setExpandedMenuDetail(isExpanded ? null : detail.id)}
                            className={`shrink-0 text-xs px-2 py-1 rounded-md border transition ${
                              isExpanded
                                ? 'border-indigo-300 text-indigo-600 bg-indigo-50'
                                : 'border-gray-200 text-gray-500 hover:border-gray-300'
                            }`}
                          >
                            메뉴 {detailMenuIds.size > 0 ? `(${detailMenuIds.size})` : '설정'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingDetailId(detail.id);
                              setEditingDetailName(detail.name);
                              setEditingDetailCode(detail.code ?? '');
                              setEditingDetailDesc(detail.description ?? '');
                            }}
                            className="text-xs text-gray-400 hover:text-indigo-600 transition shrink-0"
                          >수정</button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDetail(detail.id, detail.name)}
                            className="text-xs text-gray-400 hover:text-red-500 transition shrink-0"
                          >삭제</button>
                        </div>

                        {/* 접근 가능 메뉴 (확장 시) */}
                        {isExpanded && (
                          <div className="px-5 pb-4 pt-2 bg-gray-50/60 border-t border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                접근 가능 메뉴
                              </p>
                              {detailHasMenuChanges && (
                                <button
                                  type="button"
                                  onClick={() => handleSaveDetailMenus(detail.id, detail.allowedMenuIds)}
                                  disabled={savingDetailMenuFor === detail.id}
                                  className="text-xs px-3 py-1 bg-indigo-600 text-white rounded-md font-medium hover:bg-indigo-700 disabled:opacity-50 transition"
                                >
                                  {savingDetailMenuFor === detail.id ? '저장 중...' : '변경 사항 저장'}
                                </button>
                              )}
                            </div>
                            {!detail.code ? (
                              <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
                                권한 코드를 먼저 설정해야 메뉴 접근을 관리할 수 있습니다.
                              </p>
                            ) : currentMenus.length === 0 ? (
                              <p className="text-xs text-gray-400">등록된 메뉴가 없습니다.</p>
                            ) : (
                              <div className="grid grid-cols-2 gap-1.5">
                                {menuHierarchy.map(({ menu, isChild }) => {
                                  const checked = detailMenuIds.has(menu.id);
                                  return (
                                    <label
                                      key={menu.id}
                                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-sm ${
                                        checked
                                          ? 'border-indigo-200 bg-indigo-50 text-indigo-800'
                                          : 'border-gray-100 hover:border-gray-200 text-gray-600'
                                      }`}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        onChange={() => toggleDetailMenu(detail.id, menu.id)}
                                        className="w-3.5 h-3.5 accent-indigo-600 shrink-0"
                                      />
                                      <span className={`truncate ${isChild ? 'pl-3 text-gray-500' : 'font-medium'}`}>
                                        {isChild && <span className="text-gray-400 mr-1">└</span>}
                                        {menu.name}
                                      </span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>

            {/* 세부 권한 추가 */}
            <div className="px-5 py-3 border-t border-gray-100 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDetailInputs[master.id]?.name ?? ''}
                  onChange={(e) => setDetailInput(master.id, 'name', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDetail(master.id)}
                  placeholder="세부 권한 이름 *"
                  maxLength={100}
                  className="flex-1 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                />
                <input
                  type="text"
                  value={newDetailInputs[master.id]?.code ?? ''}
                  onChange={(e) => setDetailInput(master.id, 'code', e.target.value.toUpperCase())}
                  placeholder="권한 코드 (예: EXAM_READ)"
                  maxLength={100}
                  className="w-44 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
                />
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newDetailInputs[master.id]?.desc ?? ''}
                  onChange={(e) => setDetailInput(master.id, 'desc', e.target.value)}
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
          </div>
        ))
      )}
    </div>
  );
}
