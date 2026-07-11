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

    // "Mera" XP summary — identity token se (X-Company-Id + X-User-Email), path se nahi
    @GetMapping("/summary")
    public ResponseEntity<GamificationSummary> getSummary(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader("X-User-Email") String email) {
        return ResponseEntity.ok(gamificationService.getSummary(companyId, email));
    }

    // "Meri" XP history (har din kitna mila)
    @GetMapping("/history")
    public ResponseEntity<List<XPHistory>> getHistory(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader("X-User-Email") String email) {
        return ResponseEntity.ok(gamificationService.getHistory(companyId, email));
    }

    // Top 5 leaderboard — SIRF meri company ka (tenant isolation)
    @GetMapping("/leaderboard")
    public ResponseEntity<List<LeaderboardEntry>> getLeaderboard(
            @RequestHeader("X-Company-Id") Long companyId) {
        return ResponseEntity.ok(gamificationService.getLeaderboard(companyId));
    }

    // Full team engagement — SIRF meri company ka (manager view)
    @GetMapping("/team")
    public ResponseEntity<List<TeamMemberEngagement>> getTeamEngagement(
            @RequestHeader("X-Company-Id") Long companyId) {
        return ResponseEntity.ok(gamificationService.getTeamEngagement(companyId));
    }

    // Appreciation nudge — target email body me
    @PostMapping("/nudge")
    public ResponseEntity<Void> sendNudge(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestBody Map<String, String> body) {
        gamificationService.sendNudge(companyId,
                body.getOrDefault("email", ""),
                body.getOrDefault("employeeName", "Employee"));
        return ResponseEntity.ok().build();
    }
}
