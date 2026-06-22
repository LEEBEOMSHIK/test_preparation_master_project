package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.QuizHistory;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.repository.QuizHistoryRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

/**
 * QuizHistory 저장을 독립 트랜잭션(REQUIRES_NEW)으로 분리하는 컴포넌트.
 *
 * <p>목적: UserQuizService.checkAnswer()의 readOnly 트랜잭션과 별개의 물리 트랜잭션에서
 * QuizHistory를 저장함으로써, 저장 실패 시 내부 트랜잭션만 롤백되고 채점 응답(바깥 트랜잭션)에
 * UnexpectedRollbackException이 전파되지 않도록 한다.
 *
 * <p>User 파라미터를 엔티티 대신 userId(Long)로 받는 이유:
 * 호출측(readOnly tx)에서 넘어온 User 엔티티는 해당 영속성 컨텍스트에 귀속되어
 * REQUIRES_NEW 내부에서 detached 상태가 될 수 있다.
 * userId만 받아 내부에서 userRepository.getReferenceById()로 프록시를 생성하면
 * LazyInitialization·detached 문제를 모두 회피할 수 있다.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class QuizHistoryRecorder {

    private final QuizHistoryRepository quizHistoryRepository;
    // User 프록시 생성용 — getReferenceById()는 EntityManager.getReference() 래퍼로 SELECT 없이 id만 세팅
    private final UserRepository userRepository;

    /**
     * QuizHistory를 별도 물리 트랜잭션(REQUIRES_NEW)으로 저장한다.
     *
     * @param userId         사용자 PK
     * @param questionBankId 문항 풀 PK
     * @param categoryId     카테고리 ID (nullable)
     * @param domainName     도메인 이름 (nullable)
     * @param questionType   문항 유형 문자열
     * @param userAnswer     사용자 제출 답안
     * @param correct        정오 여부
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void record(Long userId, Long questionBankId, Long categoryId,
                       String domainName, String questionType,
                       String userAnswer, boolean correct) {

        // REQUIRES_NEW 트랜잭션 내에서 User 프록시 생성 — DB SELECT 없이 id 참조만 세팅
        User userRef = userRepository.getReferenceById(userId);

        QuizHistory history = QuizHistory.builder()
                .user(userRef)
                .questionBankId(questionBankId)
                .categoryId(categoryId)
                .domainName(domainName)
                .questionType(questionType)
                .userAnswer(userAnswer)
                .correct(correct)
                .build();

        quizHistoryRepository.save(history);
    }
}
