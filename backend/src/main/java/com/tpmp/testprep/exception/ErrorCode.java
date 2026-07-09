package com.tpmp.testprep.exception;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;

@Getter
@RequiredArgsConstructor
public enum ErrorCode {

    // Auth
    INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호가 올바르지 않습니다."),
    EMAIL_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    TOKEN_EXPIRED(HttpStatus.UNAUTHORIZED, "토큰이 만료되었습니다."),
    TOKEN_INVALID(HttpStatus.UNAUTHORIZED, "유효하지 않은 토큰입니다."),
    UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "인증이 필요합니다."),
    FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),

    // Exam
    EXAM_NOT_FOUND(HttpStatus.NOT_FOUND, "시험지를 찾을 수 없습니다."),
    QUESTION_NOT_FOUND(HttpStatus.NOT_FOUND, "문항을 찾을 수 없습니다."),
    EXAMINATION_NOT_FOUND(HttpStatus.NOT_FOUND, "시험을 찾을 수 없습니다."),
    DOMAIN_NOT_FOUND(HttpStatus.NOT_FOUND, "도메인 항목을 찾을 수 없습니다."),
    DOMAIN_IN_USE(HttpStatus.CONFLICT, "다른 데이터에서 참조 중인 항목입니다. 먼저 해당 항목의 참조를 제거하세요."),
    EXAM_HISTORY_NOT_FOUND(HttpStatus.NOT_FOUND, "시험 응시 이력을 찾을 수 없습니다."),
    QUOTE_NOT_FOUND(HttpStatus.NOT_FOUND, "명언을 찾을 수 없습니다."),
    SCHEDULING_DATA_INVALID(HttpStatus.BAD_REQUEST, "스케줄링 문제 데이터가 올바르지 않습니다. (알고리즘·프로세스 항목을 확인하세요)"),
    SQL_DATA_INVALID(HttpStatus.BAD_REQUEST, "SQL 문제 데이터가 올바르지 않습니다. (테이블·컬럼·행 데이터를 확인하세요)"),
    QUESTION_BODY_REQUIRED(HttpStatus.BAD_REQUEST, "발문 또는 문항 내용 중 하나는 입력해야 합니다."),
    QUESTION_NO_DUPLICATE(HttpStatus.CONFLICT, "동일한 시험 그룹에 이미 등록된 문항번호입니다."),

    // ConceptNote
    CONCEPT_NOTE_NOT_FOUND(HttpStatus.NOT_FOUND, "개념 요약을 찾을 수 없습니다."),
    CONCEPT_NOTE_ACCESS_DENIED(HttpStatus.FORBIDDEN, "해당 개념 요약에 접근할 수 없습니다."),

    // User
    USER_NOT_FOUND(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."),
    BOOKMARK_NOT_FOUND(HttpStatus.NOT_FOUND, "복습 표시 항목을 찾을 수 없습니다."),
    NICKNAME_ALREADY_EXISTS(HttpStatus.CONFLICT, "이미 사용 중인 닉네임입니다."),

    // Inquiry
    INQUIRY_NOT_FOUND(HttpStatus.NOT_FOUND, "문의를 찾을 수 없습니다."),
    INQUIRY_ACCESS_DENIED(HttpStatus.FORBIDDEN, "해당 문의에 접근할 수 없습니다."),

    // FAQ
    FAQ_NOT_FOUND(HttpStatus.NOT_FOUND, "FAQ를 찾을 수 없습니다."),

    // File
    UNSUPPORTED_FILE_TYPE(HttpStatus.BAD_REQUEST, "지원하지 않는 파일 형식입니다. (PDF, HWP만 허용)"),
    FILE_SIZE_EXCEEDED(HttpStatus.BAD_REQUEST, "파일 크기가 허용 범위를 초과했습니다."),
    FILE_PARSE_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "파일 파싱에 실패했습니다."),

    // AI
    AI_SERVICE_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "AI 분석 서비스를 사용할 수 없습니다. API 키를 확인하세요."),
    AI_ANALYSIS_FAILED(HttpStatus.INTERNAL_SERVER_ERROR, "AI 분석에 실패했습니다. 잠시 후 다시 시도하세요."),

    // Notion 연동
    NOTION_NOT_CONFIGURED(HttpStatus.SERVICE_UNAVAILABLE, "Notion 연동이 서버에 설정되어 있지 않습니다. (client id/secret 필요)"),
    NOTION_NOT_CONNECTED(HttpStatus.BAD_REQUEST, "Notion 워크스페이스가 연결되어 있지 않습니다."),
    NOTION_OAUTH_FAILED(HttpStatus.UNAUTHORIZED, "Notion 인증에 실패했습니다."),
    NOTION_API_ERROR(HttpStatus.BAD_GATEWAY, "Notion API 호출에 실패했습니다."),

    // Common
    INVALID_INPUT(HttpStatus.BAD_REQUEST, "입력값이 올바르지 않습니다."),
    METHOD_NOT_ALLOWED(HttpStatus.METHOD_NOT_ALLOWED, "허용되지 않는 HTTP 메서드입니다."),
    INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "서버 오류가 발생했습니다.");

    private final HttpStatus status;
    private final String message;
}
