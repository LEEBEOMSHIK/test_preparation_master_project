package com.tpmp.testprep.service;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InquiryEmailRecovery {
    private final InquiryEmailDeliveryProcessor deliveryProcessor;
    private final InquiryEmailDispatcher dispatcher;

    @EventListener(ApplicationReadyEvent.class)
    public void recoverAtStartup() {
        deliveryProcessor.recoverPendingIds().forEach(dispatcher::enqueue);
    }
}
