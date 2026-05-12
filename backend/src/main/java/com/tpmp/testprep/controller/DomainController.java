package com.tpmp.testprep.controller;

import com.tpmp.testprep.dto.response.ApiResponse;
import com.tpmp.testprep.dto.response.DomainSlaveResponse;
import com.tpmp.testprep.service.DomainService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/domains")
@RequiredArgsConstructor
public class DomainController {

    private final DomainService domainService;

    /** 코드로 도메인 슬레이브 목록 조회 (인증 사용자 공통) */
    @GetMapping("/slaves")
    public ResponseEntity<ApiResponse<List<DomainSlaveResponse>>> getSlavesByCode(
            @RequestParam String code) {
        return ResponseEntity.ok(ApiResponse.success(domainService.getSlavesByCode(code)));
    }
}
