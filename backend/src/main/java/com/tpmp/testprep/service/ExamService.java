package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.ExamCreateRequest;
import com.tpmp.testprep.dto.request.QuestionRequest;
import com.tpmp.testprep.dto.response.ExamSummaryResponse;
import com.tpmp.testprep.dto.response.QuestionDetailResponse;
import com.tpmp.testprep.entity.Exam;
import com.tpmp.testprep.entity.DomainSlave;
import com.tpmp.testprep.entity.Question;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.DomainSlaveRepository;
import com.tpmp.testprep.repository.ExamRepository;
import com.tpmp.testprep.repository.QuestionRepository;
import com.tpmp.testprep.repository.UserRepository;
import com.tpmp.testprep.service.parser.ParsedQuestion;
import com.tpmp.testprep.service.parser.PdfQuestionParser;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExamService {

    // ── 길이 클램프 상수 ──────────────────────────────────────────────────────────
    private static final int MAX_CONTENT     = 5000;
    private static final int MAX_ANSWER      = 2000;
    private static final int MAX_EXPLANATION = 5000;
    private static final int MAX_OPTION      = 1000;

    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;
    private final DomainSlaveRepository domainSlaveRepository;

    @Value("${app.upload.path}")
    private String uploadPath;

    private static final List<String> ALLOWED_MIME = List.of(
            "application/pdf",
            "application/haansofthwp",
            "application/x-hwp"
    );

    public Page<ExamSummaryResponse> getExams(Pageable pageable) {
        return examRepository.findAllByDelYn("N", pageable)
                .map(exam -> ExamSummaryResponse.from(exam, questionRepository.countByExamId(exam.getId())));
    }

    public Exam getExamDetail(Long id) {
        return examRepository.findByIdAndDelYn(id, "N")
                .orElseThrow(() -> new BusinessException(ErrorCode.EXAM_NOT_FOUND));
    }

    public ExamSummaryResponse getExamSummary(Long id) {
        Exam exam = getExamDetail(id);
        int count = questionRepository.countByExamId(id);
        return ExamSummaryResponse.from(exam, count);
    }

    @Transactional
    public ExamSummaryResponse createExam(ExamCreateRequest request, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new BusinessException(ErrorCode.INTERNAL_ERROR));
        int orderNo = examRepository.nextOrderNo();
        Exam exam = Exam.builder()
                .title(request.title())
                .orderNo(orderNo)
                .questionMode(request.questionMode())
                .createdBy(admin)
                .build();
        return ExamSummaryResponse.from(examRepository.save(exam));
    }

    @Transactional
    public ExamSummaryResponse updateExam(Long id, String title, Exam.QuestionMode questionMode) {
        Exam exam = getExamDetail(id);
        exam.update(title, questionMode);
        int count = questionRepository.countByExamId(id);
        return ExamSummaryResponse.from(exam, count);
    }

    public List<QuestionDetailResponse> getExamQuestions(Long examId) {
        getExamDetail(examId); // verify exam exists
        return questionRepository.findByExamIdOrderBySeqAscWithCategory(examId)
                .stream().map(QuestionDetailResponse::from).toList();
    }

    @Transactional
    public void removeQuestion(Long examId, Long questionId) {
        Question q = questionRepository.findById(questionId)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUESTION_NOT_FOUND));
        if (!q.getExam().getId().equals(examId))
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        questionRepository.delete(q);
    }

    @Transactional
    public void deleteExam(Long id) {
        Exam exam = getExamDetail(id);
        exam.softDelete();
    }

    @Transactional
    public void addQuestion(Long examId, QuestionRequest request) {
        Exam exam = getExamDetail(examId);
        int seq = questionRepository.maxSeqByExamId(examId) + 1;
        DomainSlave category = (request.categoryId() != null)
                ? domainSlaveRepository.findById(request.categoryId()).orElse(null)
                : null;
        Question question = Question.builder()
                .exam(exam)
                .seq(seq)
                .content(request.content())
                .questionType(request.questionType())
                .options(request.options())
                .answer(request.answer())
                .explanation(request.explanation())
                .code(request.code())
                .language(request.language())
                .category(category)
                .build();
        questionRepository.save(question);
    }

    @Transactional
    public void addQuestionsBulk(Long examId, List<QuestionRequest> requests) {
        if (requests.isEmpty()) return;
        Exam exam = getExamDetail(examId);
        int startSeq = questionRepository.maxSeqByExamId(examId) + 1;
        List<Question> questions = new ArrayList<>();
        for (int i = 0; i < requests.size(); i++) {
            QuestionRequest req = requests.get(i);
            DomainSlave category = (req.categoryId() != null)
                    ? domainSlaveRepository.findById(req.categoryId()).orElse(null)
                    : null;
            questions.add(Question.builder()
                    .exam(exam)
                    .seq(startSeq + i)
                    .content(req.content())
                    .questionType(req.questionType())
                    .options(req.options())
                    .answer(req.answer())
                    .explanation(req.explanation())
                    .code(req.code())
                    .language(req.language())
                    .category(category)
                    .build());
        }
        questionRepository.saveAll(questions);
    }

    @Transactional
    public ExamSummaryResponse createExamWithQuestions(ExamCreateRequest request, String adminEmail,
                                                        List<QuestionRequest> questionRequests) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new BusinessException(ErrorCode.INTERNAL_ERROR));
        int orderNo = examRepository.nextOrderNo();
        Exam exam = Exam.builder()
                .title(request.title())
                .orderNo(orderNo)
                .questionMode(request.questionMode())
                .createdBy(admin)
                .build();
        examRepository.save(exam);

        int questionCount = 0;
        if (questionRequests != null && !questionRequests.isEmpty()) {
            List<Question> questions = new ArrayList<>();
            for (int i = 0; i < questionRequests.size(); i++) {
                QuestionRequest req = questionRequests.get(i);
                DomainSlave category = (req.categoryId() != null)
                        ? domainSlaveRepository.findById(req.categoryId()).orElse(null)
                        : null;
                questions.add(Question.builder()
                        .exam(exam)
                        .seq(i + 1)
                        .content(req.content())
                        .questionType(req.questionType())
                        .options(req.options())
                        .answer(req.answer())
                        .explanation(req.explanation())
                        .code(req.code())
                        .language(req.language())
                        .category(category)
                        .build());
            }
            questionRepository.saveAll(questions);
            questionCount = questions.size();
        }

        return ExamSummaryResponse.from(exam, questionCount);
    }

    @Transactional
    public int uploadQuestionsFromFile(Long examId, MultipartFile file) {
        validateFile(file);
        String savedName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path dest = Paths.get(uploadPath, "pdfs", savedName);

        try {
            Files.createDirectories(dest.getParent());
            file.transferTo(dest);
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_PARSE_FAILED);
        }

        // PDF 파싱 예시 (HWP는 별도 파서 필요)
        if ("application/pdf".equals(file.getContentType())) {
            return parsePdfAndSaveQuestions(examId, dest, file.getOriginalFilename());
        }

        // HWP: 추후 구현 (현재는 파일만 저장 후 0 반환)
        return 0;
    }

    private int parsePdfAndSaveQuestions(Long examId, Path pdfPath, String originalName) {
        try (PDDocument doc = Loader.loadPDF(pdfPath.toFile())) {
            String rawText = new PDFTextStripper().getText(doc);

            // ① 빈 텍스트 → 폴백
            if (rawText == null || rawText.isBlank()) {
                log.warn("parsePdfAndSaveQuestions: PDF 텍스트가 비어 있어 폴백 처리합니다. examId={}", examId);
                saveFallbackQuestion(examId, rawText == null ? "" : rawText.trim(), originalName);
                return 1;
            }

            // ② 포맷 파서 실행
            List<ParsedQuestion> parsed = new PdfQuestionParser().parse(rawText);

            // ③ 파싱 결과 없음 → 폴백
            if (parsed.isEmpty()) {
                log.warn("parsePdfAndSaveQuestions: 문항 파싱 결과 없음. 폴백 저장합니다. examId={}", examId);
                saveFallbackQuestion(examId, rawText.trim(), originalName);
                return 1;
            }

            // ④ 파싱 성공 → 문항 변환 후 일괄 저장
            return buildAndSaveQuestions(examId, parsed, originalName);

        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_PARSE_FAILED);
        }
    }

    /**
     * 폴백: PDF 전체 텍스트를 단일 SHORT_ANSWER 문항으로 저장.
     */
    private void saveFallbackQuestion(Long examId, String content, String originalName) {
        Exam exam = getExamDetail(examId);
        int seq = questionRepository.maxSeqByExamId(examId) + 1;
        String safeContent = content.isBlank() ? "(내용 없음)" : clamp(content, MAX_CONTENT);
        Question q = Question.builder()
                .exam(exam)
                .seq(seq)
                .content(safeContent)
                .questionType(Question.QuestionType.SHORT_ANSWER)
                .answer("(파일 업로드 후 수동 입력 필요)")
                .sourceFile(originalName)
                .build();
        questionRepository.save(q);
    }

    /**
     * ParsedQuestion 목록을 Question 엔티티로 변환하여 일괄 저장.
     * content가 blank인 항목은 건너뜀.
     *
     * @return 실제 저장된 문항 수
     */
    private int buildAndSaveQuestions(Long examId, List<ParsedQuestion> parsed, String originalName) {
        Exam exam = getExamDetail(examId);
        int startSeq = questionRepository.maxSeqByExamId(examId) + 1;

        List<Question> questions = new ArrayList<>();
        int offset = 0;
        for (ParsedQuestion pq : parsed) {
            if (pq.content() == null || pq.content().isBlank()) {
                log.warn("buildAndSaveQuestions: content가 비어 있는 ParsedQuestion 건너뜀");
                continue;
            }

            List<String> clampedOptions = null;
            if (pq.options() != null && !pq.options().isEmpty()) {
                clampedOptions = pq.options().stream()
                        .map(o -> clamp(o, MAX_OPTION))
                        .toList();
            }

            questions.add(Question.builder()
                    .exam(exam)
                    .seq(startSeq + offset)
                    .content(clamp(pq.content(), MAX_CONTENT))
                    .questionType(pq.questionType())
                    .options(clampedOptions)
                    .answer(pq.answer() != null ? clamp(pq.answer(), MAX_ANSWER) : null)
                    .explanation(pq.explanation() != null ? clamp(pq.explanation(), MAX_EXPLANATION) : null)
                    .sourceFile(originalName)
                    .build());
            offset++;
        }

        if (questions.isEmpty()) {
            log.warn("buildAndSaveQuestions: 유효한 문항이 없어 폴백으로 전환합니다. examId={}", examId);
            saveFallbackQuestion(examId, "", originalName);
            return 1;
        }

        questionRepository.saveAll(questions);
        log.info("buildAndSaveQuestions: {}개 문항 저장 완료. examId={}", questions.size(), examId);
        return questions.size();
    }

    /** 문자열을 maxLen 이하로 클램프. null이면 null 반환. */
    private static String clamp(String s, int maxLen) {
        if (s == null) return null;
        return s.length() <= maxLen ? s : s.substring(0, maxLen);
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        String mime = file.getContentType();
        if (mime == null || !ALLOWED_MIME.contains(mime)) {
            throw new BusinessException(ErrorCode.UNSUPPORTED_FILE_TYPE);
        }
    }
}
