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
export type QuestionType = 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'OX';

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
}

export interface ExamDetail extends ExamSummary {
  questions: Question[];
}

// ──────────────────────────────────────────
// ConceptNote
// ──────────────────────────────────────────
export interface ConceptNote {
  id: number;
  title: string;
  content: string;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// ──────────────────────────────────────────
// Inquiry
// ──────────────────────────────────────────
export type InquiryStatus = 'PENDING' | 'ANSWERED';

export interface Inquiry {
  id: number;
  title: string;
  content: string;
  status: InquiryStatus;
  reply?: string;
  repliedAt?: string;
  createdAt: string;
}
