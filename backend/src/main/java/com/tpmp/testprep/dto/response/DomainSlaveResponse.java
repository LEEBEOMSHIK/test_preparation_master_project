package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.DomainSlave;

public record DomainSlaveResponse(Long id, Long masterId, String name, Integer displayOrder, boolean hasCodeQuestions, boolean hasAiCustomQuestions) {

    /** 기존 호출부 하위 호환 — hasCodeQuestions·hasAiCustomQuestions는 기본 false */
    public static DomainSlaveResponse from(DomainSlave slave) {
        return from(slave, false, false);
    }

    /** hasCodeQuestions: CODE 유형 문항 존재 여부, hasAiCustomQuestions: AI 커스텀 문항 존재 여부 (데일리 퀴즈 필터 노출용) */
    public static DomainSlaveResponse from(DomainSlave slave, boolean hasCodeQuestions, boolean hasAiCustomQuestions) {
        return new DomainSlaveResponse(
                slave.getId(),
                slave.getMaster().getId(),
                slave.getName(),
                slave.getDisplayOrder(),
                hasCodeQuestions,
                hasAiCustomQuestions
        );
    }
}
