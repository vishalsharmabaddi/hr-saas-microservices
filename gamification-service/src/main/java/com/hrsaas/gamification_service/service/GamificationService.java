package com.hrsaas.gamification_service.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.hrsaas.gamification_service.dto.GamificationSummary;
import com.hrsaas.gamification_service.dto.LeaderboardEntry;
import com.hrsaas.gamification_service.dto.TeamMemberEngagement;
import com.hrsaas.gamification_service.entity.Badge;
import com.hrsaas.gamification_service.entity.EmployeeXP;
import com.hrsaas.gamification_service.entity.XPHistory;
import com.hrsaas.gamification_service.repository.BadgeRepository;
import com.hrsaas.gamification_service.repository.EmployeeXPRepository;
import com.hrsaas.gamification_service.repository.XPHistoryRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class GamificationService {

    private final EmployeeXPRepository xpRepo;
    private final XPHistoryRepository historyRepo;
    private final BadgeRepository badgeRepo;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    // XP rules
    private static final int XP_ON_TIME = 10;
    private static final int XP_LATE    = 5;

    // Level thresholds
    private static final int REGULAR_THRESHOLD = 100;
    private static final int PRO_THRESHOLD      = 500;
    private static final int LEGEND_THRESHOLD   = 1500;

    @Transactional
    public void processTimeLog(Long employeeId, LocalDate logDate, double hoursLogged) {
        // 1. Get or create employee XP record
        EmployeeXP xp = xpRepo.findById(employeeId).orElseGet(() -> {
            EmployeeXP fresh = new EmployeeXP();
            fresh.setEmployeeId(employeeId);
            fresh.setLevel("ROOKIE");
            return fresh;
        });

        // 2. Decide XP: on-time = same day submit, late = past day
        boolean isOnTime = !logDate.isBefore(LocalDate.now());
        int earned = isOnTime ? XP_ON_TIME : XP_LATE;
        String reason = isOnTime ? "ON_TIME_SUBMIT" : "LATE_SUBMIT";

        // 3. Update streak
        updateStreak(xp, logDate);

        // 4. Add XP + update level
        xp.setTotalXp(xp.getTotalXp() + earned);
        xp.setLevel(calculateLevel(xp.getTotalXp()));
        xpRepo.save(xp);

        // 5. Save history record
        XPHistory history = new XPHistory();
        history.setEmployeeId(employeeId);
        history.setLogDate(logDate);
        history.setXpGained(earned);
        history.setReason(reason);
        historyRepo.save(history);

        // 6. Check and award badges
        checkBadges(employeeId, xp.getCurrentStreak());

        log.info("XP processed → employeeId={} earned={}XP reason={} streak={} level={}",
                employeeId, earned, reason, xp.getCurrentStreak(), xp.getLevel());
    }

    private void updateStreak(EmployeeXP xp, LocalDate logDate) {
        LocalDate last = xp.getLastSubmitDate();

        if (last == null) {
            // First ever submission
            xp.setCurrentStreak(1);
        } else if (logDate.equals(last.plusDays(1))) {
            // Consecutive day — streak continues
            xp.setCurrentStreak(xp.getCurrentStreak() + 1);
        } else if (logDate.isAfter(last.plusDays(1))) {
            // Gap found — streak resets
            xp.setCurrentStreak(1);
        }
        // Same day submit again — streak stays same, no double count

        if (xp.getCurrentStreak() > xp.getLongestStreak()) {
            xp.setLongestStreak(xp.getCurrentStreak());
        }
        xp.setLastSubmitDate(logDate);
    }

    private String calculateLevel(int totalXp) {
        if (totalXp >= LEGEND_THRESHOLD)  return "LEGEND";
        if (totalXp >= PRO_THRESHOLD)     return "PRO";
        if (totalXp >= REGULAR_THRESHOLD) return "REGULAR";
        return "ROOKIE";
    }

    private void checkBadges(Long employeeId, int currentStreak) {
        // HOT_STREAK: 5 consecutive days
        if (currentStreak >= 5 && !badgeRepo.existsByEmployeeIdAndBadgeType(employeeId, "HOT_STREAK")) {
            awardBadge(employeeId, "HOT_STREAK");
        }
        // IRON_STREAK: 30 consecutive days
        if (currentStreak >= 30 && !badgeRepo.existsByEmployeeIdAndBadgeType(employeeId, "IRON_STREAK")) {
            awardBadge(employeeId, "IRON_STREAK");
        }
    }

    private void awardBadge(Long employeeId, String badgeType) {
        Badge badge = new Badge();
        badge.setEmployeeId(employeeId);
        badge.setBadgeType(badgeType);
        badge.setEarnedAt(LocalDateTime.now());
        badgeRepo.save(badge);
        log.info("Badge awarded → employeeId={} badge={}", employeeId, badgeType);
    }

    // ── REST API methods ─────────────────────────────────────────────────────

    public GamificationSummary getSummary(Long employeeId) {
        EmployeeXP xp = xpRepo.findById(employeeId).orElseGet(() -> {
            EmployeeXP empty = new EmployeeXP();
            empty.setEmployeeId(employeeId);
            empty.setLevel("ROOKIE");
            return empty;
        });

        List<String> badges = badgeRepo.findByEmployeeId(employeeId)
                .stream().map(Badge::getBadgeType).collect(Collectors.toList());

        return new GamificationSummary(
                employeeId,
                xp.getTotalXp(),
                xp.getLevel(),
                xp.getCurrentStreak(),
                xp.getLongestStreak(),
                badges,
                xpToNextLevel(xp.getTotalXp())
        );
    }

    public List<XPHistory> getHistory(Long employeeId) {
        return historyRepo.findByEmployeeIdOrderByLogDateDesc(employeeId);
    }

    public List<LeaderboardEntry> getLeaderboard() {
        return xpRepo.findAll(PageRequest.of(0, 5,
                        org.springframework.data.domain.Sort.by("totalXp").descending()))
                .stream()
                .map(x -> new LeaderboardEntry(x.getEmployeeId(), x.getTotalXp(),
                        x.getLevel(), x.getCurrentStreak()))
                .collect(Collectors.toList());
    }

    public List<TeamMemberEngagement> getTeamEngagement() {
        return xpRepo.findAll().stream()
                .map(x -> {
                    List<String> badges = badgeRepo.findByEmployeeId(x.getEmployeeId())
                            .stream().map(Badge::getBadgeType).collect(Collectors.toList());
                    String status = x.getCurrentStreak() >= 3 ? "ON_FIRE"
                            : x.getCurrentStreak() > 0 ? "ACTIVE"
                            : "AT_RISK";
                    return new TeamMemberEngagement(
                            x.getEmployeeId(), x.getTotalXp(), x.getLevel(),
                            x.getCurrentStreak(), x.getLongestStreak(), badges, status);
                })
                .sorted((a, b) -> b.getCurrentStreak() - a.getCurrentStreak())
                .collect(Collectors.toList());
    }

    public void sendNudge(Long employeeId, String employeeName) {
        try {
            Map<String, Object> payload = new HashMap<>();
            payload.put("employeeId", employeeId);
            payload.put("employeeName", employeeName);
            payload.put("message", "Your manager recognized your work — keep it up!");
            kafkaTemplate.send("employee-nudge", objectMapper.writeValueAsString(payload));
            log.info("Nudge sent → employeeId={}", employeeId);
        } catch (Exception e) {
            log.error("Failed to send nudge: {}", e.getMessage());
        }
    }

    private int xpToNextLevel(int totalXp) {
        if (totalXp < REGULAR_THRESHOLD) return REGULAR_THRESHOLD - totalXp;
        if (totalXp < PRO_THRESHOLD)     return PRO_THRESHOLD - totalXp;
        if (totalXp < LEGEND_THRESHOLD)  return LEGEND_THRESHOLD - totalXp;
        return 0; // already LEGEND
    }
}
