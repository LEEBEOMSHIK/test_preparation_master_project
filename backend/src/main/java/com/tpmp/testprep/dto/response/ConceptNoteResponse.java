package com.tpmp.testprep.dto.response;

import com.tpmp.testprep.entity.ConceptNote;
import com.tpmp.testprep.entity.Question;
import com.tpmp.testprep.entity.QuestionBank;

import java.time.LocalDateTime;

public record ConceptNoteResponse(
        Long id,
        String title,
        String content,
        boolean isPublic,
        Long userId,
        String userName,
        // 연결된 시험 문항 정보
        Long questionId,
        String questionContent,
        String questionType,
        String questionCode,
        String questionLanguage,
        // 연결된 퀴즈 문항 정보
        Long questionBankId,
        String questionBankContent,
        String questionBankType,
        String questionBankCode,
        String questionBankLanguage,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
    public static ConceptNoteResponse from(ConceptNote n) {
        Question q = n.getQuestion();
        QuestionBank qb = n.getQuestionBank();
        return new ConceptNoteResponse(
                n.getId(),
                n.getTitle(),
                n.getContent(),
                n.isPublic(),
                n.getUser().getId(),
                n.getUser().getName(),
                q != null ? q.getId() : null,
                q != null ? q.getContent() : null,
                q != null ? q.getQuestionType().name() : null,
                q != null ? q.getCode() : null,
                q != null ? q.getLanguage() : null,
                qb != null ? qb.getId() : null,
                qb != null ? qb.getContent() : null,
                qb != null ? qb.getQuestionType().name() : null,
                qb != null ? qb.getCode() : null,
                qb != null ? qb.getLanguage() : null,
                n.getCreatedAt(),
                n.getUpdatedAt()
        );
    }

    /**
     * 공개 컨텍스트 전용 팩토리 — isPublic=true 일 때 userName에 nickname을 사용하여 실명 노출 방지.
     * nickname이 null이면 '사용자{id}' 폴백.
     */
    public static ConceptNoteResponse from(ConceptNote n, boolean isPublic) {
        if (!isPublic) {
            return from(n);
        }
        Question q = n.getQuestion();
        QuestionBank qb = n.getQuestionBank();
        String displayName = n.getUser().getNickname() != null
                ? n.getUser().getNickname()
                : "사용자" + n.getUser().getId();
        return new ConceptNoteResponse(
                n.getId(),
                n.getTitle(),
                n.getContent(),
                n.isPublic(),
                n.getUser().getId(),
                displayName,
                q != null ? q.getId() : null,
                q != null ? q.getContent() : null,
                q != null ? q.getQuestionType().name() : null,
                q != null ? q.getCode() : null,
                q != null ? q.getLanguage() : null,
                qb != null ? qb.getId() : null,
                qb != null ? qb.getContent() : null,
                qb != null ? qb.getQuestionType().name() : null,
                qb != null ? qb.getCode() : null,
                qb != null ? qb.getLanguage() : null,
                n.getCreatedAt(),
                n.getUpdatedAt()
        );
    }
}
