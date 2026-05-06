package com.tpmp.testprep.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_interested_exam",
        uniqueConstraints = @UniqueConstraint(columnNames = {"user_id", "domain_slave_id"}))
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserInterestedExam {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "domain_slave_id", nullable = false)
    private DomainSlave domainSlave;

    @Builder
    public UserInterestedExam(User user, DomainSlave domainSlave) {
        this.user = user;
        this.domainSlave = domainSlave;
    }
}
