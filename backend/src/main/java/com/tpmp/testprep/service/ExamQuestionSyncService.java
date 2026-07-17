package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.ExamQuestionSyncRequest;
import com.tpmp.testprep.dto.response.ExamQuestionSyncPreviewResponse;
import com.tpmp.testprep.entity.Exam;
import com.tpmp.testprep.entity.ExamSession;
import com.tpmp.testprep.entity.Question;
import com.tpmp.testprep.entity.QuestionBank;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.ExamRepository;
import com.tpmp.testprep.repository.ExamSessionRepository;
import com.tpmp.testprep.repository.QuestionBankRepository;
import com.tpmp.testprep.repository.QuestionRepository;
import com.tpmp.testprep.repository.ExaminationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExamQuestionSyncService {

    private static final Pattern YEAR_PATTERN = Pattern.compile("(?<!\\d)(20\\d{2})(?!\\d)");
    private static final Pattern ROUND_PATTERN = Pattern.compile("(?<!\\d)(\\d{1,2})\\s*(?:회|차)(?!\\d)");

    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final QuestionBankRepository questionBankRepository;
    private final ExamSessionRepository examSessionRepository;
    private final ExaminationRepository examinationRepository;

    public ExamQuestionSyncPreviewResponse preview(Long examId) {
        Exam exam = requireExam(examId);
        CandidateKey key = parseCandidateKey(exam.getTitle(), examId);
        boolean activeSession = hasActiveSession(examId, LocalDateTime.now());
        List<ExamQuestionSyncPreviewResponse.Item> items = questionRepository
                .findByExamIdOrderBySeqAscWithSyncSource(examId).stream()
                .map(question -> toPreviewItem(question, key))
                .toList();
        return new ExamQuestionSyncPreviewResponse(examId, activeSession, items);
    }

    @Transactional
    public ExamQuestionSyncPreviewResponse apply(Long examId, ExamQuestionSyncRequest request) {
        Exam exam = examRepository.findByIdForUpdate(examId)
                .orElseThrow(() -> new BusinessException(ErrorCode.EXAM_NOT_FOUND));
        if (hasActiveSession(examId, LocalDateTime.now())) {
            throw new BusinessException(ErrorCode.EXAM_QUESTION_SYNC_ACTIVE_SESSION);
        }
        Map<Long, Question> questions = new HashMap<>();
        questionRepository.findByExamIdOrderBySeqAscWithSyncSource(examId)
                .forEach(question -> questions.put(question.getId(), question));
        CandidateKey key = parseCandidateKey(exam.getTitle(), examId);

        List<SyncTarget> targets = new ArrayList<>();
        boolean selectedAnswerChanged = false;
        for (ExamQuestionSyncRequest.Selection selection : request.selections()) {
            Question question = questions.get(selection.questionId());
            if (question == null) throw new BusinessException(ErrorCode.QUESTION_NOT_FOUND);
            QuestionBank source = questionBankRepository
                    .findByIdAndDelYnAndUseYn(selection.sourceQuestionBankId(), "N", "Y")
                    .orElseThrow(() -> new BusinessException(ErrorCode.QUESTION_NOT_FOUND));
            ensureSourceAllowed(question, source, key);
            selectedAnswerChanged |= !Objects.equals(question.getAnswer(), source.getAnswer());
            targets.add(new SyncTarget(question, source));
        }

        boolean effectiveApplyAnswers = request.applyAnswers() && selectedAnswerChanged;
        if (effectiveApplyAnswers
                && !ExamQuestionSyncRequest.ANSWER_CONFIRMATION.equals(request.answerConfirmation())) {
            throw new BusinessException(ErrorCode.EXAM_QUESTION_SYNC_ANSWER_CONFIRM_REQUIRED);
        }
        for (SyncTarget target : targets) {
            target.question().syncFrom(target.source(), effectiveApplyAnswers);
        }
        return buildPreview(exam, false);
    }

    private ExamQuestionSyncPreviewResponse buildPreview(Exam exam, boolean activeSession) {
        CandidateKey key = parseCandidateKey(exam.getTitle(), exam.getId());
        List<ExamQuestionSyncPreviewResponse.Item> items = questionRepository
                .findByExamIdOrderBySeqAscWithSyncSource(exam.getId()).stream()
                .map(question -> toPreviewItem(question, key))
                .toList();
        return new ExamQuestionSyncPreviewResponse(exam.getId(), activeSession, items);
    }

    private ExamQuestionSyncPreviewResponse.Item toPreviewItem(Question question, CandidateKey key) {
        QuestionBank source = question.getSourceQuestionBank();
        Long candidateId = null;
        String linkStatus;
        List<String> risks = new ArrayList<>();

        if (source == null) {
            List<QuestionBank> candidates = findCandidates(key, question.getSeq());
            candidateId = candidates.size() == 1 ? candidates.get(0).getId() : null;
            linkStatus = candidateId != null ? "CANDIDATE"
                    : key.status().equals("AMBIGUOUS") || candidates.size() > 1 ? "AMBIGUOUS" : "UNLINKED";
            risks.add(candidateId != null
                    ? "구조화 키의 유일 후보입니다. 관리자 선택 전에는 연결하거나 적용하지 않습니다."
                    : "시험지 제목의 연도/회차와 문항 순번으로 원본을 유일하게 결정할 수 없습니다.");
            return new ExamQuestionSyncPreviewResponse.Item(
                    question.getId(), question.getSeq(), null, candidateId, linkStatus,
                    candidateId == null ? "NO_SOURCE" : "CANDIDATE", List.of(), false, risks);
        }

        linkStatus = "LINKED";
        if (!"N".equals(source.getDelYn()) || !"Y".equals(source.getUseYn())) {
            risks.add("연결된 원본 문항이 삭제되었거나 비활성 상태입니다.");
            return new ExamQuestionSyncPreviewResponse.Item(
                    question.getId(), question.getSeq(), source.getId(), null, linkStatus,
                    "MISSING_SOURCE", List.of(), false, risks);
        }
        List<String> fields = changedFields(question, source);
        boolean answerChanged = fields.contains("answer");
        if (answerChanged) risks.add("정답 변경은 별도 이중 확인 없이는 적용되지 않습니다.");
        return new ExamQuestionSyncPreviewResponse.Item(
                question.getId(), question.getSeq(), source.getId(), null, linkStatus,
                fields.isEmpty() ? "UP_TO_DATE" : "CHANGED", fields, answerChanged, risks);
    }

    private List<QuestionBank> findCandidates(CandidateKey key, int questionNo) {
        if (!key.status().equals("VALID")) return List.of();
        return questionBankRepository.findStructuralSyncCandidates(
                key.examYear(), key.examRound(), questionNo, key.examTypeId());
    }

    private void ensureSourceAllowed(Question question, QuestionBank source, CandidateKey key) {
        if (question.getSourceQuestionBank() != null) {
            if (!question.getSourceQuestionBank().getId().equals(source.getId())) {
                throw new BusinessException(ErrorCode.EXAM_QUESTION_SYNC_SOURCE_MISMATCH);
            }
            return;
        }
        List<QuestionBank> candidates = findCandidates(key, question.getSeq());
        if (candidates.size() != 1 || !candidates.get(0).getId().equals(source.getId())) {
            throw new BusinessException(ErrorCode.EXAM_QUESTION_SYNC_SOURCE_MISMATCH);
        }
    }

    private List<String> changedFields(Question q, QuestionBank source) {
        List<String> fields = new ArrayList<>();
        addChanged(fields, "instruction", q.getInstruction(), source.getInstruction());
        addChanged(fields, "content", q.getContent(), source.getContent());
        addChanged(fields, "questionType", q.getQuestionType().name(), source.getQuestionType().name());
        addChanged(fields, "options", q.getOptions(), source.getOptions());
        addChanged(fields, "explanation", q.getExplanation(), source.getExplanation());
        addChanged(fields, "code", q.getCode(), source.getCode());
        addChanged(fields, "language", q.getLanguage(), source.getLanguage());
        addChanged(fields, "categoryId",
                q.getCategory() == null ? null : q.getCategory().getId(),
                source.getCategory() == null ? null : source.getCategory().getId());
        addChanged(fields, "schedulingData", q.getSchedulingData(), source.getSchedulingData());
        addChanged(fields, "sqlData", q.getSqlData(), source.getSqlData());
        addChanged(fields, "answer", q.getAnswer(), source.getAnswer());
        return fields;
    }

    private void addChanged(List<String> fields, String field, Object current, Object source) {
        if (!Objects.equals(current, source)) fields.add(field);
    }

    private Exam requireExam(Long examId) {
        return examRepository.findByIdAndDelYn(examId, "N")
                .orElseThrow(() -> new BusinessException(ErrorCode.EXAM_NOT_FOUND));
    }

    private boolean hasActiveSession(Long examId, LocalDateTime now) {
        return examSessionRepository.findByExamPaperIdWithExamination(examId).stream()
                .anyMatch(session -> session.getStartedAt()
                        .plusMinutes(session.getExamination().getTimeLimit())
                        .isAfter(now));
    }

    private CandidateKey parseCandidateKey(String title, Long examId) {
        List<Integer> years = findNumbers(YEAR_PATTERN, title);
        List<Integer> rounds = findNumbers(ROUND_PATTERN, title);
        List<Long> examTypeIds = examinationRepository.findDistinctCategoryIdsByExamPaperId(examId);
        if (years.size() > 1 || rounds.size() > 1 || examTypeIds.size() > 1) {
            return new CandidateKey(null, null, null, "AMBIGUOUS");
        }
        if (years.size() != 1 || rounds.size() != 1 || examTypeIds.size() != 1) {
            return new CandidateKey(null, null, null, "MISSING");
        }
        return new CandidateKey(years.get(0), rounds.get(0), examTypeIds.get(0), "VALID");
    }

    private List<Integer> findNumbers(Pattern pattern, String text) {
        List<Integer> values = new ArrayList<>();
        Matcher matcher = pattern.matcher(text == null ? "" : text);
        while (matcher.find()) values.add(Integer.valueOf(matcher.group(1)));
        return values;
    }

    private record CandidateKey(Integer examYear, Integer examRound, Long examTypeId, String status) {}
    private record SyncTarget(Question question, QuestionBank source) {}
}
