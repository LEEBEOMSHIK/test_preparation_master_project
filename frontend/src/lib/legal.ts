export interface LegalInfo {
  operatorName: string | null;
  contactEmail: string | null;
  serviceUrl: string | null;
  minimumAge: number | null;
  policyStatus: 'draft' | 'published';
  reviewedAt: string;
}

export const LEGAL_INFO: Readonly<LegalInfo> = {
  operatorName: '이범식',
  contactEmail: 'bumcity137@gmail.com',
  serviceUrl: null,
  minimumAge: 14,
  policyStatus: 'draft',
  reviewedAt: '2026-09-09',
};
