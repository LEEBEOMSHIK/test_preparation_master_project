import { afterEach, describe, expect, it, jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import PrivacyPage, { metadata as privacyMetadata } from '@/app/privacy/page';
import TermsPage, { metadata as termsMetadata } from '@/app/terms/page';
import PrivacyRequestsPage, { metadata as requestsMetadata } from '@/app/privacy/requests/page';
import { LEGAL_INFO } from '@/lib/legal';

afterEach(() => {
  jest.restoreAllMocks();
});

describe('공개 정책 초안', () => {
  it('인증 없이 정책 간 이동과 홈 링크를 제공하고 초안은 검색에서 제외한다', () => {
    render(<PrivacyPage />);
    expect(screen.getByRole('complementary', { name: '초안 안내' })).toBeTruthy();
    expect(screen.getByText(/운영자: 이범식/)).toBeTruthy();
    expect(screen.getByText(/만 14세 미만은 이용할 수 없습니다/)).toBeTruthy();
    expect(screen.getByRole('link', { name: 'TPMP 홈' }).getAttribute('href')).toBe('/');
    expect(screen.getByRole('link', { name: '이용약관' }).getAttribute('href')).toBe('/terms');
    expect(screen.getByRole('navigation', { name: '정책 및 개인정보 안내' })).toBeTruthy();
    for (const metadata of [privacyMetadata, termsMetadata, requestsMetadata]) {
      expect(metadata.robots).toEqual({ index: false, follow: false });
    }
  });

  it('약관에서 개인정보 요청 안내로 이동할 수 있다', () => {
    render(<TermsPage />);
    expect(screen.getByRole('heading', { level: 1, name: '이용약관 초안' })).toBeTruthy();
    expect(screen.getByText(/만 14세 미만은 이용할 수 없습니다/)).toBeTruthy();
    expect(screen.getAllByRole('link', { name: '개인정보 요청 안내' })[0].getAttribute('href')).toBe('/privacy/requests');
  });

  it('미확정 연락처를 임의 공개하지 않고 문의 작성 링크만 제공한다', () => {
    jest.replaceProperty(LEGAL_INFO, 'contactEmail', null);
    render(<PrivacyRequestsPage />);
    expect(screen.getByRole('link', { name: '문의·요청 작성' }).getAttribute('href')).toBe('/user/inquiries/new');
    expect(screen.getByText(/비로그인 연락처 준비 중/)).toBeTruthy();
    expect(screen.getAllByRole('link').some((link) => link.getAttribute('href')?.startsWith('mailto:'))).toBe(false);
    expect(screen.queryByRole('button')).toBeNull();
  });

  it('운영자가 확정한 연락처가 있으면 비로그인 메일 요청 경로를 제공한다', () => {
    render(<PrivacyRequestsPage />);
    expect(screen.getByRole('link', { name: 'bumcity137@gmail.com' }).getAttribute('href')).toBe('mailto:bumcity137@gmail.com');
    expect(screen.queryByText(/비로그인 연락처 준비 중/)).toBeNull();
  });
});
