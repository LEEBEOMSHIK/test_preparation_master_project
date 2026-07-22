package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.DomainMasterResponse;
import com.tpmp.testprep.dto.response.DomainSlaveResponse;
import com.tpmp.testprep.entity.DomainMaster;
import com.tpmp.testprep.entity.DomainSlave;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.DomainMasterRepository;
import com.tpmp.testprep.repository.DomainSlaveRepository;
import com.tpmp.testprep.repository.ExaminationRepository;
import com.tpmp.testprep.repository.QuestionBankRepository;
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
    private final QuestionBankRepository questionBankRepository;
    private final ExaminationRepository examinationRepository;

    public List<DomainMasterResponse> getAllMasters() {
        return domainMasterRepository.findAllWithSlaves()
                .stream()
                .map(DomainMasterResponse::from)
                .toList();
    }

    public List<DomainSlaveResponse> getSlavesByCode(String code) {
        DomainMaster master = domainMasterRepository.findByCode(code)
                .orElseThrow(() -> new BusinessException(ErrorCode.DOMAIN_NOT_FOUND));
        return master.getSlaves().stream()
                .map(DomainSlaveResponse::from)
                .toList();
    }

    @Transactional
    public DomainMasterResponse createMaster(String code, String name) {
        DomainMaster master = domainMasterRepository.save(
                DomainMaster.builder().code(code).name(name).build());
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
        boolean anyInUse = master.getSlaves().stream()
                .anyMatch(s -> isSlaveInUse(s.getId()));
        if (anyInUse) throw new BusinessException(ErrorCode.DOMAIN_IN_USE);
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
        if (isSlaveInUse(slaveId))
            throw new BusinessException(ErrorCode.DOMAIN_IN_USE);
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

    private boolean isSlaveInUse(Long slaveId) {
        return questionBankRepository.existsByCategoryIdOrExamTypeId(slaveId, slaveId)
                || examinationRepository.existsByCategoryIdAndDelYn(slaveId, "N");
    }
}
