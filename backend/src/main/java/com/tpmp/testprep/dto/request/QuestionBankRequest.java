package com.tpmp.testprep.dto.request;

import com.tpmp.testprep.entity.QuestionBank;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

/**
 * 문항 등록/수정 요청 DTO.
 * SQL Injection 방지: 모든 String 필드는 JPA 파라미터 바인딩으로 안전하게 처리됨.
 * code 필드(SQL/코드 문제)도 TEXT 컬럼에 값으로 저장되므로 SQL Injection 위험 없음.
 */
public record QuestionBankRequest(
        @NotBlank(message = "문항 내용은 필수입니다.")
        @Size(max = 5000, message = "문항 내용은 5000자를 초과할 수 없습니다.")
        String content,

        @NotNull(message = "문항 유형은 필수입니다.")
        QuestionBank.QuestionType questionType,

        @NotNull(message = "카테고리는 필수입니다.")
        Long categoryId,

        List<String> options,

        @Size(max = 2000, message = "정답은 2000자를 초과할 수 없습니다.")
        String answer,

        @Size(max = 10000, message = "코드는 10000자를 초과할 수 없습니다.")
        String code,

        @Size(max = 50, message = "언어는 50자를 초과할 수 없습니다.")
        String language,

        @Size(max = 5000, message = "해설은 5000자를 초과할 수 없습니다.")
        String explanation
) {}
