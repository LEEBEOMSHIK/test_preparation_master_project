package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.PermissionDetailRequest;
import com.tpmp.testprep.dto.request.PermissionMasterRequest;
import com.tpmp.testprep.dto.response.PermissionDetailResponse;
import com.tpmp.testprep.dto.response.PermissionMasterResponse;
import com.tpmp.testprep.entity.PermissionDetail;
import com.tpmp.testprep.entity.PermissionMaster;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.repository.PermissionDetailRepository;
import com.tpmp.testprep.repository.PermissionMasterRepository;
import com.tpmp.testprep.repository.UserRepository;
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
    private final MenuConfigService menuConfigService;
    private final UserRepository userRepository;

    public List<PermissionMasterResponse> getAllMasters() {
        return masterRepository.findAll().stream()
                .map(m -> {
                    List<PermissionDetailResponse> details = m.getDetails().stream()
                            .map(d -> PermissionDetailResponse.from(d,
                                    d.getCode() != null && !d.getCode().isBlank()
                                            ? menuConfigService.getMenuIdsByPermissionCode(d.getCode())
                                            : List.of()))
                            .toList();
                    return PermissionMasterResponse.from(
                            m,
                            menuConfigService.getMenuIdsByPermissionCode(m.getCode()),
                            countUsersByCode(m.getCode()),
                            details);
                })
                .toList();
    }

    public PermissionMasterResponse getMaster(Long id) {
        PermissionMaster m = findMaster(id);
        return PermissionMasterResponse.from(m,
                menuConfigService.getMenuIdsByPermissionCode(m.getCode()),
                countUsersByCode(m.getCode()));
    }

    public List<Long> getMenuIds(Long masterId) {
        PermissionMaster master = findMaster(masterId);
        return menuConfigService.getMenuIdsByPermissionCode(master.getCode());
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
                .scope(request.scope())
                .build();
        PermissionMaster saved = masterRepository.save(master);
        return PermissionMasterResponse.from(saved, List.of(), 0L);
    }

    @Transactional
    public PermissionMasterResponse updateMaster(Long id, PermissionMasterRequest request) {
        PermissionMaster master = findMaster(id);
        master.update(request.name(), request.description());
        return PermissionMasterResponse.from(master,
                menuConfigService.getMenuIdsByPermissionCode(master.getCode()),
                countUsersByCode(master.getCode()));
    }

    private long countUsersByCode(String code) {
        try {
            User.Role role = User.Role.valueOf(code);
            return userRepository.countByRole(role);
        } catch (IllegalArgumentException e) {
            return 0L;
        }
    }

    @Transactional
    public void deleteMaster(Long id) {
        masterRepository.delete(findMaster(id));
    }

    @Transactional
    public void updateMenuAccess(Long masterId, List<Long> menuIds) {
        PermissionMaster master = findMaster(masterId);
        menuConfigService.updatePermissionMenus(master.getCode(), menuIds);
    }

    @Transactional
    public PermissionDetailResponse createDetail(PermissionDetailRequest request) {
        PermissionMaster master = findMaster(request.masterId());
        PermissionDetail detail = PermissionDetail.builder()
                .master(master)
                .name(request.name())
                .description(request.description())
                .code(request.code())
                .build();
        return PermissionDetailResponse.from(detailRepository.save(detail));
    }

    @Transactional
    public PermissionDetailResponse updateDetail(Long id, PermissionDetailRequest request) {
        PermissionDetail detail = detailRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));
        detail.update(request.name(), request.description(), request.code());
        return PermissionDetailResponse.from(detail);
    }

    @Transactional
    public void deleteDetail(Long id) {
        detailRepository.delete(findDetail(id));
    }

    public List<Long> getDetailMenuIds(Long detailId) {
        PermissionDetail detail = findDetail(detailId);
        if (detail.getCode() == null || detail.getCode().isBlank()) return List.of();
        return menuConfigService.getMenuIdsByPermissionCode(detail.getCode());
    }

    @Transactional
    public void updateDetailMenuAccess(Long detailId, List<Long> menuIds) {
        PermissionDetail detail = findDetail(detailId);
        if (detail.getCode() == null || detail.getCode().isBlank()) return;
        menuConfigService.updatePermissionMenus(detail.getCode(), menuIds);
    }

    private PermissionMaster findMaster(Long id) {
        return masterRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));
    }

    private PermissionDetail findDetail(Long id) {
        return detailRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));
    }
}
