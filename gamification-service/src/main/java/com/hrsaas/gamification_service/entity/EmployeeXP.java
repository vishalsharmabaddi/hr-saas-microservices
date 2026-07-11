package com.hrsaas.gamification_service.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

// Ek person ka XP record. Identity ab companyId + email (verified token se) —
// employeeId nahi. (companyId, email) unique = ek company me ek email ka ek hi row.
@Entity
@Table(name = "employee_xp",
        uniqueConstraints = @UniqueConstraint(columnNames = {"companyId", "email"}))
@Getter @Setter @NoArgsConstructor
public class EmployeeXP {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;         // tenant isolation
    private String email;           // person ki identity (token wala)

    private int totalXp;            // lifetime earned XP
    private String level;           // ROOKIE / REGULAR / PRO / LEGEND
    private int currentStreak;      // consecutive days submitted
    private int longestStreak;      // all-time best streak
    private LocalDate lastSubmitDate; // streak track karne ke liye
}
