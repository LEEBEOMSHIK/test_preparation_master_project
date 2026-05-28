package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.KeywordTagBulkRequest;
import com.tpmp.testprep.dto.response.KeywordTagResponse;
import com.tpmp.testprep.entity.KeywordTag;
import com.tpmp.testprep.repository.KeywordTagRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class KeywordTagService {

    private final KeywordTagRepository keywordTagRepository;

    @Transactional
    public int saveBulk(KeywordTagBulkRequest request) {
        int count = 0;
        if (request.keywords() != null) {
            for (String name : request.keywords()) {
                upsert(name.strip(), KeywordTag.TagType.KEYWORD);
                count++;
            }
        }
        if (request.domains() != null) {
            for (String name : request.domains()) {
                upsert(name.strip(), KeywordTag.TagType.DOMAIN);
                count++;
            }
        }
        return count;
    }

    public List<KeywordTagResponse> search(String type, String q) {
        KeywordTag.TagType tagType = KeywordTag.TagType.valueOf(type.toUpperCase());
        List<KeywordTag> tags = (q != null && !q.isBlank())
                ? keywordTagRepository.findByTypeAndNameContainingIgnoreCaseOrderByUseCountDesc(tagType, q)
                : keywordTagRepository.findByTypeOrderByUseCountDesc(tagType);
        return tags.stream().map(KeywordTagResponse::from).toList();
    }

    private void upsert(String name, KeywordTag.TagType type) {
        if (name.isBlank()) return;
        keywordTagRepository.findByNameAndType(name, type)
                .ifPresentOrElse(
                        KeywordTag::incrementUseCount,
                        () -> keywordTagRepository.save(
                                KeywordTag.builder().name(name).type(type).build())
                );
    }
}
