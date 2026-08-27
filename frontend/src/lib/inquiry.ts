import type { InquiryRequestType, InquiryStatus } from '@/types';

export const INQUIRY_REQUEST_TYPES: InquiryRequestType[] = ['GENERAL_INQUIRY', 'BUG_REPORT', 'EXAM_OPENING_REQUEST', 'FEATURE_REQUEST', 'OTHER'];
export const INQUIRY_STATUSES: InquiryStatus[] = ['PENDING', 'IN_PROGRESS', 'ON_HOLD', 'ANSWERED', 'COMPLETED', 'UNABLE_TO_PROCESS'];

export function isInquiryClosed(status: InquiryStatus): boolean {
  return status === 'ANSWERED' || status === 'COMPLETED' || status === 'UNABLE_TO_PROCESS';
}

export function requiresTargetArea(type: InquiryRequestType): boolean { return type === 'BUG_REPORT'; }
export function usesTargetArea(type: InquiryRequestType): boolean { return type !== 'EXAM_OPENING_REQUEST'; }

export function getAllowedAdminStatuses(type: InquiryRequestType): InquiryStatus[] {
  const open: InquiryStatus[] = ['PENDING', 'IN_PROGRESS', 'ON_HOLD'];
  return type === 'GENERAL_INQUIRY' || type === 'OTHER'
    ? [...open, 'ANSWERED']
    : [...open, 'COMPLETED', 'UNABLE_TO_PROCESS'];
}
