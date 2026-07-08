package com.hrsaas.gamification_service.controller;

import com.hrsaas.gamification_service.dto.GamificationSummary;
import com.hrsaas.gamification_service.dto.LeaderboardEntry;
import com.hrsaas.gamification_service.dto.TeamMemberEngagement;
import com.hrsaas.gamification_service.entity.XPHistory;
import com.hrsaas.gamification_service.service.GamificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/gamification")
@RequiredArgsConstructor
public class GamificationController {

    private final GamificationService gamificationService;

    // Employee ka XP, level, streak, badges summary
    @GetMapping("/{employeeId}/summary")
    public ResponseEntity<GamificationSummary> getSummary(@PathVariable Long employeeId) {
        return ResponseEntity.ok(gamificationService.getSummary(employeeId));
    }

    // Employee ki XP history (har din kitna mila)
    @GetMapping("/{employeeId}/history")
    public ResponseEntity<List<XPHistory>> getHistory(@PathVariable Long employeeId) {
        return ResponseEntity.ok(gamificationService.getHistory(employeeId));
    }

    // Top 5 leaderboard
    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntry>> getLeaderboard() {
        return ResponseEntity.ok(gamificationService.getLeaderboard());
    }

    // Full team engagement — manager view
    @GetMapping("/team")
    public ResponseEntity<List<TeamMemberEngagement>> getTeamEngagement() {
        return ResponseEntity.ok(gamificationService.getTeamEngagement());
    }

    // Send appreciation nudge to employee via Kafka
    @PostMapping("/{employeeId}/nudge")
    public ResponseEntity<Void> sendNudge(
            @PathVariable Long employeeId,
            @RequestBody Map<String, String> body) {
        gamificationService.sendNudge(employeeId, body.getOrDefault("employeeName", "Employee"));
        return ResponseEntity.ok().build();
    }
}
