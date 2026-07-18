package com.tpmp.testprep.dto.request;

import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.entity.support.SchedulingData;
import com.tpmp.testprep.entity.support.SqlData;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * 문항 등록/수정 요청 DTO.
 * SQL Injection 방지: 모든 String 필드는 JPA 파라미터 바인딩으로 안전하게 처리됨.
 * code 필드(SQL/코드 문제)도 TEXT 컬럼에 값으로 저장되므로 SQL Injection 위험 없음.
 * sqlData(SQL 유형 테이블/컬럼/행 구조 데이터)도 값으로만 저장되며 실행되지 않으므로 SQL Injection 위험 없음.
 */
public record QuestionBankRequest(
        @Size(max = 200, message = "문항 제목은 200자를 초과할 수 없습니다.")
        String title,

        Integer examYear,

        Integer examRound,

        @Positive(message = "문항번호는 1 이상이어야 합니다.")
        Integer questionNo,

        /** 문항 내용 — 발문(instruction)과 합쳐 "둘 중 하나는 필수" 규칙 적용(서비스단 검증). 단독 @NotBlank는 제거. */
        @Size(max = 5000, message = "문항 내용은 5000자를 초과할 수 없습니다.")
        String content,

        /** 발문(지시문) — 문항 내용과 분리 저장, 모든 유형 공용. content와 마찬가지로 단독 필수는 아니며
         *  "발문 또는 내용 중 하나는 필수" 규칙을 서비스단(QuestionBankService#validateBody)에서 검증한다. */
        @Size(max = 1000, message = "발문은 1000자를 초과할 수 없습니다.")
        String instruction,

        @NotNull(message = "문항 유형은 필수입니다.")
        QuestionBank.QuestionType questionType,

        @NotNull(message = "문항 유형은 필수입니다.")
        Long categoryId,

        @NotNull(message = "시험 유형은 필수입니다.")
        Long examTypeId,

        List<String> options,

        @Size(max = 2000, message = "정답은 2000자를 초과할 수 없습니다.")
        String answer,

        @Size(max = 10000, message = "코드는 10000자를 초과할 수 없습니다.")
        String code,

        @Size(max = 50, message = "언어는 50자를 초과할 수 없습니다.")
        String language,

        @Size(max = 5000, message = "해설은 5000자를 초과할 수 없습니다.")
        String explanation,

        /** AI 분석 — 키워드 목록 (선택) */
        List<String> aiKeywords,

        /** AI 분석 — 도메인 목록 (선택) */
        List<String> aiDomains,

        /** AI 분석 — 난이도 (선택) */
        @Size(max = 10, message = "난이도는 10자를 초과할 수 없습니다.")
        String aiDifficulty,

        /** AI 분석 — 요약 (선택) */
        String aiSummary,

        /** CPU 스케줄링 구조화 데이터 (SCHEDULING 유형에서만 사용, 선택) */
        @Valid
        SchedulingData schedulingData,

        /** SQL 구조화 데이터 (SQL 유형에서만 사용, 선택) */
        @Valid
        SqlData sqlData,

        /** true면 정답 문자열의 {@code ||}를 대체 정답 구분자로 해석하지 않음(코드 조건의
         *  논리 OR 보호용). 기본값 false(생략 시 대체 정답 구분자로 해석하는 기존 동작 유지). */
        boolean disableAlternativeAnswer
) {}
