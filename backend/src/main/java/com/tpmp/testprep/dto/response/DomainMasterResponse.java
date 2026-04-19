package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.DomainMaster;

import java.util.List;

public record DomainMasterResponse(Long id, String name, List<DomainSlaveResponse> slaves) {

    public static DomainMasterResponse from(DomainMaster master) {
        return new DomainMasterResponse(
                master.getId(),
                master.getName(),
                master.getSlaves().stream().map(DomainSlaveResponse::from).toList()
        );
    }
}
