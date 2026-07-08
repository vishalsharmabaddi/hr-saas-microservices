package com.hrsaas.gamification_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class TeamMemberEngagement {
    private Long employeeId;
    private int totalXp;
    private String level;
    private int currentStreak;
    private int longestStreak;
    private List<String> badges;
    private String status; // ON_FIRE, ACTIVE, AT_RISK
}
