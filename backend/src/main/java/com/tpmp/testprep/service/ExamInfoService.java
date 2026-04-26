package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.ExamInfoRequest;
import com.tpmp.testprep.dto.request.OnboardingRequest;
import com.tpmp.testprep.dto.response.ExamInfoResponse;
import com.tpmp.testprep.dto.response.UserResponse;
import com.tpmp.testprep.entity.ExamInfo;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.ExamInfoRepository;
import com.tpmp.testprep.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExamInfoService {

    private final ExamInfoRepository examInfoRepository;
    private final UserRepository userRepository;

    // ── Admin ──────────────────────────────────────────────────────────────────

    public List<ExamInfoResponse> getAllForAdmin() {
        return examInfoRepository.findAllByOrderByDisplayOrderAscCreatedAtDesc()
                .stream().map(ExamInfoResponse::from).toList();
    }

    @Transactional
    public ExamInfoResponse create(ExamInfoRequest request) {
        ExamInfo info = ExamInfo.builder()
                .examType(request.examType())
                .title(request.title())
                .description(request.description())
                .applicationPeriod(request.applicationPeriod())
                .examSchedule(request.examSchedule())
                .resultDate(request.resultDate())
                .officialUrl(request.officialUrl())
                .isActive(request.isActive())
                .displayOrder(request.displayOrder())
                .build();
        return ExamInfoResponse.from(examInfoRepository.save(info));
    }

    @Transactional
    public ExamInfoResponse update(Long id, ExamInfoRequest request) {
        ExamInfo info = findOrThrow(id);
        info.update(request.examType(), request.title(), request.description(),
                request.applicationPeriod(), request.examSchedule(), request.resultDate(),
                request.officialUrl(), request.isActive(), request.displayOrder());
        return ExamInfoResponse.from(info);
    }

    @Transactional
    public void delete(Long id) {
        examInfoRepository.delete(findOrThrow(id));
    }

    // ── User ───────────────────────────────────────────────────────────────────

    public List<ExamInfoResponse> getForUser(String email) {
        User user = findUser(email);
        String interests = user.getInterestedExamTypes();
        if (interests == null || interests.isBlank()) {
            return examInfoRepository.findByIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc()
                    .stream().map(ExamInfoResponse::from).toList();
        }
        List<String> types = List.of(interests.split(","));
        return examInfoRepository.findByIsActiveTrueAndExamTypeInOrderByDisplayOrderAscCreatedAtDesc(types)
                .stream().map(ExamInfoResponse::from).toList();
    }

    @Transactional
    public UserResponse completeOnboarding(String email, OnboardingRequest request) {
        User user = findUser(email);
        String joined = String.join(",", request.examTypes());
        user.completeOnboarding(joined);
        return UserResponse.from(user);
    }

    @Transactional
    public UserResponse updateInterests(String email, OnboardingRequest request) {
        User user = findUser(email);
        user.updateInterests(String.join(",", request.examTypes()));
        return UserResponse.from(user);
    }

    // ── Private ────────────────────────────────────────────────────────────────

    private ExamInfo findOrThrow(Long id) {
        return examInfoRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
    }
}
