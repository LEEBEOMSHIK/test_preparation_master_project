package com.tpmp.testprep.service.parser;

import com.tpmp.testprep.entity.Question;

import java.util.List;

/**
 * PDF 파싱 중간 표현체.
 * Bean Validation 어노테이션 없음 — 순수 데이터 홀더.
 */
public record ParsedQuestion(
        String content,
        Question.QuestionType questionType,
        List<String> options,
        String answer,
        String explanation
) {}
