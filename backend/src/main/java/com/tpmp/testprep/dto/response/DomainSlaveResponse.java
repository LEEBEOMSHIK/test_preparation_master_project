package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.DomainSlave;

public record DomainSlaveResponse(Long id, Long masterId, String name, Integer displayOrder, boolean hasCodeQuestions) {

    /** 기존 호출부 하위 호환 — hasCodeQuestions는 기본 false */
    public static DomainSlaveResponse from(DomainSlave slave) {
        return from(slave, false);
    }

    /** hasCodeQuestions: 해당 슬레이브(카테고리)에 CODE 유형 문항이 존재하는지 여부 (데일리 퀴즈 프로그래밍 언어 필터 노출용) */
    public static DomainSlaveResponse from(DomainSlave slave, boolean hasCodeQuestions) {
        return new DomainSlaveResponse(
                slave.getId(),
                slave.getMaster().getId(),
                slave.getName(),
                slave.getDisplayOrder(),
                hasCodeQuestions
        );
    }
}
