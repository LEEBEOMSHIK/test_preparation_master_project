package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.CheckRequest;
import com.tpmp.testprep.dto.response.CheckResult;
import com.tpmp.testprep.dto.response.DomainMasterResponse;
import com.tpmp.testprep.dto.response.DomainSlaveResponse;
import com.tpmp.testprep.dto.response.QuizQuestionView;
import com.tpmp.testprep.entity.DomainMaster;
import com.tpmp.testprep.entity.DomainSlave;
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
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * UserQuizService — 데일리 퀴즈 CODE(프로그래밍 언어) 카테고리 언어 필터 및 출처(EXAM/AI_CUSTOM) 필터
 * 정규화 로직 단위 테스트 + 복습 표시(북마크) 재풀이용 문항 조회 단위 테스트.
 * getQuizQuestions(categoryId, limit, language, source, excludeIds)가 findRandomByCategory에 넘기는 language/source
 * 파라미터가 각각의 정규화 규칙(공백·"ALL"·정의되지 않은 값 → null)을 따르는지 검증하고,
 * excludeIds 유무에 따라 findRandomByCategory / findRandomByCategoryExcluding으로 올바르게 분기하는지 검증한다.
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
        service.getQuizQuestions(categoryId, limit, language, null, null);
        ArgumentCaptor<String> captor = ArgumentCaptor.forClass(String.class);
        verify(questionBankRepository, atLeastOnce()).findRandomByCategory(anyLong(), anyInt(), captor.capture(), any());
        return captor.getValue();
    }

    /** capturedLanguage와 동일 패턴 — language는 null 고정, source만 캡처 */
    private String capturedSource(Long categoryId, int limit, String source) {
        service.getQuizQuestions(categoryId, limit, null, source, null);
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
    @DisplayName("excludeIds가 있으면 findRandomByCategoryExcluding을 호출하고, 공백/비정상 토큰은 무시하며 중복은 제거해서 전달(최대 500개)")
    void excludeIds_withValues_usesExcludingMethod_andParsesTokens() {
        when(questionBankRepository.findRandomByCategoryExcluding(anyLong(), anyInt(), any(), any(), any()))
                .thenReturn(Collections.<QuestionBank>emptyList());

        service.getQuizQuestions(1L, 10, null, null, " 1, 2,abc,2, ,3 ");

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<Long>> captor = ArgumentCaptor.forClass(List.class);
        verify(questionBankRepository).findRandomByCategoryExcluding(anyLong(), anyInt(), any(), any(), captor.capture());
        assertThat(captor.getValue()).containsExactlyInAnyOrder(1L, 2L, 3L);
        verify(questionBankRepository, never()).findRandomByCategory(anyLong(), anyInt(), any(), any());
    }

    @Test
    @DisplayName("excludeIds가 비어있거나 공백뿐이면 기존 findRandomByCategory를 그대로 호출(빈 리스트 IN() 오류 회피)")
    void excludeIds_blank_usesFindRandomByCategory() {
        service.getQuizQuestions(1L, 10, null, null, "   ");

        verify(questionBankRepository, atLeastOnce()).findRandomByCategory(anyLong(), anyInt(), any(), any());
        verify(questionBankRepository, never())
                .findRandomByCategoryExcluding(anyLong(), anyInt(), any(), any(), any());
    }

    /**
     * getCategories의 hasCodeQuestions 플래그는 questionBankRepository.findDistinctCategoryIdsByQuestionType(CODE)가
     * 반환한 카테고리 ID 집합을 그대로 반영한다. language='sql'인 CODE 문항만 있는 카테고리는 해당 리포지토리
     * 메서드가 이제 제외하고 반환하므로(QuestionBankRepository 수정), 그 결과를 서비스가 올바르게
     * hasCodeQuestions=false로 소비하는지 검증한다(리포지토리 JPQL 자체는 이 단위 테스트 범위 밖 — 여기서는
     * 수정된 리포지토리 동작을 시뮬레이션한 반환값을 스터빙해 서비스 매핑 로직만 검증한다).
     */
    @Test
    @DisplayName("getCategories: sql 전용 CODE 카테고리는 hasCodeQuestions=false, 일반 언어 CODE 카테고리는 true")
    void getCategories_sqlOnlyCodeCategory_hasCodeQuestionsFalse() {
        DomainMaster questionTypeMaster = DomainMaster.builder().code("QUESTION_TYPE").name("문제 유형").build();
        ReflectionTestUtils.setField(questionTypeMaster, "id", 100L);

        DomainSlave javaCodeSlave = DomainSlave.builder().master(questionTypeMaster).name("자료구조").displayOrder(1).build();
        ReflectionTestUtils.setField(javaCodeSlave, "id", 1L);
        DomainSlave sqlOnlySlave = DomainSlave.builder().master(questionTypeMaster).name("SQL").displayOrder(2).build();
        ReflectionTestUtils.setField(sqlOnlySlave, "id", 2L);
        ReflectionTestUtils.setField(questionTypeMaster, "slaves", List.of(javaCodeSlave, sqlOnlySlave));

        when(domainMasterRepository.findAllWithSlaves()).thenReturn(List.of(questionTypeMaster));
        // 수정된 findDistinctCategoryIdsByQuestionType은 language='sql'인 CODE 문항만 있는 카테고리(id=2)를 제외하고
        // id=1(java 등 일반 언어 CODE 문항 보유 카테고리)만 반환한다고 가정
        when(questionBankRepository.findDistinctCategoryIdsByQuestionType(QuestionBank.QuestionType.CODE))
                .thenReturn(List.of(1L));
        when(questionBankRepository.findDistinctCategoryIdsWithAiCustomQuestions())
                .thenReturn(Collections.<Long>emptyList());

        List<DomainMasterResponse> result = service.getCategories(null);

        DomainMasterResponse questionTypeResponse = result.stream()
                .filter(r -> "QUESTION_TYPE".equals(r.code()))
                .findFirst()
                .orElseThrow();

        assertThat(questionTypeResponse.slaves())
                .filteredOn(s -> s.id().equals(1L))
                .extracting(DomainSlaveResponse::hasCodeQuestions)
                .containsExactly(true);
        assertThat(questionTypeResponse.slaves())
                .filteredOn(s -> s.id().equals(2L))
                .extracting(DomainSlaveResponse::hasCodeQuestions)
                .containsExactly(false);
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

    // -----------------------------------------------------------------------
    // checkAnswer — disableAlternativeAnswer 플래그가 AnswerGrader·CheckResult로 전파되는지 검증
    // -----------------------------------------------------------------------

    @Test
    @DisplayName("checkAnswer: 문항의 disableAlternativeAnswer=true면 코드 조건 || 정답을 통째로 채점하고 CheckResult에도 플래그가 그대로 실린다")
    void checkAnswer_disableAlternativeAnswerTrue_gradesWholeAnswerAndPropagatesFlag() {
        String answer = "① int a = 0 / ② a < m || b[a] < x / ③ b[a] < 0";
        QuestionBank qb = QuestionBank.builder()
                .questionType(QuestionBank.QuestionType.SHORT_ANSWER)
                .content("문항 내용")
                .answer(answer)
                .disableAlternativeAnswer(true)
                .build();
        ReflectionTestUtils.setField(qb, "id", 75L);
        when(questionBankRepository.findById(75L)).thenReturn(Optional.of(qb));

        CheckResult exactMatch = service.checkAnswer(new CheckRequest(75L, answer), USER_EMAIL);
        assertThat(exactMatch.correct()).isTrue();
        assertThat(exactMatch.disableAlternativeAnswer()).isTrue();

        // 플래그 ON이므로 ||로 쪼개진 부분 답("int a = 0"만 입력)은 오답 처리되어야 한다.
        CheckResult partialMatch = service.checkAnswer(new CheckRequest(75L, "int a = 0"), USER_EMAIL);
        assertThat(partialMatch.correct()).isFalse();
    }

    @Test
    @DisplayName("checkAnswer: disableAlternativeAnswer=false(기본값)면 기존처럼 CheckResult 플래그도 false")
    void checkAnswer_disableAlternativeAnswerFalse_flagPropagatesAsFalse() {
        QuestionBank qb = QuestionBank.builder()
                .questionType(QuestionBank.QuestionType.SHORT_ANSWER)
                .content("문항 내용")
                .answer("정답")
                .build();
        ReflectionTestUtils.setField(qb, "id", 10L);
        when(questionBankRepository.findById(10L)).thenReturn(Optional.of(qb));

        CheckResult result = service.checkAnswer(new CheckRequest(10L, "정답"), USER_EMAIL);

        assertThat(result.correct()).isTrue();
        assertThat(result.disableAlternativeAnswer()).isFalse();
    }
}
