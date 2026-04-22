package com.tpmp.testprep.service;

import com.tpmp.testprep.dto.request.QuoteRequest;
import com.tpmp.testprep.dto.response.QuoteResponse;
import com.tpmp.testprep.entity.Quote;
import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import com.tpmp.testprep.repository.QuoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuoteService {

    private final QuoteRepository quoteRepository;

    public Page<QuoteResponse> getAll(Pageable pageable) {
        return quoteRepository.findAll(pageable).map(QuoteResponse::from);
    }

    public Optional<QuoteResponse> getRandom() {
        return quoteRepository.findRandomActive().map(QuoteResponse::from);
    }

    @Transactional
    public QuoteResponse create(QuoteRequest request) {
        Quote quote = Quote.builder()
                .content(request.content())
                .author(request.author())
                .build();
        return QuoteResponse.from(quoteRepository.save(quote));
    }

    @Transactional
    public QuoteResponse update(Long id, QuoteRequest request) {
        Quote quote = findById(id);
        quote.update(request.content(), request.author());
        return QuoteResponse.from(quote);
    }

    @Transactional
    public QuoteResponse toggleUseYn(Long id) {
        Quote quote = findById(id);
        quote.toggleUseYn();
        return QuoteResponse.from(quote);
    }

    @Transactional
    public void delete(Long id) {
        quoteRepository.delete(findById(id));
    }

    private Quote findById(Long id) {
        return quoteRepository.findById(id)
                .orElseThrow(() -> new BusinessException(ErrorCode.QUOTE_NOT_FOUND));
    }
}
