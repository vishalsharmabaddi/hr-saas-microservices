package com.hrsaas.gamification_service.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "employee_badges")
@Getter @Setter @NoArgsConstructor
public class Badge {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long employeeId;
    private String badgeType;           // HOT_STREAK, IRON_STREAK
    private LocalDateTime earnedAt;
}
