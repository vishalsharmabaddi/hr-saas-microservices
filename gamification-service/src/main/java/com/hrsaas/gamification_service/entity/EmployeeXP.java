package com.hrsaas.gamification_service.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Entity
@Table(name = "employee_xp")
@Getter @Setter @NoArgsConstructor
public class EmployeeXP {

    @Id
    private Long employeeId;        // employee-service ka same ID

    private int totalXp;            // lifetime earned XP
    private String level;           // ROOKIE / REGULAR / PRO / LEGEND
    private int currentStreak;      // consecutive days submitted
    private int longestStreak;      // all-time best streak
    private LocalDate lastSubmitDate; // streak track karne ke liye
}
