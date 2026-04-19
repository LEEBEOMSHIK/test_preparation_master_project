package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.ExaminationCreateRequest;
import com.tpmp.testprep.dto.response.ExaminationResponse;
import com.tpmp.testprep.entity.DomainSlave;
import com.tpmp.testprep.entity.Exam;
import com.tpmp.testprep.entity.Examination;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.DomainSlaveRepository;
import com.tpmp.testprep.repository.ExamRepository;
import com.tpmp.testprep.repository.ExaminationRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExaminationService {

    private final ExaminationRepository examinationRepository;
    private final ExamRepository examRepository;
    private final DomainSlaveRepository domainSlaveRepository;
    private final UserRepository userRepository;

    public Page<ExaminationResponse> getExaminations(Pageable pageable) {
        return examinationRepository.findAllWithDetails(pageable)
                .map(ExaminationResponse::from);
    }

    public ExaminationResponse getExamination(Long id) {
        return ExaminationResponse.from(findById(id));
    }

    @Transactional
    public ExaminationResponse createExamination(ExaminationCreateRequest request, String adminEmail) {
        User admin = userRepository.findByEmail(adminEmail)
                .orElseThrow(() -> new BusinessException(ErrorCode.INTERNAL_ERROR));
        Exam paper = examRepository.findById(request.examPaperId())
                .orElseThrow(() -> new BusinessException(ErrorCode.EXAM_NOT_FOUND));
        DomainSlave category = domainSlaveRepository.findById(request.categoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));

        Examination examination = Examination.builder()
                .title(request.title())
                .examPaper(paper)
                .category(category)
                .timeLimit(request.timeLimit())
                .createdBy(admin)
                .build();
        return ExaminationResponse.from(examinationRepository.save(examination));
    }

    @Transactional
    public ExaminationResponse updateExamination(Long id, ExaminationCreateRequest request) {
        Examination examination = findById(id);
        Exam paper = examRepository.findById(request.examPaperId())
                .orElseThrow(() -> new BusinessException(ErrorCode.EXAM_NOT_FOUND));
        DomainSlave category = domainSlaveRepository.findById(request.categoryId())
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));

        examination.update(request.title(), paper, category, request.timeLimit());
        return ExaminationResponse.from(examination);
    }

    @Transactional
    public void deleteExamination(Long id) {
        examinationRepository.delete(findById(id));
    }

    private Examination findById(Long id) {
        return examinationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.EXAMINATION_NOT_FOUND));
    }
}
