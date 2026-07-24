package com.tpmp.testprep.security;

import com.tpmp.testprep.exception.BusinessException;
import com.tpmp.testprep.exception.ErrorCode;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * 로그인(POST /api/auth/login) 무차별 대입 방어용 고정 윈도우(fixed window) rate limiter.
 * 단일 VM docker-compose(수평 확장 없음) 배포 전제로 순수 인메모리 ConcurrentHashMap을 사용한다
 * (Redis 등 외부 저장소는 현재 배포 구조에 과함).
 *
 * 키는 이메일이 아닌 클라이언트 IP만 사용한다. 이메일 기준이면 공격자가 타인 이메일로
 * 의도적으로 실패시켜 정상 사용자를 잠그는 DoS가 가능하기 때문이다.
 *
 * 같은 IP에서 WINDOW(5분) 이내 로그인 실패가 MAX_ATTEMPTS(5회) 이상이면 이후 요청을
 * 즉시 차단(자격증명 검사 자체를 하지 않음)하고 429(TOO_MANY_LOGIN_ATTEMPTS)를 반환한다.
 * 조회 시점에 윈도우가 지났으면 별도 스케줄러가 아닌 레이지 리셋으로 카운터를 초기화한다.
 */
@Component
public class LoginRateLimiter {

    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(5);
    private static final Duration CLEANUP_THRESHOLD = Duration.ofHours(1);

    private final Map<String, Entry> attempts = new ConcurrentHashMap<>();

    /** 실패 횟수가 한도를 초과했으면 예외를 던진다. 자격증명 검사보다 먼저 호출해야 한다. */
    public void checkAllowed(String ip) {
        Entry entry = attempts.get(ip);
        if (entry == null) {
            return;
        }
        synchronized (entry) {
            if (isWindowExpired(entry)) {
                return;
            }
            if (entry.count >= MAX_ATTEMPTS) {
                throw new BusinessException(ErrorCode.TOO_MANY_LOGIN_ATTEMPTS);
            }
        }
    }

    /** 로그인 실패를 기록한다. 윈도우가 만료되었으면 레이지 리셋 후 1부터 다시 센다. */
    public void recordFailure(String ip) {
        Entry entry = attempts.computeIfAbsent(ip, key -> new Entry());
        synchronized (entry) {
            if (isWindowExpired(entry)) {
                entry.windowStart = Instant.now();
                entry.count = 1;
            } else {
                entry.count++;
            }
        }
    }

    /** 로그인 성공 시 해당 IP의 카운터를 즉시 제거한다. */
    public void recordSuccess(String ip) {
        attempts.remove(ip);
    }

    /** windowStart가 CLEANUP_THRESHOLD(1시간) 이상 지난 엔트리를 정리해 메모리 누수를 방지한다. */
    @Scheduled(fixedRate = 60 * 60 * 1000L)
    public void cleanupStaleEntries() {
        Instant threshold = Instant.now().minus(CLEANUP_THRESHOLD);
        attempts.entrySet().removeIf(e -> e.getValue().windowStart.isBefore(threshold));
    }

    /** 테스트 전용: 특정 IP 엔트리의 windowStart를 임의 시점으로 이동시켜 윈도우 만료를 흉내낸다. */
    void forceWindowStart(String ip, Instant windowStart) {
        Entry entry = attempts.computeIfAbsent(ip, key -> new Entry());
        synchronized (entry) {
            entry.windowStart = windowStart;
        }
    }

    private boolean isWindowExpired(Entry entry) {
        return Duration.between(entry.windowStart, Instant.now()).compareTo(WINDOW) > 0;
    }

    private static final class Entry {
        private volatile Instant windowStart = Instant.now();
        private int count = 0;
    }
}
