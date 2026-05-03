'use client';

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { permissionService } from '@/services/permissionService';
import { menuService } from '@/services/menuService';
import { TableSkeleton } from '@/components/ui/Skeleton';
import type { PermissionMaster, PermissionScope, MenuConfig } from '@/types';

type Tab = 'USER' | 'ADMIN';

function setsEqual(a: Set<number>, b: Set<number>): boolean {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

// ── 트리 체크박스 컴포넌트 ─────────────────────────────────────────────

function IndeterminateCheckbox({
  checked, indeterminate, onChange, onClick,
}: {
  checked: boolean;
  indeterminate: boolean;
  onChange: () => void;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      onClick={onClick}
      className="w-4 h-4 accent-indigo-600 shrink-0 cursor-pointer"
    />
  );
}

function MenuCheckboxTree({
  menus,
  checkedIds,
  onChange,
}: {
  menus: MenuConfig[];
  checkedIds: Set<number>;
  onChange: (next: Set<number>) => void;
}) {
  const parents = useMemo(
    () => menus.filter(m => !m.parentId).sort((a, b) => a.displayOrder - b.displayOrder),
    [menus],
  );
  const childrenMap = useMemo(() => {
    const map = new Map<number, MenuConfig[]>();
    menus.filter(m => m.parentId != null).forEach(m => {
      const list = map.get(m.parentId!) ?? [];
      list.push(m);
      map.set(m.parentId!, list);
    });
    return map;
  }, [menus]);

  const toggleParent = (parentId: number, kids: MenuConfig[]) => {
    const next = new Set(checkedIds);
    const checkedKids = kids.filter(c => next.has(c.id)).length;
    const allOn = kids.length === 0 ? next.has(parentId) : (next.has(parentId) || checkedKids === kids.length);
    if (allOn) {
      next.delete(parentId);
      kids.forEach(c => next.delete(c.id));
    } else {
      next.add(parentId);
      kids.forEach(c => next.add(c.id));
    }
    onChange(next);
  };

  const toggleChild = (childId: number, parentId: number, siblings: MenuConfig[]) => {
    const next = new Set(checkedIds);
    if (next.has(childId)) {
      next.delete(childId);
      next.delete(parentId);
    } else {
      next.add(childId);
      if (siblings.every(s => s.id === childId || next.has(s.id))) next.add(parentId);
    }
    onChange(next);
  };

  if (parents.length === 0) {
    return <p className="px-4 py-3 text-xs text-gray-400">등록된 메뉴가 없습니다.</p>;
  }

  return (
    <div className="p-3 space-y-1.5">
      {parents.map(parent => {
        const kids = (childrenMap.get(parent.id) ?? []).sort((a, b) => a.displayOrder - b.displayOrder);
        const parentChecked   = checkedIds.has(parent.id);
        const checkedKidCount = kids.filter(c => checkedIds.has(c.id)).length;
        const allKidsChecked  = kids.length > 0 && checkedKidCount === kids.length;
        const someKidsChecked = checkedKidCount > 0 && !allKidsChecked;
        const effectiveChecked   = kids.length === 0 ? parentChecked : allKidsChecked;
        const isIndeterminate    = someKidsChecked || (kids.length > 0 && parentChecked && !allKidsChecked);
        const isHighlighted      = effectiveChecked || isIndeterminate;

        return (
          <div key={parent.id} className="rounded-lg border border-gray-200 overflow-hidden">
            {/* 상위 메뉴 행 */}
            <div
              className={`flex items-center gap-2.5 px-3 py-2.5 cursor-pointer select-none transition-colors ${isHighlighted ? 'bg-indigo-50' : 'bg-gray-50 hover:bg-gray-100'}`}
              onClick={() => toggleParent(parent.id, kids)}
            >
              <IndeterminateCheckbox
                checked={effectiveChecked}
                indeterminate={isIndeterminate}
                onChange={() => toggleParent(parent.id, kids)}
                onClick={(e) => e.stopPropagation()}
              />
              <span className={`flex-1 text-sm font-semibold ${isHighlighted ? 'text-indigo-800' : 'text-gray-700'}`}>
                {parent.name}
              </span>
              {kids.length > 0 && (
                <span className={`text-xs font-medium tabular-nums ${checkedKidCount > 0 ? 'text-indigo-400' : 'text-gray-300'}`}>
                  {checkedKidCount} / {kids.length}
                </span>
              )}
            </div>

            {/* 하위 메뉴 행 */}
            {kids.length > 0 && (
              <div className="border-t border-gray-100 divide-y divide-gray-50">
                {kids.map(child => {
                  const childChecked = checkedIds.has(child.id);
                  return (
                    <div
                      key={child.id}
                      className={`flex items-center gap-2.5 pl-9 pr-3 py-2 cursor-pointer select-none transition-colors ${childChecked ? 'bg-indigo-50/50' : 'hover:bg-gray-50'}`}
                      onClick={() => toggleChild(child.id, parent.id, kids)}
                    >
                      <input
                        type="checkbox"
                        checked={childChecked}
                        onChange={() => toggleChild(child.id, parent.id, kids)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-3.5 h-3.5 accent-indigo-600 shrink-0 cursor-pointer"
                      />
                      <span className={`text-sm ${childChecked ? 'text-indigo-700' : 'text-gray-600'}`}>
                        {child.name}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── 마스터 권한 뱃지 색상 ─────────────────────────────────────────────
const MASTER_COLORS: Record<Tab, { header: string; badge: string; addBtn: string }> = {
  USER: {
    header: 'bg-emerald-50 border-emerald-200',
    badge:  'bg-emerald-100 text-emerald-700',
    addBtn: 'hover:bg-emerald-50 hover:text-emerald-700',
  },
  ADMIN: {
    header: 'bg-indigo-50 border-indigo-200',
    badge:  'bg-indigo-100 text-indigo-700',
    addBtn: 'hover:bg-indigo-50 hover:text-indigo-700',
  },
};

export default function AdminPermissionsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('USER');
  const [masters, setMasters] = useState<PermissionMaster[]>([]);
  const [allMenus, setAllMenus] = useState<{ USER: MenuConfig[]; ADMIN: MenuConfig[] }>({ USER: [], ADMIN: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [masterKeyword, setMasterKeyword]               = useState('');
  const [appliedMasterKeyword, setAppliedMasterKeyword] = useState('');
  const handleSearch = () => setAppliedMasterKeyword(masterKeyword);
  const handleReset  = () => { setMasterKeyword(''); setAppliedMasterKeyword(''); };

  // 마스터 추가
  const [showAddMaster, setShowAddMaster] = useState(false);
  const [newMasterCode, setNewMasterCode] = useState('');
  const [newMasterName, setNewMasterName] = useState('');
  const [newMasterDesc, setNewMasterDesc] = useState('');
  const [addingMaster, setAddingMaster]   = useState(false);

  // 마스터 수정
  const [editingMasterId,   setEditingMasterId]   = useState<number | null>(null);
  const [editingMasterName, setEditingMasterName] = useState('');
  const [editingMasterDesc, setEditingMasterDesc] = useState('');

  // 세부 권한 추가
  const [newDetailInputs, setNewDetailInputs] = useState<Record<number, { name: string; desc: string; code: string }>>({});
  const [addingDetail, setAddingDetail]       = useState<number | null>(null);

  // 세부 권한 수정
  const [editingDetailId,   setEditingDetailId]   = useState<number | null>(null);
  const [editingDetailName, setEditingDetailName] = useState('');
  const [editingDetailDesc, setEditingDetailDesc] = useState('');
  const [editingDetailCode, setEditingDetailCode] = useState('');

  // 메뉴 접근 권한
  const [pendingDetailMenus,   setPendingDetailMenus]   = useState<Record<number, Set<number>>>({});
  const [expandedMenuDetail,   setExpandedMenuDetail]   = useState<number | null>(null);
  const [savingDetailMenuFor,  setSavingDetailMenuFor]  = useState<number | null>(null);

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
        setAllMenus({ USER: userMenuRes.data.data ?? [], ADMIN: adminMenuRes.data.data ?? [] });
        const init: Record<number, Set<number>> = {};
        for (const m of loadedMasters) {
          for (const d of m.details) init[d.id] = new Set(d.allowedMenuIds);
        }
        setPendingDetailMenus(init);
      })
      .catch(() => setError('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const filteredMasters = (() => {
    const base = masters.filter((m) => m.scope === activeTab);
    if (!appliedMasterKeyword) return base;
    const kw = appliedMasterKeyword.toLowerCase();
    return base.filter((m) => m.code.toLowerCase().includes(kw) || m.name.toLowerCase().includes(kw));
  })();

  // ── 마스터 CRUD ───────────────────────────────────────────────────────
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
    } catch { setError('권한 그룹 추가에 실패했습니다.'); }
    finally  { setAddingMaster(false); }
  };

  const handleUpdateMaster = async (id: number) => {
    if (!editingMasterName.trim()) return;
    const master = masters.find((m) => m.id === id);
    if (!master) return;
    try {
      await permissionService.updateMaster(id, {
        code: master.code, name: editingMasterName.trim(),
        description: editingMasterDesc.trim() || undefined, scope: master.scope,
      });
      setEditingMasterId(null);
      load();
    } catch { setError('권한 그룹 수정에 실패했습니다.'); }
  };

  const handleDeleteMaster = async (id: number, name: string) => {
    if (!confirm(`"${name}" 권한 그룹과 모든 세부 권한을 삭제하시겠습니까?`)) return;
    try { await permissionService.deleteMaster(id); load(); }
    catch { setError('권한 그룹 삭제에 실패했습니다.'); }
  };

  // ── 세부 권한 메뉴 접근 ────────────────────────────────────────────────
  const handleSaveDetailMenus = async (detailId: number) => {
    setSavingDetailMenuFor(detailId);
    try {
      const ids = Array.from(pendingDetailMenus[detailId] ?? []);
      await permissionService.updateDetailMenuAccess(detailId, ids);
      load();
    } catch { setError('메뉴 접근 권한 저장에 실패했습니다.'); }
    finally  { setSavingDetailMenuFor(null); }
  };

  const hasDetailMenuChanges = (detailId: number, savedIds: number[]) => {
    const pending = pendingDetailMenus[detailId];
    if (!pending) return false;
    return !setsEqual(pending, new Set(savedIds));
  };

  // ── 세부 권한 CRUD ────────────────────────────────────────────────────
  const setDetailInput = (masterId: number, field: 'name' | 'desc' | 'code', value: string) => {
    setNewDetailInputs(prev => {
      const cur = prev[masterId] ?? { name: '', desc: '', code: '' };
      return { ...prev, [masterId]: { ...cur, [field]: value } };
    });
  };

  const handleAddDetail = async (masterId: number) => {
    const input = newDetailInputs[masterId] ?? { name: '', desc: '', code: '' };
    if (!input.name.trim()) return;
    setAddingDetail(masterId);
    try {
      await permissionService.createDetail({
        masterId, name: input.name.trim(),
        description: input.desc.trim() || undefined,
        code: input.code.trim().toUpperCase() || undefined,
      });
      setNewDetailInputs(prev => ({ ...prev, [masterId]: { name: '', desc: '', code: '' } }));
      load();
    } catch { setError('세부 권한 추가에 실패했습니다.'); }
    finally  { setAddingDetail(null); }
  };

  const handleUpdateDetail = async (id: number, masterId: number) => {
    if (!editingDetailName.trim()) return;
    try {
      await permissionService.updateDetail(id, {
        masterId, name: editingDetailName.trim(),
        description: editingDetailDesc.trim() || undefined,
        code: editingDetailCode.trim().toUpperCase() || undefined,
      });
      setEditingDetailId(null);
      load();
    } catch { setError('세부 권한 수정에 실패했습니다.'); }
  };

  const handleDeleteDetail = async (id: number, name: string) => {
    if (!confirm(`"${name}" 세부 권한을 삭제하시겠습니까?`)) return;
    try { await permissionService.deleteDetail(id); load(); }
    catch { setError('세부 권한 삭제에 실패했습니다.'); }
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
  const colors       = MASTER_COLORS[activeTab];

  return (
    <div className="space-y-5">
      {/* ── 헤더 ── */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">권한 관리</h2>
          <p className="text-sm text-gray-500 mt-1">
            권한 그룹(마스터)과 그 하위 세부 권한을 관리합니다. 세부 권한마다 접근 가능한 메뉴를 지정할 수 있습니다.
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
          권한 그룹 추가
        </button>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>}

      {/* ── 구조 안내 배너 ── */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-start gap-3">
        <svg viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5 text-amber-500 shrink-0 mt-0.5">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <div className="text-xs text-amber-700 space-y-0.5">
          <p className="font-semibold">권한 구조 안내</p>
          <p>
            <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 font-mono font-bold mr-1">권한 그룹 (마스터)</span>
            은 역할 단위 묶음입니다. 그 하위에
            <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 font-mono font-bold mx-1">세부 권한</span>
            을 여러 개 등록하고, 각 세부 권한별로 접근 허용 메뉴를 지정합니다.
          </p>
        </div>
      </div>

      {/* ── 검색 ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm px-4 py-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-48">
            <label className="block text-xs font-medium text-gray-500 mb-1">권한 코드 / 이름</label>
            <input
              type="text"
              value={masterKeyword}
              onChange={(e) => setMasterKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="권한 코드 또는 이름 검색"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 transition"
            />
          </div>
          <button onClick={handleSearch}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition">
            검색
          </button>
          {(masterKeyword || appliedMasterKeyword) && (
            <button onClick={handleReset}
              className="px-4 py-2 border border-gray-200 text-gray-500 rounded-lg text-sm hover:bg-gray-50 transition">
              초기화
            </button>
          )}
        </div>
      </div>

      {/* ── 탭 ── */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['USER', 'ADMIN'] as Tab[]).map((tab) => (
          <button key={tab} type="button"
            onClick={() => { setActiveTab(tab); setShowAddMaster(false); }}
            className={[
              'px-5 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1.5',
              activeTab === tab ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {tab === 'USER' ? '사용자 권한' : '관리자 권한'}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-200 text-gray-500'}`}>
              {masters.filter((m) => m.scope === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* ── 마스터 추가 폼 ── */}
      {showAddMaster && (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <p className="text-sm font-semibold text-gray-700">
              새 권한 그룹 추가 ({activeTab === 'USER' ? '사용자' : '관리자'})
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">그룹 코드 * <span className="text-gray-400">(예: MANAGER)</span></label>
              <input type="text" value={newMasterCode}
                onChange={(e) => setNewMasterCode(e.target.value)} placeholder="MANAGER" maxLength={50}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono" />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">그룹 이름 *</label>
              <input type="text" value={newMasterName}
                onChange={(e) => setNewMasterName(e.target.value)} placeholder="매니저" maxLength={100}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">설명 (선택)</label>
            <input type="text" value={newMasterDesc}
              onChange={(e) => setNewMasterDesc(e.target.value)} placeholder="권한 그룹 설명"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowAddMaster(false)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">취소</button>
            <button type="button" onClick={handleAddMaster}
              disabled={addingMaster || !newMasterCode.trim() || !newMasterName.trim()}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
              {addingMaster ? '추가 중...' : '추가'}
            </button>
          </div>
        </div>
      )}

      {/* ── 마스터 목록 ── */}
      {filteredMasters.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
          등록된 {activeTab === 'USER' ? '사용자' : '관리자'} 권한 그룹이 없습니다.
        </div>
      ) : (
        filteredMasters.map((master) => (
          <div key={master.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

            {/* ╔══ 권한 그룹 (마스터) 헤더 ═══════════════════════════════╗ */}
            <div className={`px-5 py-4 border-b-2 ${colors.header}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">권한 그룹</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${colors.badge}`}>MASTER</span>
              </div>
              {editingMasterId === master.id ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <input type="text" value={editingMasterName}
                      onChange={(e) => setEditingMasterName(e.target.value)}
                      autoFocus maxLength={100} placeholder="권한 이름"
                      className="px-3 py-1.5 rounded-lg border border-indigo-300 text-sm focus:outline-none" />
                    <input type="text" value={editingMasterDesc}
                      onChange={(e) => setEditingMasterDesc(e.target.value)}
                      maxLength={200} placeholder="설명 (선택)"
                      className="px-3 py-1.5 rounded-lg border border-indigo-300 text-sm focus:outline-none" />
                  </div>
                  <button type="button" onClick={() => handleUpdateMaster(master.id)}
                    className="text-xs text-indigo-600 font-medium hover:underline shrink-0">저장</button>
                  <button type="button" onClick={() => setEditingMasterId(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 shrink-0">취소</button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-1 rounded-lg text-sm font-mono font-bold shrink-0 ${colors.badge}`}>
                    {master.code}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900">{master.name}</p>
                    {master.description && (
                      <p className="text-xs text-gray-500 mt-0.5">{master.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs text-gray-400 whitespace-nowrap">계정 {master.userCount}명</span>
                    <span className="text-xs text-gray-400 whitespace-nowrap">세부 권한 {master.details.length}건</span>
                    <button type="button"
                      onClick={() => { setEditingMasterId(master.id); setEditingMasterName(master.name); setEditingMasterDesc(master.description ?? ''); }}
                      className="text-xs text-gray-400 hover:text-indigo-600 transition">수정</button>
                    <button type="button" onClick={() => handleDeleteMaster(master.id, master.name)}
                      className="text-xs text-gray-400 hover:text-red-500 transition">삭제</button>
                  </div>
                </div>
              )}
            </div>
            {/* ╚═══════════════════════════════════════════════════════════╝ */}

            {/* ── 세부 권한 섹션 레이블 ── */}
            <div className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
              <div className="w-px h-4 bg-gray-300" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">세부 권한</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-200 text-gray-500 font-medium">
                {master.details.length}
              </span>
            </div>

            {/* ── 세부 권한 목록 ── */}
            {master.details.length === 0 ? (
              <p className="px-7 py-4 text-xs text-gray-400 italic">세부 권한이 없습니다. 아래에서 추가하세요.</p>
            ) : (
              <ul className="divide-y divide-gray-50">
                {master.details.map((detail) => {
                  const isExpanded     = expandedMenuDetail === detail.id;
                  const detailMenuIds  = pendingDetailMenus[detail.id] ?? new Set(detail.allowedMenuIds);
                  const hasChanges     = hasDetailMenuChanges(detail.id, detail.allowedMenuIds);

                  return (
                    <li key={detail.id} className="pl-7 border-l-2 border-gray-100 ml-3">
                      {editingDetailId === detail.id ? (
                        <div className="flex flex-wrap items-center gap-2 px-4 py-3">
                          <input type="text" value={editingDetailName}
                            onChange={(e) => setEditingDetailName(e.target.value)}
                            autoFocus maxLength={100} placeholder="세부 권한 이름"
                            className="flex-1 min-w-32 px-3 py-1.5 rounded-lg border border-indigo-300 text-sm focus:outline-none" />
                          <input type="text" value={editingDetailCode}
                            onChange={(e) => setEditingDetailCode(e.target.value.toUpperCase())}
                            maxLength={100} placeholder="권한 코드"
                            className="w-36 px-3 py-1.5 rounded-lg border border-indigo-300 text-sm font-mono focus:outline-none" />
                          <input type="text" value={editingDetailDesc}
                            onChange={(e) => setEditingDetailDesc(e.target.value)}
                            maxLength={200} placeholder="설명 (선택)"
                            className="flex-1 min-w-32 px-3 py-1.5 rounded-lg border border-indigo-300 text-sm focus:outline-none" />
                          <button type="button" onClick={() => handleUpdateDetail(detail.id, master.id)}
                            className="text-xs text-indigo-600 font-medium hover:underline shrink-0">저장</button>
                          <button type="button" onClick={() => setEditingDetailId(null)}
                            className="text-xs text-gray-400 hover:text-gray-600 shrink-0">취소</button>
                        </div>
                      ) : (
                        <>
                          {/* 세부 권한 행 */}
                          <div className="flex items-center gap-3 px-4 py-3">
                            {/* ▸ 아이콘으로 하위 항목임을 표시 */}
                            <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3 text-gray-300 shrink-0">
                              <path d="M6 3l5 5-5 5V3z" />
                            </svg>
                            <span className="flex-1 text-sm font-medium text-gray-800">{detail.name}</span>
                            {detail.code && (
                              <span className="px-2 py-0.5 rounded text-xs font-mono bg-gray-100 text-gray-600 shrink-0">
                                {detail.code}
                              </span>
                            )}
                            {detail.description && (
                              <span className="text-xs text-gray-400 truncate max-w-[120px] shrink-0">{detail.description}</span>
                            )}
                            {/* 메뉴 접근 버튼 */}
                            <button type="button"
                              onClick={() => setExpandedMenuDetail(isExpanded ? null : detail.id)}
                              className={`shrink-0 text-xs px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                                isExpanded
                                  ? 'border-indigo-300 text-indigo-600 bg-indigo-50'
                                  : 'border-gray-200 text-gray-500 hover:border-gray-300'
                              }`}
                            >
                              <svg viewBox="0 0 16 16" fill="currentColor" className="w-3 h-3">
                                <path d="M2 4h12v1.5H2zm0 3.5h9V9H2zm0 3.5h6v1.5H2z" />
                              </svg>
                              메뉴 접근 {detailMenuIds.size > 0 ? `(${detailMenuIds.size})` : '미설정'}
                            </button>
                            <button type="button"
                              onClick={() => { setEditingDetailId(detail.id); setEditingDetailName(detail.name); setEditingDetailCode(detail.code ?? ''); setEditingDetailDesc(detail.description ?? ''); }}
                              className="text-xs text-gray-400 hover:text-indigo-600 transition shrink-0">수정</button>
                            <button type="button" onClick={() => handleDeleteDetail(detail.id, detail.name)}
                              className="text-xs text-gray-400 hover:text-red-500 transition shrink-0">삭제</button>
                          </div>

                          {/* 메뉴 접근 권한 패널 */}
                          {isExpanded && (
                            <div className="mx-4 mb-3 rounded-xl border border-gray-200 bg-gray-50 overflow-hidden">
                              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 bg-white">
                                <p className="text-xs font-semibold text-gray-600">
                                  접근 허용 메뉴 설정
                                  <span className="ml-1.5 text-gray-400 font-normal">— 체크한 메뉴에만 접근할 수 있습니다</span>
                                </p>
                                {hasChanges && (
                                  <button type="button"
                                    onClick={() => handleSaveDetailMenus(detail.id)}
                                    disabled={savingDetailMenuFor === detail.id}
                                    className="text-xs px-3 py-1 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition">
                                    {savingDetailMenuFor === detail.id ? '저장 중...' : '변경 저장'}
                                  </button>
                                )}
                              </div>
                              {!detail.code ? (
                                <p className="px-4 py-3 text-xs text-amber-700 bg-amber-50">
                                  권한 코드를 먼저 설정해야 메뉴 접근을 관리할 수 있습니다.
                                </p>
                              ) : (
                                <MenuCheckboxTree
                                  menus={currentMenus}
                                  checkedIds={detailMenuIds}
                                  onChange={(next) =>
                                    setPendingDetailMenus(prev => ({ ...prev, [detail.id]: next }))
                                  }
                                />
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {/* ── 세부 권한 추가 입력 ── */}
            <div className="px-5 py-3 border-t border-dashed border-gray-200 bg-gray-50/50 space-y-2">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">+ 세부 권한 추가</p>
              <div className="flex flex-wrap gap-2">
                <input type="text"
                  value={newDetailInputs[master.id]?.name ?? ''}
                  onChange={(e) => setDetailInput(master.id, 'name', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddDetail(master.id)}
                  placeholder="세부 권한 이름 *" maxLength={100}
                  className="flex-1 min-w-32 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <input type="text"
                  value={newDetailInputs[master.id]?.code ?? ''}
                  onChange={(e) => setDetailInput(master.id, 'code', e.target.value.toUpperCase())}
                  placeholder="권한 코드 (예: EXAM_READ)" maxLength={100}
                  className="w-44 px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <input type="text"
                  value={newDetailInputs[master.id]?.desc ?? ''}
                  onChange={(e) => setDetailInput(master.id, 'desc', e.target.value)}
                  placeholder="설명 (선택)" maxLength={200}
                  className="flex-1 min-w-32 px-3 py-1.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400" />
                <button type="button" onClick={() => handleAddDetail(master.id)}
                  disabled={addingDetail === master.id || !(newDetailInputs[master.id]?.name ?? '').trim()}
                  className={`px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium disabled:opacity-50 transition ${colors.addBtn}`}>
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
