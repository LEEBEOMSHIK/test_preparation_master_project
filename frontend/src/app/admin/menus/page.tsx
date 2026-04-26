'use client';

import { useState, useEffect } from 'react';
import { menuService, type MenuConfigRequest } from '@/services/menuService';
import type { MenuConfig } from '@/types';

type MenuTypeTab = 'ADMIN' | 'USER';

const ICON_KEYS = ['exam', 'concept', 'inquiry', 'faq', 'quote', 'table', 'permission', 'menu', 'quiz', ''];

export default function AdminMenusPage() {
  const [activeTab, setActiveTab] = useState<MenuTypeTab>('ADMIN');
  const [menus, setMenus] = useState<MenuConfig[]>([]);
  const [flatMenus, setFlatMenus] = useState<MenuConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 추가 폼
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState<MenuConfigRequest>({
    parentId: undefined,
    name: '',
    url: '',
    iconKey: '',
    displayOrder: 1,
    menuType: 'ADMIN',
    isActive: true,
    allowedRoles: 'ADMIN',
  });
  const [saving, setSaving] = useState(false);

  // 수정
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<MenuConfigRequest | null>(null);

  const load = (tab: MenuTypeTab) => {
    setLoading(true);
    Promise.all([
      menuService.adminGetAll(tab),
      menuService.adminGetFlat(tab),
    ])
      .then(([treeRes, flatRes]) => {
        setMenus(treeRes.data.data ?? []);
        setFlatMenus(flatRes.data.data ?? []);
      })
      .catch(() => setError('메뉴 목록을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(activeTab);
    setForm((prev) => ({
      ...prev,
      menuType: activeTab,
      allowedRoles: activeTab === 'ADMIN' ? 'ADMIN' : 'USER,ADMIN',
    }));
  }, [activeTab]);

  const handleCreate = async () => {
    if (!form.name.trim() || !form.url.trim()) return;
    setSaving(true);
    try {
      await menuService.create({ ...form, parentId: form.parentId || undefined });
      setShowAdd(false);
      resetForm();
      load(activeTab);
    } catch {
      setError('메뉴 추가에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id: number) => {
    if (!editForm || !editForm.name.trim() || !editForm.url.trim()) return;
    setSaving(true);
    try {
      await menuService.update(id, { ...editForm, parentId: editForm.parentId || undefined });
      setEditingId(null);
      setEditForm(null);
      load(activeTab);
    } catch {
      setError('메뉴 수정에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`"${name}" 메뉴를 삭제하시겠습니까?`)) return;
    try {
      await menuService.delete(id);
      load(activeTab);
    } catch {
      setError('메뉴 삭제에 실패했습니다.');
    }
  };

  const resetForm = () => setForm({
    parentId: undefined,
    name: '',
    url: '',
    iconKey: '',
    displayOrder: (flatMenus.filter(m => !m.parentId).length + 1),
    menuType: activeTab,
    isActive: true,
    allowedRoles: activeTab === 'ADMIN' ? 'ADMIN' : 'USER,ADMIN',
  });

  const startEdit = (menu: MenuConfig) => {
    setEditingId(menu.id);
    setEditForm({
      parentId: menu.parentId,
      name: menu.name,
      url: menu.url,
      iconKey: menu.iconKey ?? '',
      displayOrder: menu.displayOrder,
      menuType: menu.menuType,
      isActive: menu.isActive,
      allowedRoles: menu.allowedRoles ?? '',
    });
  };

  const parentOptions = flatMenus.filter(m => !m.parentId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">메뉴 관리</h2>
          <p className="text-sm text-gray-500 mt-1">사용자/관리자 메뉴를 추가·수정·삭제합니다.</p>
        </div>
        <button
          type="button"
          onClick={() => { setShowAdd((v) => !v); resetForm(); }}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition flex items-center gap-1.5"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          메뉴 추가
        </button>
      </div>

      {/* 탭 */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(['ADMIN', 'USER'] as MenuTypeTab[]).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={[
              'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
              activeTab === tab
                ? 'bg-white text-indigo-700 shadow-sm'
                : 'text-gray-500 hover:text-gray-700',
            ].join(' ')}
          >
            {tab === 'ADMIN' ? '관리자 메뉴' : '사용자 메뉴'}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>
      )}

      {/* 추가 폼 */}
      {showAdd && (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-5 space-y-3">
          <p className="text-sm font-semibold text-gray-700">새 메뉴 추가</p>
          <MenuForm
            data={form}
            onChange={setForm}
            parentOptions={parentOptions}
            menuType={activeTab}
            iconKeys={ICON_KEYS}
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={() => setShowAdd(false)}
              className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50">취소</button>
            <button type="button" onClick={handleCreate}
              disabled={saving || !form.name.trim() || !form.url.trim()}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50">
              {saving ? '추가 중...' : '추가'}
            </button>
          </div>
        </div>
      )}

      {/* 메뉴 트리 */}
      {menus.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 text-center text-gray-400 text-sm">
          등록된 메뉴가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {menus.map((menu) => (
            <div key={menu.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* 상위 메뉴 */}
              <MenuRow
                menu={menu}
                isEditing={editingId === menu.id}
                editForm={editForm}
                onEdit={() => startEdit(menu)}
                onCancelEdit={() => { setEditingId(null); setEditForm(null); }}
                onSaveEdit={() => handleUpdate(menu.id)}
                onDelete={() => handleDelete(menu.id, menu.name)}
                onChangeEdit={(f) => setEditForm(f)}
                parentOptions={parentOptions}
                saving={saving}
                iconKeys={ICON_KEYS}
                isChild={false}
              />

              {/* 하위 메뉴 */}
              {menu.children && menu.children.length > 0 && (
                <ul className="divide-y divide-gray-50">
                  {menu.children.map((child) => (
                    <li key={child.id}>
                      <MenuRow
                        menu={child}
                        isEditing={editingId === child.id}
                        editForm={editForm}
                        onEdit={() => startEdit(child)}
                        onCancelEdit={() => { setEditingId(null); setEditForm(null); }}
                        onSaveEdit={() => handleUpdate(child.id)}
                        onDelete={() => handleDelete(child.id, child.name)}
                        onChangeEdit={(f) => setEditForm(f)}
                        parentOptions={parentOptions}
                        saving={saving}
                        iconKeys={ICON_KEYS}
                        isChild
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MenuRow({
  menu, isEditing, editForm, onEdit, onCancelEdit, onSaveEdit, onDelete,
  onChangeEdit, parentOptions, saving, iconKeys, isChild,
}: {
  menu: MenuConfig;
  isEditing: boolean;
  editForm: MenuConfigRequest | null;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  onChangeEdit: (f: MenuConfigRequest) => void;
  parentOptions: MenuConfig[];
  saving: boolean;
  iconKeys: string[];
  isChild: boolean;
}) {
  return (
    <div className={`px-5 py-3 ${isChild ? 'pl-10 bg-gray-50/30' : 'border-b border-gray-100 bg-gray-50/50'}`}>
      {isEditing && editForm ? (
        <div className="space-y-2">
          <MenuForm
            data={editForm}
            onChange={onChangeEdit}
            parentOptions={parentOptions}
            menuType={menu.menuType}
            iconKeys={iconKeys}
          />
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onCancelEdit}
              className="text-xs text-gray-400 hover:text-gray-600">취소</button>
            <button type="button" onClick={onSaveEdit} disabled={saving}
              className="text-xs text-indigo-600 font-medium hover:underline">저장</button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {isChild && <span className="text-gray-300 text-xs">└</span>}
            <span className="text-sm font-medium text-gray-800 truncate">{menu.name}</span>
            <span className="text-xs text-gray-400 truncate font-mono">{menu.url}</span>
            {menu.iconKey && (
              <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-xs font-mono">{menu.iconKey}</span>
            )}
            {!menu.isActive && (
              <span className="px-1.5 py-0.5 bg-red-50 text-red-500 rounded text-xs">비활성</span>
            )}
          </div>
          <span className="text-xs text-gray-400 shrink-0">순서 {menu.displayOrder}</span>
          <button type="button" onClick={onEdit}
            className="text-xs text-gray-400 hover:text-indigo-600 transition shrink-0">수정</button>
          <button type="button" onClick={onDelete}
            className="text-xs text-gray-400 hover:text-red-500 transition shrink-0">삭제</button>
        </div>
      )}
    </div>
  );
}

function MenuForm({
  data, onChange, parentOptions, menuType, iconKeys,
}: {
  data: MenuConfigRequest;
  onChange: (d: MenuConfigRequest) => void;
  parentOptions: MenuConfig[];
  menuType: 'USER' | 'ADMIN';
  iconKeys: string[];
}) {
  const set = (patch: Partial<MenuConfigRequest>) => onChange({ ...data, ...patch });

  return (
    <div className="grid grid-cols-2 gap-3">
      <div>
        <label className="block text-xs text-gray-500 mb-1">메뉴 이름 *</label>
        <input type="text" value={data.name} onChange={(e) => set({ name: e.target.value })}
          maxLength={100} placeholder="시험 관리"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">URL *</label>
        <input type="text" value={data.url} onChange={(e) => set({ url: e.target.value })}
          maxLength={200} placeholder={menuType === 'ADMIN' ? '/admin/exams' : '/user/exams'}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">상위 메뉴</label>
        <select value={data.parentId ?? ''} onChange={(e) => set({ parentId: e.target.value ? Number(e.target.value) : undefined })}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">없음 (최상위)</option>
          {parentOptions.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">아이콘 키</label>
        <select value={data.iconKey ?? ''} onChange={(e) => set({ iconKey: e.target.value || undefined })}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          {iconKeys.map((k) => (
            <option key={k} value={k}>{k || '(없음)'}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">표시 순서</label>
        <input type="number" value={data.displayOrder} min={1} onChange={(e) => set({ displayOrder: Number(e.target.value) })}
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div>
        <label className="block text-xs text-gray-500 mb-1">허용 권한 (콤마 구분)</label>
        <input type="text" value={data.allowedRoles ?? ''} onChange={(e) => set({ allowedRoles: e.target.value })}
          placeholder="ADMIN 또는 USER,ADMIN"
          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" />
      </div>
      <div className="flex items-center gap-2 col-span-2">
        <input type="checkbox" id="isActive" checked={data.isActive} onChange={(e) => set({ isActive: e.target.checked })}
          className="rounded border-gray-300 text-indigo-600" />
        <label htmlFor="isActive" className="text-sm text-gray-700">활성화</label>
      </div>
    </div>
  );
}
