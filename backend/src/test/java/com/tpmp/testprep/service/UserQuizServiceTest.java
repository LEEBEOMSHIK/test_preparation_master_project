package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.QuizQuestionView;
import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.entity.UserQuestionBookmark;
import com.tpmp.testprep.repository.DomainMasterRepository;
import com.tpmp.testprep.repository.QuestionBankRepository;
import com.tpmp.testprep.repository.UserQuestionBookmarkRepository;
import com.tpmp.testprep.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * UserQuizService — 데일리 퀴즈 CODE(프로그래밍 언어) 카테고리 언어 필터 및 출처(EXAM/AI_CUSTOM) 필터
 * 정규화 로직 단위 테스트 + 복습 표시(북마크) 재풀이용 문항 조회 단위 테스트.
 * getQuizQuestions(categoryId, limit, language, source)가 findRandomByCategory에 넘기는 language/source
 * 파라미터가 각각의 정규화 규칙(공백·"ALL"·정의되지 않은 값 → null)을 따르는지 검증한다.
 */
@ExtendWith(MockitoExtension.class)
class UserQuizServiceTest {

    @Mock private DomainMasterRepository domainMasterRepository;
    @Mock private QuestionBankRepository questionBankRepository;
    @Mock private UserRepository userRepository;
    @Mock private QuizHistoryRecorder quizHistoryRecorder;
    @Mock private UserQuestionBookmarkRepository userQuestionBookmarkRepository;
    @Mock private User mockUser;

    private UserQuizService service;

    private static final String USER_EMAIL = "user@tpmp.com";

    @BeforeEach
    void setUp() {
        service = new UserQuizService(domainMasterRepository, questionBankRepository, userRepository, quizHistoryRecorder, userQuestionBookmarkRepository);
        // findRandomByCategory는 language/source 정규화 테스트에서만 사용되므로, 북마크 테스트에서는
        // 불필요한 스터빙으로 strict-stub 검증에 걸리지 않도록 lenient 처리한다.
        lenient().when(questionBankRepository.findRandomByCategory(anyLong(), anyInt(), any(), any()))
                .thenReturn(Collections.<QuestionBank>emptyList());
        lenient().when(userRepository.findByEmail(USER_EMAIL)).thenReturn(Optional.of(mockUser));
        lenient().when(mockUser.getId()).thenReturn(1L);
    }

    /**
     * 한 테스트 메서드 안에서 여러 번 호출될 수 있으므로(예: language_all_caseInsensitive_normalizesToNull),
     * 정확히 1회 호출을 강제하는 verify() 대신 누적 호출을 허용하는 atLeastOnce()로 검증한다.
     * ArgumentCaptor는 매칭된 모든 호출을 시간순으로 누적 캡처하므로 getValue()는 가장 최근(=이번) 호출의
     * language 값을 반환한다.
     */
    private String capturedLanguage(Long categoryId, int limit, String language) {
        service.getQuizQuestions(categoryId, limit, language, null);
        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(questionBankRepository, atLeastOnce()).findRandomByCategory(anyLong(), anyInt(), captor.capture(), any());
        return captor.getValue();
    }

    /** capturedLanguage와 동일 패턴 — language는 null 고정, source만 캡처 */
    private String capturedSource(Long categoryId, int limit, String source) {
        service.getQuizQuestions(categoryId, limit, null, source);
        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(questionBankRepository, atLeastOnce()).findRandomByCategory(anyLong(), anyInt(), any(), captor.capture());
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

    @Test
    @DisplayName("source가 null이면 필터 없이 null로 전달 (전체 조회)")
    void source_null_passesNull() {
        assertThat(capturedSource(1L, 10, null)).isNull();
    }

    @Test
    @DisplayName("source가 공백 문자열이면 null로 정규화")
    void source_blank_normalizesToNull() {
        assertThat(capturedSource(1L, 10, "   ")).isNull();
    }

    @Test
    @DisplayName("source가 \"ALL\"이면 대소문자 무관하게 null로 정규화 (전체 선택)")
    void source_all_caseInsensitive_normalizesToNull() {
        assertThat(capturedSource(1L, 10, "ALL")).isNull();
        assertThat(capturedSource(1L, 10, "all")).isNull();
    }

    @Test
    @DisplayName("source가 \"ai_custom\"/\"EXAM\"이면 대소문자 무관하게 정규화되어 전달")
    void source_validValues_normalizesCase() {
        assertThat(capturedSource(1L, 10, "ai_custom")).isEqualTo("AI_CUSTOM");
        assertThat(capturedSource(1L, 10, "AI_CUSTOM")).isEqualTo("AI_CUSTOM");
        assertThat(capturedSource(1L, 10, "exam")).isEqualTo("EXAM");
        assertThat(capturedSource(1L, 10, "EXAM")).isEqualTo("EXAM");
    }

    @Test
    @DisplayName("source가 정의되지 않은 값이면 필터 없이 null로 전달")
    void source_invalidValue_normalizesToNull() {
        assertThat(capturedSource(1L, 10, "INVALID")).isNull();
    }

    @Test
    @DisplayName("복습 표시(북마크)한 문항이 없으면 빈 목록 반환")
    void getBookmarkedQuestions_noBookmarks_returnsEmptyList() {
        when(userQuestionBookmarkRepository.findAllByUserIdWithQuestion(1L))
                .thenReturn(Collections.<UserQuestionBookmark>emptyList());

        List<QuizQuestionView> result = service.getBookmarkedQuestions(USER_EMAIL);

        assertThat(result).isEmpty();
    }

    @Test
    @DisplayName("복습 표시한 문항이 있으면 정답을 노출하지 않는 QuizQuestionView 목록으로 매핑")
    void getBookmarkedQuestions_withBookmarks_mapsToQuizQuestionViewWithoutAnswer() {
        QuestionBank qb = QuestionBank.builder()
                .questionType(QuestionBank.QuestionType.SHORT_ANSWER)
                .content("문항 내용")
                .answer("정답")
                .build();
        UserQuestionBookmark bookmark = UserQuestionBookmark.builder()
                .user(mockUser)
                .questionBank(qb)
                .build();
        when(userQuestionBookmarkRepository.findAllByUserIdWithQuestion(1L))
                .thenReturn(List.of(bookmark));

        List<QuizQuestionView> result = service.getBookmarkedQuestions(USER_EMAIL);

        assertThat(result).hasSize(1);
        assertThat(result.get(0).content()).isEqualTo("문항 내용");
    }
}
