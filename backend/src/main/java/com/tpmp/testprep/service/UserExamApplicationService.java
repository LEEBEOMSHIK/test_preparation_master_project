package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.UserExamApplicationRequest;
import com.tpmp.testprep.dto.response.UserExamApplicationResponse;
import com.tpmp.testprep.entity.ExamInfo;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.entity.UserExamApplication;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.ExamInfoRepository;
import com.tpmp.testprep.repository.UserExamApplicationRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

/**
 * 사용자가 직접 입력하는 시험 접수(신청) 정보 관리 서비스.
 * Q-net 공개 API는 개인별 접수 이력을 제공하지 않으므로, 사용자가 접수일·시험일을 직접 관리한다.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class UserExamApplicationService {

    private final UserExamApplicationRepository userExamApplicationRepository;
    private final UserRepository userRepository;
    private final ExamInfoRepository examInfoRepository;

    public List<UserExamApplicationResponse> getMine(String email) {
        User user = findUser(email);
        return userExamApplicationRepository.findByUserWithExamInfo(user)
                .stream().map(UserExamApplicationResponse::from).toList();
    }

    @Transactional
    public UserExamApplicationResponse create(String email, UserExamApplicationRequest request) {
        User user = findUser(email);
        validateDates(request);
        ExamInfo examInfo = resolveExamInfo(request.examInfoId());
        UserExamApplication application = UserExamApplication.builder()
                .user(user)
                .examInfo(examInfo)
                .examName(request.examName())
                .applicationDate(request.applicationDate())
                .examDate(request.examDate())
                .memo(request.memo())
                .build();
        return UserExamApplicationResponse.from(userExamApplicationRepository.save(application));
    }

    @Transactional
    public UserExamApplicationResponse update(String email, Long id, UserExamApplicationRequest request) {
        UserExamApplication application = findOrThrow(id);
        checkOwner(application, email);
        validateDates(request);
        ExamInfo examInfo = resolveExamInfo(request.examInfoId());
        application.update(examInfo, request.examName(), request.applicationDate(), request.examDate(), request.memo());
        return UserExamApplicationResponse.from(application);
    }

    @Transactional
    public void delete(String email, Long id) {
        UserExamApplication application = findOrThrow(id);
        checkOwner(application, email);
        userExamApplicationRepository.delete(application);
    }

    // ── Private ────────────────────────────────────────────────────────────────

    /** 허용 연도 하한 — 비현실적인 과거 연도(예: 1900년) 입력 차단 */
    private static final int MIN_ALLOWED_YEAR = 2000;

    private void validateDates(UserExamApplicationRequest request) {
        if (request.applicationDate() == null && request.examDate() == null) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
        int maxAllowedYear = LocalDate.now().getYear() + 10;
        validateYearRange(request.applicationDate(), maxAllowedYear);
        validateYearRange(request.examDate(), maxAllowedYear);
        if (request.applicationDate() != null && request.examDate() != null
                && request.applicationDate().isAfter(request.examDate())) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }

    private void validateYearRange(LocalDate date, int maxAllowedYear) {
        if (date == null) {
            return;
        }
        int year = date.getYear();
        if (year < MIN_ALLOWED_YEAR || year > maxAllowedYear) {
            throw new BusinessException(ErrorCode.INVALID_INPUT);
        }
    }

    private ExamInfo resolveExamInfo(Long examInfoId) {
        if (examInfoId == null) {
            return null;
        }
        return examInfoRepository.findById(examInfoId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));
    }

    private UserExamApplication findOrThrow(Long id) {
        return userExamApplicationRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_EXAM_APPLICATION_NOT_FOUND));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.USER_NOT_FOUND));
    }

    /** 소유자 검증 — 타 사용자 레코드 접근 차단(핵심 보안 요구사항) */
    private void checkOwner(UserExamApplication application, String email) {
        if (!application.getUser().getEmail().equals(email)) {
            throw new BusinessException(ErrorCode.USER_EXAM_APPLICATION_ACCESS_DENIED);
        }
    }
}
