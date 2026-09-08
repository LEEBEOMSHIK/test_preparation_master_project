package com.tpmp.testprep.service;

import com.tpmp.testprep.entity.ConceptNote;
import com.tpmp.testprep.entity.User;
import com.tpmp.testprep.repository.ConceptNoteRepository;
import com.tpmp.testprep.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageRequest;
import jakarta.persistence.EntityManager;
import java.time.LocalDateTime;
import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest(properties = {
        "spring.datasource.url=jdbc:h2:mem:concept-note-search;MODE=PostgreSQL;DB_CLOSE_DELAY=-1;DATABASE_TO_LOWER=TRUE",
        "spring.datasource.driver-class-name=org.h2.Driver",
        "spring.datasource.username=sa",
        "spring.datasource.password="
})
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@Import(ConceptNoteService.class)
class ConceptNoteSearchTest {
    @Autowired ConceptNoteService service;
    @Autowired ConceptNoteRepository notes;
    @Autowired UserRepository users;
    @Autowired EntityManager entityManager;

    @Test
    void titleSearchCountsAllOwnedNotesAndExcludesOtherUsers() {
        User owner = user("owner@test.com");
        User other = user("other@test.com");
        for (int i = 0; i < 6; i++) save(owner, "Java " + i);
        save(owner, "다른 제목");
        save(other, "Java 남의 비공개 노트");
        notes.flush();

        var first = service.getMyNotes(owner.getEmail(), " java ", PageRequest.of(0, 5));
        var last = service.getMyNotes(owner.getEmail(), "java", PageRequest.of(1, 5));
        assertThat(first.getTotalElements()).isEqualTo(6);
        assertThat(first.getTotalPages()).isEqualTo(2);
        assertThat(first.getContent()).hasSize(5);
        assertThat(last.getContent()).hasSize(1);
        assertThat(first.getContent()).noneMatch(note -> note.title().contains("남의"));
        assertThat(service.getMyNotes(owner.getEmail(), PageRequest.of(0, 5)).getTotalElements()).isEqualTo(7);
    }

    @Test
    void deletingLastResultUpdatesPageCountAndBlankKeywordKeepsOwnership() {
        User owner = user("owner@test.com");
        for (int i = 0; i < 6; i++) save(owner, "노트 " + i);
        notes.flush();
        var last = service.getMyNotes(owner.getEmail(), "  ", PageRequest.of(1, 5));
        service.delete(last.getContent().get(0).id(), owner.getEmail());
        notes.flush();
        var removedPage = service.getMyNotes(owner.getEmail(), null, PageRequest.of(1, 5));
        assertThat(removedPage.getContent()).isEmpty();
        assertThat(removedPage.getTotalElements()).isEqualTo(5);
        assertThat(removedPage.getTotalPages()).isEqualTo(1);
    }

    @Test
    void equalUpdateTimesHaveStableIdOrderAndSearchTextRemainsData() {
        User owner = user("owner@test.com");
        save(owner, "첫 노트");
        save(owner, "둘째 노트");
        notes.flush();
        entityManager.createQuery("UPDATE ConceptNote n SET n.updatedAt = :time")
                .setParameter("time", LocalDateTime.of(2026, 1, 1, 0, 0)).executeUpdate();
        entityManager.clear();
        assertThat(service.getMyNotes(owner.getEmail(), null, PageRequest.of(0, 1)).getContent().get(0).title())
                .isEqualTo("둘째 노트");
        assertThat(service.getMyNotes(owner.getEmail(), null, PageRequest.of(1, 1)).getContent().get(0).title())
                .isEqualTo("첫 노트");
        assertThat(service.getMyNotes(owner.getEmail(), "' OR 1=1 --", PageRequest.of(0, 5)).getTotalElements())
                .isZero();
    }

    @Test
    void wildcardCharactersAreSearchedLiterally() {
        User owner = user("owner@test.com");
        save(owner, "100% 정확도");
        save(owner, "snake_case");
        save(owner, "느낌!표");
        save(owner, "일반 제목");
        notes.flush();
        assertThat(service.getMyNotes(owner.getEmail(), "%", PageRequest.of(0, 5)).getContent())
                .extracting(note -> note.title()).containsExactly("100% 정확도");
        assertThat(service.getMyNotes(owner.getEmail(), "_", PageRequest.of(0, 5)).getContent())
                .extracting(note -> note.title()).containsExactly("snake_case");
        assertThat(service.getMyNotes(owner.getEmail(), "!", PageRequest.of(0, 5)).getContent())
                .extracting(note -> note.title()).containsExactly("느낌!표");
    }

    private User user(String email) {
        return users.save(User.builder().email(email).name("테스터").password("hashed").role(User.Role.USER).build());
    }
    private void save(User owner, String title) {
        notes.save(ConceptNote.builder().user(owner).title(title).content("내용").isPublic(false).build());
    }
}
