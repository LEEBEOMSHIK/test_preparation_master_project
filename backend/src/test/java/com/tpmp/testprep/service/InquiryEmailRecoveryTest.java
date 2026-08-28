package com.tpmp.testprep.service;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class InquiryEmailRecoveryTest {

    @Test
    void startupSweepEnqueuesEveryRecoveredPendingDelivery() {
        InquiryEmailDeliveryProcessor processor = mock(InquiryEmailDeliveryProcessor.class);
        InquiryEmailDispatcher dispatcher = mock(InquiryEmailDispatcher.class);
        when(processor.recoverPendingIds()).thenReturn(List.of(3L, 7L));
        InquiryEmailRecovery recovery = new InquiryEmailRecovery(processor, dispatcher);

        recovery.recoverAtStartup();

        verify(dispatcher).enqueue(3L);
        verify(dispatcher).enqueue(7L);
    }
}
