package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.request.DomainMasterRequest;
import com.tpmp.testprep.dto.request.DomainSlaveRequest;
import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.DomainMasterResponse;
import com.tpmp.testprep.dto.response.DomainSlaveResponse;
import com.tpmp.testprep.service.DomainService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/domains")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminDomainController {

    private final DomainService domainService;

    // ── 마스터 ──────────────────────────────────────────────────────────────────

    /** 도메인 마스터 + 슬레이브 전체 조회 */
    @GetMapping
    public ResponseEntity<ApiResponse<List<DomainMasterResponse>>> getDomains() {
        return ResponseEntity.ok(ApiResponse.success(domainService.getAllMasters()));
    }

    /** 도메인 마스터 생성 */
    @PostMapping("/masters")
    public ResponseEntity<ApiResponse<DomainMasterResponse>> createMaster(
            @Valid @RequestBody DomainMasterRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(domainService.createMaster(request.name())));
    }

    /** 도메인 마스터 이름 수정 */
    @PutMapping("/masters/{masterId}")
    public ResponseEntity<ApiResponse<DomainMasterResponse>> updateMaster(
            @PathVariable Long masterId,
            @Valid @RequestBody DomainMasterRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                domainService.updateMaster(masterId, request.name())));
    }

    /** 도메인 마스터 삭제 (슬레이브 포함 cascade) */
    @DeleteMapping("/masters/{masterId}")
    public ResponseEntity<ApiResponse<Void>> deleteMaster(@PathVariable Long masterId) {
        domainService.deleteMaster(masterId);
        return ResponseEntity.ok(ApiResponse.success());
    }

    // ── 슬레이브 ─────────────────────────────────────────────────────────────────

    /** 슬레이브 추가 */
    @PostMapping("/masters/{masterId}/slaves")
    public ResponseEntity<ApiResponse<DomainSlaveResponse>> createSlave(
            @PathVariable Long masterId,
            @Valid @RequestBody DomainSlaveRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success(
                        domainService.createSlave(masterId, request.name(), request.displayOrder())));
    }

    /** 슬레이브 수정 */
    @PutMapping("/masters/{masterId}/slaves/{slaveId}")
    public ResponseEntity<ApiResponse<DomainSlaveResponse>> updateSlave(
            @PathVariable Long masterId,
            @PathVariable Long slaveId,
            @Valid @RequestBody DomainSlaveRequest request) {
        return ResponseEntity.ok(ApiResponse.success(
                domainService.updateSlave(masterId, slaveId, request.name(), request.displayOrder())));
    }

    /** 슬레이브 삭제 */
    @DeleteMapping("/masters/{masterId}/slaves/{slaveId}")
    public ResponseEntity<ApiResponse<Void>> deleteSlave(
            @PathVariable Long masterId,
            @PathVariable Long slaveId) {
        domainService.deleteSlave(masterId, slaveId);
        return ResponseEntity.ok(ApiResponse.success());
    }
}
