package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.ExamCreateRequest;
import com.tpmp.testprep.dto.request.QuestionRequest;
import com.tpmp.testprep.dto.response.ExamSummaryResponse;
import com.tpmp.testprep.dto.response.QuestionDetailResponse;
import com.tpmp.testprep.entity.Exam;
import com.tpmp.testprep.entity.Question;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.ExamRepository;
import com.tpmp.testprep.repository.QuestionRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
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

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExamService {

    private final ExamRepository examRepository;
    private final QuestionRepository questionRepository;
    private final UserRepository userRepository;

    @Value("${app.upload.path}")
    private String uploadPath;

    private static final List<String> ALLOWED_MIME = List.of(
            "application/pdf",
            "application/haansofthwp",
            "application/x-hwp"
    );

    public Page<ExamSummaryResponse> getExams(Pageable pageable) {
        return examRepository.findAll(pageable).map(ExamSummaryResponse::from);
    }

    public Exam getExamDetail(Long id) {
        return examRepository.findById(id)
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
        return ExamSummaryResponse.from(exam);
    }

    public List<QuestionDetailResponse> getExamQuestions(Long examId) {
        getExamDetail(examId); // verify exam exists
        return questionRepository.findByExamIdOrderBySeqAsc(examId)
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
        examRepository.delete(exam);
    }

    @Transactional
    public void addQuestion(Long examId, QuestionRequest request) {
        Exam exam = getExamDetail(examId);
        int seq = questionRepository.maxSeqByExamId(examId) + 1;
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
            String text = new PDFTextStripper().getText(doc);
            // TODO: 텍스트 파싱 규칙에 따라 문항 추출
            // 현재는 파싱된 텍스트 전체를 1개 문항으로 임시 저장
            Exam exam = getExamDetail(examId);
            int seq = questionRepository.maxSeqByExamId(examId) + 1;
            Question q = Question.builder()
                    .exam(exam)
                    .seq(seq)
                    .content(text.trim())
                    .questionType(Question.QuestionType.SHORT_ANSWER)
                    .answer("(파일 업로드 후 수동 입력 필요)")
                    .sourceFile(originalName)
                    .build();
            questionRepository.save(q);
            return 1;
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.FILE_PARSE_FAILED);
        }
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
