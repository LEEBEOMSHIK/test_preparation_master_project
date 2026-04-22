// ──────────────────────────────────────────
// Common
// ──────────────────────────────────────────
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
  timestamp: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

// ──────────────────────────────────────────
// Auth
// ──────────────────────────────────────────
export type Role = 'USER' | 'ADMIN';

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
}

export interface AuthTokens {
  accessToken: string;
}

// ──────────────────────────────────────────
// Exam
// ──────────────────────────────────────────
export type QuestionMode = 'RANDOM' | 'SEQUENTIAL';
export type QuestionType = 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'OX' | 'CODE';

export interface ExamSummary {
  id: number;
  title: string;
  orderNo: number;
  questionMode: QuestionMode;
  questionCount: number;
  createdAt: string;
}

export interface Question {
  id: number;
  seq: number;
  content: string;
  questionType: QuestionType;
  options?: string[];
  code?: string;
  language?: string;
}

export interface ExamDetail extends ExamSummary {
  questions: Question[];
}

/** 시험지에 속한 문항 (시험지 수정 화면에서 사용) */
export interface ExamQuestion {
  id: number;
  seq: number;
  content: string;
  questionType: QuestionType;
  options?: string[];
  answer?: string;
  explanation?: string;
  code?: string;
  language?: string;
}

export interface QuestionSummary {
  id: number;
  content: string;
  questionType: QuestionType;
  options?: string[];
  answer?: string;
  code?: string;
  language?: string;
  explanation?: string;
  categoryId?: number;
  categoryName?: string;
  createdAt: string;
}

// ──────────────────────────────────────────
// Domain
// ──────────────────────────────────────────
export interface DomainSlave {
  id: number;
  masterId: number;
  name: string;
  displayOrder?: number;
}

export interface DomainMaster {
  id: number;
  name: string;
  slaves: DomainSlave[];
}

// ──────────────────────────────────────────
// Examination (시험)
// ──────────────────────────────────────────
export interface Examination {
  id: number;
  title: string;
  examPaperId: number;
  examPaperTitle: string;
  categoryId: number;
  categoryName: string;
  timeLimit: number;
  createdAt: string;
}

export interface ExaminationDetail {
  id: number;
  title: string;
  examPaperId: number;
  examPaperTitle: string;
  categoryName: string | null;
  timeLimit: number;
  questions: Question[];
}

// ──────────────────────────────────────────
// Quote
// ──────────────────────────────────────────
export interface Quote {
  id: number;
  content: string;
  author?: string;
  useYn: string;
  createdAt: string;
}

// ──────────────────────────────────────────
// ConceptNote
// ──────────────────────────────────────────
export interface ConceptNote {
  id: number;
  title: string;
  content: string;
  isPublic: boolean;
  userId?: number;
  userName?: string;
  // 연결된 시험 문항 (시험 화면에서 등록된 경우)
  questionId?: number;
  questionContent?: string;
  questionType?: string;
  questionCode?: string;
  questionLanguage?: string;
  // 연결된 퀴즈 문항 (데일리 퀴즈에서 등록된 경우)
  questionBankId?: number;
  questionBankContent?: string;
  questionBankType?: string;
  questionBankCode?: string;
  questionBankLanguage?: string;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────
// Inquiry
// ──────────────────────────────────────────
export type InquiryStatus = 'PENDING' | 'ON_HOLD' | 'ANSWERED';
export type InquiryType = 'EXAM' | 'CONCEPT_NOTE' | 'DAILY_QUIZ' | 'OTHER';

export const INQUIRY_STATUS_LABEL: Record<InquiryStatus, string> = {
  PENDING: '답변 대기',
  ON_HOLD: '답변 보류',
  ANSWERED: '답변 완료',
};

export const INQUIRY_TYPE_LABEL: Record<InquiryType, string> = {
  EXAM: '시험',
  CONCEPT_NOTE: '개념노트',
  DAILY_QUIZ: '데일리 퀴즈',
  OTHER: '기타',
};

export interface Inquiry {
  id: number;
  title: string;
  content: string;
  status: InquiryStatus;
  inquiryType: InquiryType;
  imageUrls: string[];
  reply?: string;
  repliedAt?: string;
  createdAt: string;
  userId?: number;
  userName?: string;
}

// ──────────────────────────────────────────
// FAQ
// ──────────────────────────────────────────
export interface Faq {
  id: number;
  question: string;
  answer: string;
  isActive: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
}
