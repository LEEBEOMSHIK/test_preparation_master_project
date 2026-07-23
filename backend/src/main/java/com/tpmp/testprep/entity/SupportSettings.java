package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * 개발자 응원하기(후원) 링크 단일 행(싱글톤) 설정.
 * 토스/카카오페이/카카오 선물하기 위시리스트 3개 URL을 관리자가 관리한다.
 */
@Entity
@Table(name = "support_settings")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SupportSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "toss_url", length = 500)
    private String tossUrl;

    @Column(name = "kakaopay_url", length = 500)
    private String kakaopayUrl;

    @Column(name = "kakao_gift_url", length = 500)
    private String kakaoGiftUrl;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onSave() {
        this.updatedAt = LocalDateTime.now();
    }

    @Builder
    public SupportSettings(String tossUrl, String kakaopayUrl, String kakaoGiftUrl) {
        this.tossUrl = tossUrl;
        this.kakaopayUrl = kakaopayUrl;
        this.kakaoGiftUrl = kakaoGiftUrl;
    }

    public void update(String tossUrl, String kakaopayUrl, String kakaoGiftUrl) {
        this.tossUrl = tossUrl;
        this.kakaopayUrl = kakaopayUrl;
        this.kakaoGiftUrl = kakaoGiftUrl;
    }
}
