package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "domain_master")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DomainMaster {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** 시스템 식별 코드 (EXAM_YEAR, EXAM_ROUND 등) — 프로그램에서 name 대신 이 값으로 조회 */
    @Column(unique = true, length = 50)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @OneToMany(mappedBy = "master", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<DomainSlave> slaves = new ArrayList<>();

    @Builder
    public DomainMaster(String code, String name) {
        this.code = code;
        this.name = name;
    }

    public void updateName(String name) {
        this.name = name;
    }

    public void updateCode(String code) {
        this.code = code;
    }
}
