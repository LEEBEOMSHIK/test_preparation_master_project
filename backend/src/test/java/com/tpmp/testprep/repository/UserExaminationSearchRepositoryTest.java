package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.DomainMaster;
import com.tpmp.testprep.entity.DomainSlave;
import com.tpmp.testprep.entity.Exam;
import com.tpmp.testprep.entity.Examination;
import com.tpmp.testprep.entity.User;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class UserExaminationSearchRepositoryTest {

    @Autowired private ExaminationRepository examinationRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private DomainMasterRepository domainMasterRepository;
    @Autowired private DomainSlaveRepository domainSlaveRepository;
    @Autowired private ExamRepository examRepository;
    @Autowired private EntityManager entityManager;

    private User creator;
    private DomainSlave engineer;
    private DomainSlave database;
    private Exam paper;

    @BeforeEach
    void setUp() {
        creator = userRepository.save(User.builder()
                .email("exam-search@example.com")
                .password("encoded")
                .name("시험 검색")
                .role(User.Role.ADMIN)
                .build());
        DomainMaster master = domainMasterRepository.save(DomainMaster.builder()
                .code("EXAM_SEARCH_TEST")
                .name("시험 검색 테스트")
                .build());
        engineer = domainSlaveRepository.save(DomainSlave.builder()
                .master(master)
                .name("정보처리기사")
                .displayOrder(1)
                .build());
        database = domainSlaveRepository.save(DomainSlave.builder()
                .master(master)
                .name("SQLD")
                .displayOrder(2)
                .build());
        paper = examRepository.save(Exam.builder()
                .title("통합 시험지")
                .orderNo(1)
                .questionMode(Exam.QuestionMode.SEQUENTIAL)
                .createdBy(creator)
                .build());
    }

    @Test
    void searchesAllActiveRowsBeforePagingEvenWhenMatchIsAfterFirstFiveHundred() {
        List<Examination> filler = new ArrayList<>();
        for (int index = 0; index < 501; index++) {
            filler.add(examination("일반 시험 " + index, engineer, 2025, 1, false));
        }
        examinationRepository.saveAll(filler);
        Examination expected = examinationRepository.save(
                examination("오백 건 뒤의 특별 시험", engineer, 2024, 2, false));
        examinationRepository.flush();

        Page<Examination> result = examinationRepository.searchActive(
                "특별", null, List.of("__NO_INTEREST_FILTER__"), false,
                null, null, null, PageRequest.of(0, 5));

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).extracting(Examination::getId)
                .containsExactly(expected.getId());
    }

    @Test
    void nullTitleKeepsUnfilteredSearchContract() {
        Examination expected = examinationRepository.save(
                examination("제목 조건 없는 시험", engineer, 2025, 1, false));
        examinationRepository.flush();

        Page<Examination> result = examinationRepository.searchActive(
                null, null, List.of("__NO_INTEREST_FILTER__"), false,
                null, null, null, PageRequest.of(0, 5));

        assertThat(result.getContent()).extracting(Examination::getId)
                .containsExactly(expected.getId());
    }

    @Test
    void combinesCategoryInterestsYearRoundAndAiFiltersAndReturnsFilteredTotal() {
        Examination expected = examinationRepository.save(
                examination(" 2025 실전 모의 ", engineer, 2025, 2, true));
        examinationRepository.save(examination("2025 기출", engineer, 2025, 2, false));
        examinationRepository.save(examination("2024 실전 모의", engineer, 2024, 2, true));
        examinationRepository.save(examination("2025 실전 모의 SQLD", database, 2025, 2, true));
        examinationRepository.flush();

        Page<Examination> result = examinationRepository.searchActive(
                "실전", "정보처리기사", List.of("정보처리기사"), true,
                2025, 2, true, PageRequest.of(0, 5));

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).extracting(Examination::getId)
                .containsExactly(expected.getId());
    }

    @Test
    void treatsEscapedPercentAndUnderscoreAsLiteralTitleCharacters() {
        Examination expected = examinationRepository.save(
                examination("달성률 100%_완료", engineer, 2025, 2, false));
        examinationRepository.save(
                examination("달성률 100점 완료", engineer, 2025, 2, false));
        examinationRepository.flush();

        Page<Examination> result = examinationRepository.searchActive(
                "100!%!_", null, List.of("__NO_INTEREST_FILTER__"), false,
                null, null, null, PageRequest.of(0, 5));

        assertThat(result.getContent()).extracting(Examination::getId)
                .containsExactly(expected.getId());
    }

    @Test
    void ordersCompleteTiesByIdDescendingAndProvidesGlobalYearRoundOptions() {
        Examination olderId = examinationRepository.save(
                examination("동률 A", engineer, 2025, 3, false));
        Examination newerId = examinationRepository.save(
                examination("동률 B", engineer, 2025, 3, false));
        examinationRepository.save(examination("과거", engineer, 2024, 1, false));
        examinationRepository.flush();
        entityManager.createNativeQuery(
                        "UPDATE examinations SET created_at = TIMESTAMP '2026-09-09 10:00:00' " +
                                "WHERE id IN (:olderId, :newerId)")
                .setParameter("olderId", olderId.getId())
                .setParameter("newerId", newerId.getId())
                .executeUpdate();
        entityManager.clear();

        Page<Examination> result = examinationRepository.searchActive(
                null, null, List.of("__NO_INTEREST_FILTER__"), false,
                null, null, null, PageRequest.of(0, 10));

        assertThat(result.getContent()).extracting(Examination::getId)
                .startsWith(newerId.getId(), olderId.getId());
        assertThat(examinationRepository.findActiveYears()).containsExactly(2025, 2024);
        assertThat(examinationRepository.findActiveRounds()).containsExactly(3, 1);
    }

    private Examination examination(
            String title,
            DomainSlave category,
            int year,
            int round,
            boolean aiCustom
    ) {
        return Examination.builder()
                .title(title)
                .examPaper(paper)
                .category(category)
                .timeLimit(60)
                .examYear(year)
                .examRound(round)
                .isAiCustom(aiCustom)
                .createdBy(creator)
                .build();
    }
}
