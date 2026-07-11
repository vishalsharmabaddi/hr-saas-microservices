package com.hrsaas.gamification_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class LeaderboardEntry {
    private String email;
    private int totalXp;
    private String level;
    private int currentStreak;
}
