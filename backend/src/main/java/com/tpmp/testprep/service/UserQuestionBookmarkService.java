package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.response.BookmarkQuestionResponse;
import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.entity.UserQuestionBookmark;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.QuestionBankRepository;
import com.tpmp.testprep.repository.UserQuestionBookmarkRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserQuestionBookmarkService {

    private final UserQuestionBookmarkRepository bookmarkRepository;
    private final UserRepository userRepository;
    private final QuestionBankRepository questionBankRepository;

    /**
     * 북마크 토글 — 존재하면 삭제(false 반환), 없으면 추가(true 반환).
     * UNIQUE 동시성 위반(DataIntegrityViolationException) 방어 처리.
     */
    @Transactional
    public boolean toggle(String email, Long questionBankId) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));

        QuestionBank questionBank = questionBankRepository.findById(questionBankId)
                .filter(qb -> "N".equals(qb.getDelYn()))
                .orElseThrow(() -> new BusinessException(ErrorCode.QUESTION_NOT_FOUND));

        Optional<UserQuestionBookmark> existing =
                bookmarkRepository.findByUserIdAndQuestionBankId(user.getId(), questionBankId);

        if (existing.isPresent()) {
            bookmarkRepository.delete(existing.get());
            return false;
        }

        try {
            bookmarkRepository.save(
                    UserQuestionBookmark.builder()
                            .user(user)
                            .questionBank(questionBank)
                            .build()
            );
        } catch (DataIntegrityViolationException e) {
            // 동시 요청으로 이미 저장된 경우 — 이미 북마크 됨으로 처리
            return true;
        }
        return true;
    }

    /** 사용자의 북마크 문항 목록 조회 */
    public List<BookmarkQuestionResponse> getBookmarks(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return bookmarkRepository.findAllByUserIdWithQuestion(user.getId())
                .stream()
                .map(BookmarkQuestionResponse::from)
                .toList();
    }

    /** 사용자의 북마크된 questionBankId 목록만 반환 */
    public List<Long> getBookmarkedQuestionBankIds(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
        return bookmarkRepository.findQuestionBankIdsByUserId(user.getId());
    }
}
