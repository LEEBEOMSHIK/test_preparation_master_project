package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.DomainSlave;

public record DomainSlaveResponse(Long id, Long masterId, String name, Integer displayOrder) {

    public static DomainSlaveResponse from(DomainSlave slave) {
        return new DomainSlaveResponse(
                slave.getId(),
                slave.getMaster().getId(),
                slave.getName(),
                slave.getDisplayOrder()
        );
    }
}
