package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.ExamInfoRequest;
import com.tpmp.testprep.dto.request.OnboardingRequest;
import com.tpmp.testprep.dto.response.DomainSlaveResponse;
import com.tpmp.testprep.dto.response.ExamInfoResponse;
import com.tpmp.testprep.dto.response.UserResponse;
import com.tpmp.testprep.entity.DomainSlave;
import com.tpmp.testprep.entity.ExamInfo;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.entity.UserInterestedExam;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.DomainSlaveRepository;
import com.tpmp.testprep.repository.ExamInfoRepository;
import com.tpmp.testprep.repository.UserInterestedExamRepository;
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
    private final UserInterestedExamRepository userInterestedExamRepository;
    private final DomainSlaveRepository domainSlaveRepository;

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
                .applicationUrl(request.applicationUrl())
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
                request.officialUrl(), request.applicationUrl(), request.isActive(), request.displayOrder());
        return ExamInfoResponse.from(info);
    }

    @Transactional
    public void delete(Long id) {
        examInfoRepository.delete(findOrThrow(id));
    }

    // ── User ───────────────────────────────────────────────────────────────────

    /** EXAM_TYPE 도메인 슬레이브 목록 반환 — 온보딩/관심 설정 화면에서 사용 */
    public List<DomainSlaveResponse> getExamTypes() {
        return domainSlaveRepository.findByMasterCode("EXAM_TYPE")
                .stream().map(DomainSlaveResponse::from).toList();
    }

    public List<ExamInfoResponse> getForUser(String email) {
        User user = findUser(email);
        List<UserInterestedExam> interests = userInterestedExamRepository.findByUser(user);
        if (interests.isEmpty()) {
            return examInfoRepository.findByIsActiveTrueOrderByDisplayOrderAscCreatedAtDesc()
                    .stream().map(ExamInfoResponse::from).toList();
        }
        List<String> typeNames = interests.stream()
                .map(uie -> uie.getDomainSlave().getName())
                .toList();
        return examInfoRepository.findByIsActiveTrueAndExamTypeInOrderByDisplayOrderAscCreatedAtDesc(typeNames)
                .stream().map(ExamInfoResponse::from).toList();
    }

    @Transactional
    public UserResponse completeOnboarding(String email, OnboardingRequest request) {
        User user = findUser(email);
        user.completeOnboarding();
        saveInterests(user, request.slaveIds());
        List<UserInterestedExam> interests = userInterestedExamRepository.findByUser(user);
        return UserResponse.from(user, interests);
    }

    @Transactional
    public UserResponse updateInterests(String email, OnboardingRequest request) {
        User user = findUser(email);
        saveInterests(user, request.slaveIds());
        List<UserInterestedExam> interests = userInterestedExamRepository.findByUser(user);
        return UserResponse.from(user, interests);
    }

    // ── Private ────────────────────────────────────────────────────────────────

    private void saveInterests(User user, List<Long> slaveIds) {
        userInterestedExamRepository.deleteByUser(user);
        List<DomainSlave> slaves = domainSlaveRepository.findAllById(slaveIds);
        List<UserInterestedExam> records = slaves.stream()
                .map(slave -> UserInterestedExam.builder().user(user).domainSlave(slave).build())
                .toList();
        userInterestedExamRepository.saveAll(records);
    }

    private ExamInfo findOrThrow(Long id) {
        return examInfoRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INPUT));
    }

    private User findUser(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
    }
}
