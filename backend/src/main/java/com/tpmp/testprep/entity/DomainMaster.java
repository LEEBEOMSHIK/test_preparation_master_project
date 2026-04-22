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

    @Column(nullable = false, length = 100)
    private String name;

    @OneToMany(mappedBy = "master", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("displayOrder ASC")
    private List<DomainSlave> slaves = new ArrayList<>();

    @Builder
    public DomainMaster(String name) {
        this.name = name;
    }

    public void updateName(String name) {
        this.name = name;
    }
}
