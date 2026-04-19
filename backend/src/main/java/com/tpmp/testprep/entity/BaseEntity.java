package com.tpmp.testprep.entity;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;

import java.time.LocalDateTime;

/**
 * 모든 엔티티가 공유하는 표준 공통 컬럼 (db-guidelines.md 참조).
 *
 * <ul>
 *   <li>create_dt / create_uno  — 생성 일시 / 생성자 번호 (users.id)</li>
 *   <li>modified_dt / modified_uno — 최종 수정 일시 / 수정자 번호</li>
 *   <li>del_yn  — 소프트 삭제 여부 (Y: 삭제, N: 정상)</li>
 *   <li>use_yn  — 사용 여부 (Y: 사용중, N: 비사용)</li>
 * </ul>
 *
 * 서비스 레이어에서 저장 전 {@link #initAudit(Long)} 또는
 * {@link #updateAudit(Long)}을 호출해야 한다.
 */
@MappedSuperclass
@Getter
public abstract class BaseEntity {

    @Column(name = "create_dt", nullable = false, updatable = false)
    private LocalDateTime createDt;

    @Column(name = "create_uno", nullable = false, updatable = false)
    private Long createUno;

    @Column(name = "modified_dt", nullable = false)
    private LocalDateTime modifiedDt;

    @Column(name = "modified_uno", nullable = false)
    private Long modifiedUno;

    /** 소프트 삭제 여부: 'N' = 정상, 'Y' = 삭제됨 */
    @Column(name = "del_yn", nullable = false, length = 1)
    private String delYn = "N";

    /** 사용 여부: 'Y' = 사용중, 'N' = 비사용 */
    @Column(name = "use_yn", nullable = false, length = 1)
    private String useYn = "Y";

    /** 최초 저장 시 호출 — 생성/수정 일시 및 사용자 번호 초기화 */
    protected void initAudit(Long userNo) {
        LocalDateTime now = LocalDateTime.now();
        this.createDt = now;
        this.createUno = userNo;
        this.modifiedDt = now;
        this.modifiedUno = userNo;
    }

    /** 업데이트 시 호출 — 수정 일시 및 사용자 번호 갱신 */
    protected void updateAudit(Long userNo) {
        this.modifiedDt = LocalDateTime.now();
        this.modifiedUno = userNo;
    }

    /** 소프트 삭제 처리 */
    public void softDelete(Long userNo) {
        this.delYn = "Y";
        updateAudit(userNo);
    }

    /** 비활성화 처리 */
    public void deactivate(Long userNo) {
        this.useYn = "N";
        updateAudit(userNo);
    }
}
