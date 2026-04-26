package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.PermissionDetailRequest;
import com.tpmp.testprep.dto.request.PermissionMasterRequest;
import com.tpmp.testprep.dto.response.PermissionDetailResponse;
import com.tpmp.testprep.dto.response.PermissionMasterResponse;
import com.tpmp.testprep.entity.PermissionDetail;
import com.tpmp.testprep.entity.PermissionMaster;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.PermissionDetailRepository;
import com.tpmp.testprep.repository.PermissionMasterRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PermissionService {

    private final PermissionMasterRepository masterRepository;
    private final PermissionDetailRepository detailRepository;

    public List<PermissionMasterResponse> getAllMasters() {
        return masterRepository.findAll().stream()
                .map(PermissionMasterResponse::from)
                .toList();
    }

    public PermissionMasterResponse getMaster(Long id) {
        return PermissionMasterResponse.from(findMaster(id));
    }

    @Transactional
    public PermissionMasterResponse createMaster(PermissionMasterRequest request) {
        if (masterRepository.existsByCode(request.code())) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        PermissionMaster master = PermissionMaster.builder()
                .code(request.code())
                .name(request.name())
                .description(request.description())
                .build();
        return PermissionMasterResponse.from(masterRepository.save(master));
    }

    @Transactional
    public PermissionMasterResponse updateMaster(Long id, PermissionMasterRequest request) {
        PermissionMaster master = findMaster(id);
        master.update(request.name(), request.description());
        return PermissionMasterResponse.from(master);
    }

    @Transactional
    public void deleteMaster(Long id) {
        masterRepository.delete(findMaster(id));
    }

    @Transactional
    public PermissionDetailResponse createDetail(PermissionDetailRequest request) {
        PermissionMaster master = findMaster(request.masterId());
        PermissionDetail detail = PermissionDetail.builder()
                .master(master)
                .name(request.name())
                .description(request.description())
                .build();
        return PermissionDetailResponse.from(detailRepository.save(detail));
    }

    @Transactional
    public PermissionDetailResponse updateDetail(Long id, PermissionDetailRequest request) {
        PermissionDetail detail = detailRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));
        detail.update(request.name(), request.description());
        return PermissionDetailResponse.from(detail);
    }

    @Transactional
    public void deleteDetail(Long id) {
        PermissionDetail detail = detailRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));
        detailRepository.delete(detail);
    }

    private PermissionMaster findMaster(Long id) {
        return masterRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));
    }
}
