package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.UserExaminationSearchRequest;
import com.tpmp.testprep.dto.response.UserExaminationFilterOptionsResponse;
import com.tpmp.testprep.repository.ExaminationRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserExaminationSearchServiceTest {

    @Mock private ExaminationRepository examinationRepository;
    @InjectMocks private UserExaminationService service;

    @Test
    void normalizesSearchTextAndPassesRepeatedInterestNamesToRepository() {
        PageRequest pageable = PageRequest.of(2, 5);
        UserExaminationSearchRequest request = new UserExaminationSearchRequest(
                "  기사  ", "정보처리기사", List.of("정보처리기사", "SQLD"),
                2025, 2, true);
        when(examinationRepository.searchActive(
                "기사", "정보처리기사", List.of("정보처리기사", "SQLD"), true,
                2025, 2, true, pageable))
                .thenReturn(org.springframework.data.domain.Page.empty(pageable));

        service.getExaminations(request, pageable);

        verify(examinationRepository).searchActive(
                "기사", "정보처리기사", List.of("정보처리기사", "SQLD"), true,
                2025, 2, true, pageable);
    }

    @Test
    void escapesLikeWildcardsSoTitleSearchKeepsLiteralIncludesMeaning() {
        PageRequest pageable = PageRequest.of(0, 5);
        UserExaminationSearchRequest request = new UserExaminationSearchRequest(
                "  100%_완료!  ", null, List.of(), null, null, null);
        when(examinationRepository.searchActive(
                "100!%!_완료!!", null, List.of("__NO_INTEREST_FILTER__"), false,
                null, null, null, pageable))
                .thenReturn(org.springframework.data.domain.Page.empty(pageable));

        service.getExaminations(request, pageable);

        verify(examinationRepository).searchActive(
                "100!%!_완료!!", null, List.of("__NO_INTEREST_FILTER__"), false,
                null, null, null, pageable);
    }

    @Test
    void keepsLegacyUnfilteredCallCompatible() {
        PageRequest pageable = PageRequest.of(0, 20);
        when(examinationRepository.searchActive(
                null, null, List.of("__NO_INTEREST_FILTER__"), false,
                null, null, null, pageable))
                .thenReturn(org.springframework.data.domain.Page.empty(pageable));

        service.getExaminations(pageable);

        verify(examinationRepository).searchActive(
                null, null, List.of("__NO_INTEREST_FILTER__"), false,
                null, null, null, pageable);
    }

    @Test
    void returnsDistinctOptionsFromEntireActiveExaminationSet() {
        when(examinationRepository.findActiveYears()).thenReturn(List.of(2025, 2024));
        when(examinationRepository.findActiveRounds()).thenReturn(List.of(3, 2, 1));

        UserExaminationFilterOptionsResponse result = service.getFilterOptions();

        assertThat(result.years()).containsExactly(2025, 2024);
        assertThat(result.rounds()).containsExactly(3, 2, 1);
    }
}
