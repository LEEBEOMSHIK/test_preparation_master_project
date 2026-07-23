'use client';

import { useEffect, useState } from 'react';
import { supportService } from '@/services/supportService';
import { Skeleton } from '@/components/ui/Skeleton';
import type { SupportSettings } from '@/types';

const EMPTY_FORM: SupportSettings = {
  tossUrl: '',
  kakaopayUrl: '',
  kakaoGiftUrl: '',
};

type FormState = typeof EMPTY_FORM;

export default function AdminSupportSettingsPage() {
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    supportService
      .adminGetSupportSettings()
      .then((res) => {
        const data = res.data.data;
        setForm({
          tossUrl: data?.tossUrl ?? '',
          kakaopayUrl: data?.kakaopayUrl ?? '',
          kakaoGiftUrl: data?.kakaoGiftUrl ?? '',
        });
      })
      .catch(() => setError('후원 링크 설정을 불러오지 못했습니다.'))
      .finally(() => setLoading(false));
  }, []);

  const set = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (successMessage) setSuccessMessage('');
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccessMessage('');
    try {
      await supportService.adminUpdateSupportSettings({
        tossUrl: form.tossUrl?.trim() ?? '',
        kakaopayUrl: form.kakaopayUrl?.trim() ?? '',
        kakaoGiftUrl: form.kakaoGiftUrl?.trim() ?? '',
      });
      setSuccessMessage('저장되었습니다.');
    } catch {
      setError('저장에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900">후원 링크 관리</h2>
        <p className="text-sm text-gray-500 mt-1">
          사용자 화면(개발자 응원하기)에 노출되는 토스·카카오페이·카카오 선물하기 링크를 관리합니다.
          URL이 비어있으면 해당 채널은 사용자 화면에서 &quot;준비 중&quot;으로 비활성 표시됩니다.
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-2.5">{error}</p>
      )}
      {successMessage && (
        <p className="text-sm text-green-600 bg-green-50 rounded-lg px-4 py-2.5">{successMessage}</p>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 max-w-xl">
        {loading ? (
          <div className="space-y-5 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-9 w-full rounded-lg" />
              </div>
            ))}
            <Skeleton className="h-9 w-24 rounded-lg ml-auto" />
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">토스 송금 링크</label>
              <input
                type="url"
                value={form.tossUrl ?? ''}
                onChange={(e) => set('tossUrl', e.target.value)}
                placeholder="https://toss.me/..."
                maxLength={500}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">카카오페이 송금 링크</label>
              <input
                type="url"
                value={form.kakaopayUrl ?? ''}
                onChange={(e) => set('kakaopayUrl', e.target.value)}
                placeholder="https://qr.kakaopay.com/..."
                maxLength={500}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-500 mb-1">카카오톡 선물하기 위시리스트 링크</label>
              <input
                type="url"
                value={form.kakaoGiftUrl ?? ''}
                onChange={(e) => set('kakaoGiftUrl', e.target.value)}
                placeholder="https://gift.kakao.com/wish/..."
                maxLength={500}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 disabled:opacity-50 transition"
              >
                {saving ? '저장 중...' : '저장'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
