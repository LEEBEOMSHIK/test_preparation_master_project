package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.entity.support.SchedulingData;
import com.tpmp.testprep.entity.support.SqlData;

import java.time.LocalDateTime;
import java.util.List;

public record QuestionBankResponse(
        Long id,
        String title,
        Integer examYear,
        Integer examRound,
        Integer questionNo,
        String content,
        /** 발문(지시문) — 문항 내용과 분리 저장 (선택, 없으면 null) */
        String instruction,
        String questionType,
        Long categoryId,
        String categoryName,
        Long examTypeId,
        String examTypeName,
        List<String> options,
        String answer,
        String code,
        String language,
        String explanation,
        List<String> aiKeywords,
        List<String> aiDomains,
        String aiDifficulty,
        String aiSummary,
        SchedulingData schedulingData,
        SqlData sqlData,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static QuestionBankResponse from(QuestionBank qb) {
        return new QuestionBankResponse(
                qb.getId(),
                qb.getTitle(),
                qb.getExamYear(),
                qb.getExamRound(),
                qb.getQuestionNo(),
                qb.getContent(),
                qb.getInstruction(),
                qb.getQuestionType().name(),
                qb.getCategory() != null ? qb.getCategory().getId() : null,
                qb.getCategory() != null ? qb.getCategory().getName() : null,
                qb.getExamType() != null ? qb.getExamType().getId() : null,
                qb.getExamType() != null ? qb.getExamType().getName() : null,
                qb.getOptions(),
                qb.getAnswer(),
                qb.getCode(),
                qb.getLanguage(),
                qb.getExplanation(),
                qb.getAiKeywords(),
                qb.getAiDomains(),
                qb.getAiDifficulty(),
                qb.getAiSummary(),
                qb.getSchedulingData(),
                qb.getSqlData(),
                qb.getCreateDt(),
                qb.getModifiedDt()
        );
    }
}
