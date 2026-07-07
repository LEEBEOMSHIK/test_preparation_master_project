package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.repository.DomainMasterRepository;
import com.tpmp.testprep.repository.QuestionBankRepository;
import com.tpmp.testprep.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * UserQuizService — 데일리 퀴즈 CODE(프로그래밍 언어) 카테고리 언어 필터 정규화 로직 단위 테스트.
 * getQuizQuestions(categoryId, limit, language)가 findRandomByCategory에 넘기는 language 파라미터가
 * null/공백/"ALL"(대소문자 무시)일 때 null로 정규화되고, 값이 있으면 trim만 되어 그대로 전달되는지 검증한다.
 */
@ExtendWith(MockitoExtension.class)
class UserQuizServiceTest {

    @Mock private DomainMasterRepository domainMasterRepository;
    @Mock private QuestionBankRepository questionBankRepository;
    @Mock private UserRepository userRepository;
    @Mock private QuizHistoryRecorder quizHistoryRecorder;

    private UserQuizService service;

    @BeforeEach
    void setUp() {
        service = new UserQuizService(domainMasterRepository, questionBankRepository, userRepository, quizHistoryRecorder);
        when(questionBankRepository.findRandomByCategory(anyLong(), anyInt(), any()))
                .thenReturn(Collections.<QuestionBank>emptyList());
    }

    /**
     * 한 테스트 메서드 안에서 여러 번 호출될 수 있으므로(예: language_all_caseInsensitive_normalizesToNull),
     * 정확히 1회 호출을 강제하는 verify() 대신 누적 호출을 허용하는 atLeastOnce()로 검증한다.
     * ArgumentCaptor는 매칭된 모든 호출을 시간순으로 누적 캡처하므로 getValue()는 가장 최근(=이번) 호출의
     * language 값을 반환한다.
     */
    private String capturedLanguage(Long categoryId, int limit, String language) {
        service.getQuizQuestions(categoryId, limit, language);
        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(questionBankRepository, atLeastOnce()).findRandomByCategory(anyLong(), anyInt(), captor.capture());
        return captor.getValue();
    }

    @Test
    @DisplayName("language가 null이면 필터 없이 null로 전달 (전체 조회, 기존 동작과 동일)")
    void language_null_passesNull() {
        assertThat(capturedLanguage(1L, 10, null)).isNull();
    }

    @Test
    @DisplayName("language가 공백 문자열이면 null로 정규화")
    void language_blank_normalizesToNull() {
        assertThat(capturedLanguage(1L, 10, "   ")).isNull();
    }

    @Test
    @DisplayName("language가 \"ALL\"이면 대소문자 무관하게 null로 정규화 (전체 선택)")
    void language_all_caseInsensitive_normalizesToNull() {
        assertThat(capturedLanguage(1L, 10, "ALL")).isNull();
        assertThat(capturedLanguage(1L, 10, "all")).isNull();
        assertThat(capturedLanguage(1L, 10, "All")).isNull();
    }

    @Test
    @DisplayName("language가 \"java\"이면 trim만 적용되어 그대로 전달")
    void language_java_passesThrough() {
        assertThat(capturedLanguage(1L, 10, "java")).isEqualTo("java");
        assertThat(capturedLanguage(1L, 10, "  python  ")).isEqualTo("python");
    }
}
