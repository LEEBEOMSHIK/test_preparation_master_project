package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.FaqRequest;
import com.tpmp.testprep.dto.response.FaqResponse;
import com.tpmp.testprep.entity.Faq;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.FaqRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FaqService {

    private final FaqRepository faqRepository;

    public List<FaqResponse> getActiveFaqs() {
        return faqRepository.findByIsActiveTrueOrderByDisplayOrderAscCreatedAtAsc()
                .stream().map(FaqResponse::from).toList();
    }

    public Page<FaqResponse> adminGetAll(Pageable pageable) {
        return faqRepository.findAll(pageable).map(FaqResponse::from);
    }

    @Transactional
    public FaqResponse create(FaqRequest request) {
        Faq faq = Faq.builder()
                .question(request.question())
                .answer(request.answer())
                .isActive(request.isActive())
                .displayOrder(request.displayOrder())
                .build();
        return FaqResponse.from(faqRepository.save(faq));
    }

    @Transactional
    public FaqResponse update(Long id, FaqRequest request) {
        Faq faq = findFaq(id);
        faq.update(request.question(), request.answer(), request.isActive(), request.displayOrder());
        return FaqResponse.from(faq);
    }

    @Transactional
    public FaqResponse toggleActive(Long id) {
        Faq faq = findFaq(id);
        faq.toggleActive();
        return FaqResponse.from(faq);
    }

    @Transactional
    public void delete(Long id) {
        faqRepository.delete(findFaq(id));
    }

    private Faq findFaq(Long id) {
        return faqRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.FAQ_NOT_FOUND));
    }
}
