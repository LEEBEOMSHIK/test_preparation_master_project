package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "domain_slave")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class DomainSlave {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "master_id", nullable = false)
    private DomainMaster master;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "display_order", nullable = false)
    private Integer displayOrder;

    @Builder
    public DomainSlave(DomainMaster master, String name, Integer displayOrder) {
        this.master = master;
        this.name = name;
        this.displayOrder = displayOrder;
    }

    public void update(String name, Integer displayOrder) {
        if (name != null) this.name = name;
        if (displayOrder != null) this.displayOrder = displayOrder;
    }
}
