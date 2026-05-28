package com.tpmp.testprep.repository;

import com.tpmp.testprep.entity.KeywordTag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface KeywordTagRepository extends JpaRepository<KeywordTag, Long> {

    Optional<KeywordTag> findByNameAndType(String name, KeywordTag.TagType type);

    List<KeywordTag> findByTypeOrderByUseCountDesc(KeywordTag.TagType type);

    List<KeywordTag> findByTypeAndNameContainingIgnoreCaseOrderByUseCountDesc(
            KeywordTag.TagType type, String name);
}
