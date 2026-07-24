package com.tpmp.testprep.security;

import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * LoginRateLimiter — IP 기준 고정 윈도우(5분/5회) rate limiting 단위 테스트.
 * 외부 의존성이 없는 순수 컴포넌트이므로 Mockito 없이 직접 생성해서 검증한다.
 */
class LoginRateLimiterTest {

    private static final String IP = "127.0.0.1";

    private LoginRateLimiter rateLimiter;

    @BeforeEach
    void setUp() {
        rateLimiter = new LoginRateLimiter();
    }

    @Test
    @DisplayName("5회 미만 실패는 계속 checkAllowed를 통과한다")
    void underFiveFailures_stillAllowed() {
        for (int i = 0; i < 4; i++) {
            rateLimiter.recordFailure(IP);
        }

        assertThatCode(() -> rateLimiter.checkAllowed(IP)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("5회 실패 후 6번째 checkAllowed 호출 시 TOO_MANY_LOGIN_ATTEMPTS 예외가 발생한다")
    void fiveFailures_sixthCallBlocked() {
        for (int i = 0; i < 5; i++) {
            rateLimiter.recordFailure(IP);
        }

        assertThatThrownBy(() -> rateLimiter.checkAllowed(IP))
                .isInstanceOf(BusinessException.class)
                .extracting("errorCode").isEqualTo(ErrorCode.TOO_MANY_LOGIN_ATTEMPTS);
    }

    @Test
    @DisplayName("recordSuccess 호출 후에는 카운터가 리셋되어 다시 5회까지 허용된다")
    void recordSuccess_resetsCounter() {
        for (int i = 0; i < 5; i++) {
            rateLimiter.recordFailure(IP);
        }
        rateLimiter.recordSuccess(IP);

        assertThatCode(() -> rateLimiter.checkAllowed(IP)).doesNotThrowAnyException();

        for (int i = 0; i < 4; i++) {
            rateLimiter.recordFailure(IP);
        }
        assertThatCode(() -> rateLimiter.checkAllowed(IP)).doesNotThrowAnyException();
    }

    @Test
    @DisplayName("윈도우(5분) 만료 후에는 카운터가 리셋되어 다시 허용된다")
    void windowExpired_resetsCounter() {
        for (int i = 0; i < 5; i++) {
            rateLimiter.recordFailure(IP);
        }
        assertThatThrownBy(() -> rateLimiter.checkAllowed(IP)).isInstanceOf(BusinessException.class);

        rateLimiter.forceWindowStart(IP, Instant.now().minusSeconds(6 * 60));

        assertThatCode(() -> rateLimiter.checkAllowed(IP)).doesNotThrowAnyException();

        rateLimiter.recordFailure(IP);
        assertThatCode(() -> rateLimiter.checkAllowed(IP)).doesNotThrowAnyException();
    }
}
