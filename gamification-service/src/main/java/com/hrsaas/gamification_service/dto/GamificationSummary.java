package com.hrsaas.gamification_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
public class GamificationSummary {
    private String email;
    private int totalXp;
    private String level;
    private int currentStreak;
    private int longestStreak;
    private List<String> badges;    // earned badge names
    private int xpToNextLevel;      // kitna XP aur chahiye
}
