'use client';

import { useEffect, useState, useCallback } from 'react';
import { examInfoService } from '@/services/examInfoService';
import { domainService } from '@/services/domainService';
import type { ExamInfo } from '@/types';

const EMPTY_FORM = {
  examType: '',
  title: '',
  description: '',
  applicationPeriodStart: '',
  applicationPeriodEnd: '',
  examScheduleStart: '',
  examScheduleEnd: '',
  resultDate: '',
  officialUrl: '',
  isActive: true,
  displayOrder: 0,
};

type FormState = typeof EMPTY_FORM;

// ── 날짜 입력 범위 제한: 오늘 기준 ±10년 ──────────────────────────────────────
const THIS_YEAR = new Date().getFullYear();
const MIN_DATE  = `${THIS_YEAR - 10}-01-01`;
const MAX_DATE  = `${THIS_YEAR + 10}-12-31`;

/** YYYY-MM-DD 형식 + 연도가 ±10년 이내인지 정규식으로 검증 */
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
function isAllowedDate(val: string): boolean {
  if (!val) return true;
  const m = DATE_RE.exec(val);
  if (!m) return false;
  const yr = parseInt(m[1], 10);
  return yr >= THIS_YEAR - 10 && yr <= THIS_YEAR + 10;
}

/** "YYYY-MM-DD ~ YYYY-MM-DD" 형식 파싱 */
function parseRange(val: string | undefined): { start: string; end: string } {
  if (!val) return { start: '', end: '' };
  const [start = '', end = ''] = val.split(' ~ ');
  return { start: start.trim(), end: end.trim() };
}

/** 시작/종료 날짜 → 저장용 문자열 */
function buildRange(start: string, end: string): string {
  if (!start && !end) return '';
  if (start && end) return `${start} ~ ${end}`;
  return start || end;
}

/** "YYYY-MM-DD" → "YYYY.MM.DD" 표시 변환 */
function fmtDate(val: string): string {
  return val.replace(/-/g, '.');
}

/** 범위 문자열을 사람이 읽기 좋은 형태로 변환 */
function fmtRange(val: string | undefined): string {
  if (!val) return '';
  const { start, end } = parseRange(val);
  if (start && end) return `${fmtDate(start)} ~ ${fmtDate(end)}`;
  return fmtDate(start || end);
}

export default function AdminExamInfoPage() {
  const [items, setItems] = useState<ExamInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [examTypeOptions, setExamTypeOptions] = useState<string[]>([]);

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

  useEffect(() => {
    domainService.getDomains()
      .then(res => {
        const masters = res.data.data ?? [];
        const examTypeMaster = masters.find(m => m.name === '시험 유형');
        const names = examTypeMaster?.slaves?.map(s => s.name) ?? [];
        setExamTypeOptions(names);
        if (names.length > 0) {
          setForm(prev => ({ ...prev, examType: prev.examType || names[0] }));
        }
      })
      .catch(() => {});
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, examType: examTypeOptions[0] ?? '' });
    setShowForm(true);
  };

  const openEdit = (item: ExamInfo) => {
    const appRange = parseRange(item.applicationPeriod);
    const schRange = parseRange(item.examSchedule);
    setEditingId(item.id);
    setForm({
      examType: item.examType,
      title: item.title,
      description: item.description ?? '',
      applicationPeriodStart: appRange.start,
      applicationPeriodEnd: appRange.end,
      examScheduleStart: schRange.start,
      examScheduleEnd: schRange.end,
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
      const payload = {
        examType: form.examType,
        title: form.title,
        description: form.description,
        applicationPeriod: buildRange(form.applicationPeriodStart, form.applicationPeriodEnd),
        examSchedule: buildRange(form.examScheduleStart, form.examScheduleEnd),
        resultDate: form.resultDate,
        officialUrl: form.officialUrl,
        isActive: form.isActive,
        displayOrder: form.displayOrder,
      };
      if (editingId !== null) {
        await examInfoService.adminUpdate(editingId, payload);
      } else {
        await examInfoService.adminCreate(payload);
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
                {examTypeOptions.length === 0 && (
                  <option value="">-- 도메인 로딩 중 --</option>
                )}
                {examTypeOptions.map(t => <option key={t} value={t}>{t}</option>)}
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

          {/* 접수 기간 — 날짜 범위 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              접수 기간
              <span className="ml-1 text-gray-400 font-normal">({THIS_YEAR - 10} ~ {THIS_YEAR + 10}년)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                min={MIN_DATE}
                max={MAX_DATE}
                value={form.applicationPeriodStart}
                onChange={e => { if (isAllowedDate(e.target.value)) set('applicationPeriodStart', e.target.value); }}
                onBlur={e => { if (e.target.validity.badInput || !isAllowedDate(e.target.value)) set('applicationPeriodStart', ''); }}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs text-gray-400 shrink-0">~</span>
              <input
                type="date"
                min={form.applicationPeriodStart || MIN_DATE}
                max={MAX_DATE}
                value={form.applicationPeriodEnd}
                onChange={e => { if (isAllowedDate(e.target.value)) set('applicationPeriodEnd', e.target.value); }}
                onBlur={e => { if (e.target.validity.badInput || !isAllowedDate(e.target.value)) set('applicationPeriodEnd', ''); }}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* 시험 일정 — 날짜 범위 */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              시험 일정
              <span className="ml-1 text-gray-400 font-normal">({THIS_YEAR - 10} ~ {THIS_YEAR + 10}년)</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="date"
                min={MIN_DATE}
                max={MAX_DATE}
                value={form.examScheduleStart}
                onChange={e => { if (isAllowedDate(e.target.value)) set('examScheduleStart', e.target.value); }}
                onBlur={e => { if (e.target.validity.badInput || !isAllowedDate(e.target.value)) set('examScheduleStart', ''); }}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <span className="text-xs text-gray-400 shrink-0">~</span>
              <input
                type="date"
                min={form.examScheduleStart || MIN_DATE}
                max={MAX_DATE}
                value={form.examScheduleEnd}
                onChange={e => { if (isAllowedDate(e.target.value)) set('examScheduleEnd', e.target.value); }}
                onBlur={e => { if (e.target.validity.badInput || !isAllowedDate(e.target.value)) set('examScheduleEnd', ''); }}
                className="flex-1 px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
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
          </div>

          <div className="grid grid-cols-3 gap-3">
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
            <div className="col-span-2 flex items-end pb-1">
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
            </div>
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
                    {item.applicationPeriod && (
                      <span>접수: {fmtRange(item.applicationPeriod)}</span>
                    )}
                    {item.examSchedule && (
                      <span>일정: {fmtRange(item.examSchedule)}</span>
                    )}
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
