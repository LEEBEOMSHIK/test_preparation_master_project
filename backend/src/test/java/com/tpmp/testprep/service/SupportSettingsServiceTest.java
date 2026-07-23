package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.SupportSettingsRequest;
import com.tpmp.testprep.dto.response.SupportSettingsResponse;
import com.tpmp.testprep.entity.SupportSettings;
import com.tpmp.testprep.repository.SupportSettingsRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.*;

/**
 * 단일 행(싱글톤) 설정이므로 조회 시 행이 없으면 자동 생성되는지,
 * 수정 시 기존 행을 갱신하는지(중복 행 생성 없음)를 검증한다.
 */
@ExtendWith(MockitoExtension.class)
class SupportSettingsServiceTest {

    @Mock private SupportSettingsRepository supportSettingsRepository;

    private SupportSettingsService service;

    @BeforeEach
    void setUp() {
        service = new SupportSettingsService(supportSettingsRepository);
    }

    @Test
    void getCreatesEmptyRowWhenNoneExists() {
        when(supportSettingsRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.empty());
        SupportSettings created = SupportSettings.builder().build();
        when(supportSettingsRepository.save(any(SupportSettings.class))).thenReturn(created);

        SupportSettingsResponse response = service.get();

        assertThat(response.tossUrl()).isNull();
        assertThat(response.kakaopayUrl()).isNull();
        assertThat(response.kakaoGiftUrl()).isNull();
        verify(supportSettingsRepository).save(any(SupportSettings.class));
    }

    @Test
    void getReturnsExistingRowWithoutCreatingNew() {
        SupportSettings existing = SupportSettings.builder()
                .tossUrl("https://toss.example/pay")
                .build();
        when(supportSettingsRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(existing));

        SupportSettingsResponse response = service.get();

        assertThat(response.tossUrl()).isEqualTo("https://toss.example/pay");
        verify(supportSettingsRepository, never()).save(any());
    }

    @Test
    void updateModifiesExistingRowInPlace() {
        SupportSettings existing = SupportSettings.builder().build();
        when(supportSettingsRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.of(existing));
        SupportSettingsRequest request = new SupportSettingsRequest(
                "https://toss.example/a", "https://kakaopay.example/b", "https://gift.kakao.example/c");

        SupportSettingsResponse response = service.update(request);

        assertThat(response.tossUrl()).isEqualTo("https://toss.example/a");
        assertThat(response.kakaopayUrl()).isEqualTo("https://kakaopay.example/b");
        assertThat(response.kakaoGiftUrl()).isEqualTo("https://gift.kakao.example/c");
        // 신규 저장이 아니라 기존 엔티티(existing)를 그대로 갱신했는지 확인
        verify(supportSettingsRepository, never()).save(any());
    }

    @Test
    void updateCreatesRowFirstWhenNoneExists() {
        when(supportSettingsRepository.findFirstByOrderByIdAsc()).thenReturn(Optional.empty());
        ArgumentCaptor<SupportSettings> captor = ArgumentCaptor.forClass(SupportSettings.class);
        when(supportSettingsRepository.save(captor.capture())).thenAnswer(inv -> inv.getArgument(0));
        SupportSettingsRequest request = new SupportSettingsRequest("https://toss.example/x", null, null);

        SupportSettingsResponse response = service.update(request);

        assertThat(response.tossUrl()).isEqualTo("https://toss.example/x");
        verify(supportSettingsRepository, times(1)).save(any(SupportSettings.class));
    }
}
