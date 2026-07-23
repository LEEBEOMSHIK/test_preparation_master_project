package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.SupportSettingsRequest;
import com.tpmp.testprep.dto.response.SupportSettingsResponse;
import com.tpmp.testprep.entity.SupportSettings;
import com.tpmp.testprep.repository.SupportSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * 개발자 응원하기(후원) 링크 단일 행 설정 관리.
 * 행이 없으면 조회 시 빈 값으로 자동 생성한다(관대한 처리 — 별도 초기화 실패로 사용자 화면이 막히지 않도록).
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SupportSettingsService {

    private final SupportSettingsRepository supportSettingsRepository;

    public SupportSettingsResponse get() {
        return SupportSettingsResponse.from(findOrCreate());
    }

    @Transactional
    public SupportSettingsResponse update(SupportSettingsRequest request) {
        SupportSettings settings = findOrCreate();
        settings.update(request.tossUrl(), request.kakaopayUrl(), request.kakaoGiftUrl());
        return SupportSettingsResponse.from(settings);
    }

    @Transactional
    protected SupportSettings findOrCreate() {
        return supportSettingsRepository.findFirstByOrderByIdAsc()
                .orElseGet(() -> supportSettingsRepository.save(SupportSettings.builder().build()));
    }
}
