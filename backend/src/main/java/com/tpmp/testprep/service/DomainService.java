package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.DomainMasterResponse;
import com.tpmp.testprep.dto.response.DomainSlaveResponse;
import com.tpmp.testprep.entity.DomainMaster;
import com.tpmp.testprep.entity.DomainSlave;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.DomainMasterRepository;
import com.tpmp.testprep.repository.DomainSlaveRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DomainService {

    private final DomainMasterRepository domainMasterRepository;
    private final DomainSlaveRepository domainSlaveRepository;

    public List<DomainMasterResponse> getAllMasters() {
        return domainMasterRepository.findAllWithSlaves()
                .stream()
                .map(DomainMasterResponse::from)
                .toList();
    }

    @Transactional
    public DomainMasterResponse createMaster(String name) {
        DomainMaster master = domainMasterRepository.save(
                DomainMaster.builder().name(name).build());
        return DomainMasterResponse.from(master);
    }

    @Transactional
    public DomainMasterResponse updateMaster(Long masterId, String name) {
        DomainMaster master = findMasterById(masterId);
        master.updateName(name);
        return DomainMasterResponse.from(master);
    }

    @Transactional
    public void deleteMaster(Long masterId) {
        DomainMaster master = findMasterById(masterId);
        domainMasterRepository.delete(master);
    }

    @Transactional
    public DomainSlaveResponse createSlave(Long masterId, String name, Integer displayOrder) {
        DomainMaster master = findMasterById(masterId);
        DomainSlave slave = domainSlaveRepository.save(DomainSlave.builder()
                .master(master)
                .name(name)
                .displayOrder(displayOrder)
                .build());
        return DomainSlaveResponse.from(slave);
    }

    @Transactional
    public DomainSlaveResponse updateSlave(Long masterId, Long slaveId, String name, Integer displayOrder) {
        findMasterById(masterId); // verify master exists
        DomainSlave slave = findSlaveById(slaveId);
        if (!slave.getMaster().getId().equals(masterId))
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        slave.update(name, displayOrder);
        return DomainSlaveResponse.from(slave);
    }

    @Transactional
    public void deleteSlave(Long masterId, Long slaveId) {
        findMasterById(masterId); // verify master exists
        DomainSlave slave = findSlaveById(slaveId);
        if (!slave.getMaster().getId().equals(masterId))
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        domainSlaveRepository.delete(slave);
    }

    // ── private helpers ─────────────────────────────────────────────────────────

    private DomainMaster findMasterById(Long id) {
        return domainMasterRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOMAIN_NOT_FOUND));
    }

    private DomainSlave findSlaveById(Long id) {
        return domainSlaveRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOMAIN_NOT_FOUND));
    }
}
