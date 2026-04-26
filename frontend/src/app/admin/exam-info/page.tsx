'use client';

import { useEffect, useState, useCallback } from 'react';
import { examInfoService } from '@/services/examInfoService';
import { EXAM_TYPES } from '@/types';
import type { ExamInfo } from '@/types';

const EMPTY_FORM = {
  examType: EXAM_TYPES[0] as string,
  title: '',
  description: '',
  applicationPeriod: '',
  examSchedule: '',
  resultDate: '',
  officialUrl: '',
  isActive: true,
  displayOrder: 0,
};

type FormState = typeof EMPTY_FORM;

export default function AdminExamInfoPage() {
  const [items, setItems] = useState<ExamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    examInfoService.adminGetAll()
      .then(res => setItems(res.data.data ?? []))
      .catch(() => setError('데이터를 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  };

  const openEdit = (item: ExamInfo) => {
    setEditingId(item.id);
    setForm({
      examType: item.examType,
      title: item.title,
      description: item.description ?? '',
      applicationPeriod: item.applicationPeriod ?? '',
      examSchedule: item.examSchedule ?? '',
      resultDate: item.resultDate ?? '',
      officialUrl: item.officialUrl ?? '',
      isActive: item.isActive,
      displayOrder: item.displayOrder,
    });
    setShowForm(true);
  };

  const set = (field: keyof FormState, value: string | boolean | number) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.examType.trim()) return;
    setSaving(true);
    setError('');
    try {
      if (editingId !== null) {
        await examInfoService.adminUpdate(editingId, form);
      } else {
        await examInfoService.adminCreate(form);
      }
      setShowForm(false);
      load();
    } catch {
      setError('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`"${title}" 시험 정보를 삭제하시겠습니까?`)) return;
    try {
      await examInfoService.adminDelete(id);
      load();
    } catch {
      setError('삭제에 실패했습니다.');
    }
  };

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">시험 정보 관리</h2>
          <p className="text-sm text-gray-500 mt-1">학습자에게 제공할 시험 정보를 관리합니다.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          시험 정보 추가
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>
      )}

      {/* Add / Edit Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-indigo-100 shadow-sm p-6 space-y-4">
          <h3 className="text-sm font-semibold text-gray-800">
            {editingId !== null ? '시험 정보 수정' : '새 시험 정보 추가'}
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">시험 유형 *</label>
              <select
                value={form.examType}
                onChange={e => set('examType', e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              >
                {EXAM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                <option value="기타">기타</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">시험명 *</label>
              <input
                type="text"
                value={form.title}
                onChange={e => set('title', e.target.value)}
                placeholder="예: 정보처리기사"
                maxLength={200}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">시험 설명</label>
            <textarea
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="시험에 대한 간략한 설명"
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1">접수 기간</label>
              <input
                type="text"
                value={form.applicationPeriod}
                onChange={e => set('applicationPeriod', e.target.value)}
                placeholder="예: 매년 1·3·5월"
                maxLength={300}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">시험 일정</label>
              <input
                type="text"
                value={form.examSchedule}
                onChange={e => set('examSchedule', e.target.value)}
                placeholder="예: 매년 2·4·6월"
                maxLength={300}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">합격 발표</label>
              <input
                type="text"
                value={form.resultDate}
                onChange={e => set('resultDate', e.target.value)}
                placeholder="예: 시험 후 약 4주"
                maxLength={300}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs text-gray-500 mb-1">공식 홈페이지 URL</label>
              <input
                type="url"
                value={form.officialUrl}
                onChange={e => set('officialUrl', e.target.value)}
                placeholder="https://..."
                maxLength={500}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">정렬 순서</label>
              <input
                type="number"
                value={form.displayOrder}
                onChange={e => set('displayOrder', Number(e.target.value))}
                min={0}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={form.isActive}
              onChange={e => set('isActive', e.target.checked)}
              className="w-4 h-4 accent-indigo-600"
            />
            <label htmlFor="isActive" className="text-sm text-gray-600">활성화 (사용자에게 노출)</label>
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-500 hover:bg-gray-50 transition">
              취소
            </button>
            <button type="button" onClick={handleSave} disabled={saving || !form.title.trim()}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition">
              {saving ? '저장 중...' : (editingId !== null ? '수정' : '추가')}
            </button>
          </div>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400 text-sm">
          등록된 시험 정보가 없습니다.
        </div>
      ) : (
        <div className="space-y-3">
          {items.map(item => (
            <div key={item.id} className={`bg-white rounded-2xl border shadow-sm p-5 ${item.isActive ? 'border-gray-100' : 'border-gray-100 opacity-60'}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700">
                      {item.examType}
                    </span>
                    <span className="text-sm font-bold text-gray-900">{item.title}</span>
                    {!item.isActive && (
                      <span className="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">비활성</span>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-400">
                    {item.applicationPeriod && <span>접수: {item.applicationPeriod}</span>}
                    {item.examSchedule && <span>일정: {item.examSchedule}</span>}
                    {item.resultDate && <span>발표: {item.resultDate}</span>}
                    {item.officialUrl && (
                      <a href={item.officialUrl} target="_blank" rel="noopener noreferrer"
                        className="text-indigo-500 hover:underline">홈페이지 ↗</a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-300">#{item.displayOrder}</span>
                  <button type="button" onClick={() => openEdit(item)}
                    className="text-xs text-gray-400 hover:text-indigo-600 transition px-2 py-1">수정</button>
                  <button type="button" onClick={() => handleDelete(item.id, item.title)}
                    className="text-xs text-gray-400 hover:text-red-500 transition px-2 py-1">삭제</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
