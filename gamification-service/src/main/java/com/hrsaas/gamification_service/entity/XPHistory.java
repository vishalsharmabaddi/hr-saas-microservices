package com.hrsaas.gamification_service.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "xp_history")
@Getter @Setter @NoArgsConstructor
public class XPHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;         // tenant isolation
    private String email;           // person ki identity
    private LocalDate logDate;      // kis din ka timelog
    private int xpGained;          // 10 ya 5
    private String reason;         // ON_TIME_SUBMIT ya LATE_SUBMIT
}
