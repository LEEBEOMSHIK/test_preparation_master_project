import {
  INQUIRY_TARGET_AREA_LABEL,
  type InquiryRequestType,
  type InquiryStatus,
  type InquiryTargetArea,
} from '@/types';

export const INQUIRY_REQUEST_TYPES: InquiryRequestType[] = [
  'GENERAL_INQUIRY',
  'BUG_REPORT',
  'EXAM_OPENING_REQUEST',
  'FEATURE_REQUEST',
  'OTHER',
];
export const INQUIRY_STATUSES: InquiryStatus[] = [
  'PENDING',
  'IN_PROGRESS',
  'ON_HOLD',
  'ANSWERED',
  'COMPLETED',
  'UNABLE_TO_PROCESS',
];
export const INQUIRY_TARGET_AREAS: InquiryTargetArea[] = [
  'LOGIN_ACCOUNT',
  'USER_HOME',
  'EXAM_INFO',
  'EXAM_SOLVING_RESULT',
  'DAILY_QUIZ',
  'CONCEPT_NOTE',
  'PRACTICE_SCRATCHPAD',
  'INQUIRY_REQUEST',
  'OTHER',
];

export function isInquiryRequestType(value: string): value is InquiryRequestType {
  return INQUIRY_REQUEST_TYPES.some((type) => type === value);
}

export function isInquiryTargetArea(value: string): value is InquiryTargetArea {
  return INQUIRY_TARGET_AREAS.some((area) => area === value);
}

export function getInquiryTargetAreaLabel(value: string): string {
  return isInquiryTargetArea(value) ? INQUIRY_TARGET_AREA_LABEL[value] : value;
}

export function isInquiryClosed(status: InquiryStatus): boolean {
  return status === 'ANSWERED' || status === 'COMPLETED' || status === 'UNABLE_TO_PROCESS';
}

export function requiresTargetArea(type: InquiryRequestType): boolean {
  return type === 'BUG_REPORT';
}

export function usesTargetArea(type: InquiryRequestType): boolean {
  return type !== 'EXAM_OPENING_REQUEST';
}

export function getAllowedAdminStatuses(type: InquiryRequestType): InquiryStatus[] {
  const open: InquiryStatus[] = ['PENDING', 'IN_PROGRESS', 'ON_HOLD'];
  return type === 'GENERAL_INQUIRY' || type === 'OTHER'
    ? [...open, 'ANSWERED']
    : [...open, 'COMPLETED', 'UNABLE_TO_PROCESS'];
}
