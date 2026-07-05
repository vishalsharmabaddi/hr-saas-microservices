package com.hrsaas.project_service.controller;

import com.hrsaas.project_service.enums.MilestoneStatus;
import com.hrsaas.project_service.model.Milestone;
import com.hrsaas.project_service.service.MilestoneService;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RefreshScope
@RestController
@RequestMapping("/api/projects/{projectId}/milestones")
@RequiredArgsConstructor
public class MilestoneController {

    private final MilestoneService milestoneService;

    @PostMapping
    public ResponseEntity<Milestone> createMilestone(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long projectId,
            @RequestBody Map<String, String> body) {
        LocalDate dueDate = body.get("dueDate") != null
            ? LocalDate.parse(body.get("dueDate")) : null;
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(milestoneService.createMilestone(
                companyId, projectId,
                body.get("name"),
                body.get("description"),
                dueDate));
    }

    @GetMapping
    public ResponseEntity<List<Milestone>> getMilestones(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long projectId) {
        return ResponseEntity.ok(milestoneService.getMilestonesByProject(companyId, projectId));
    }

    @PatchMapping("/{milestoneId}/status")
    public ResponseEntity<Milestone> updateStatus(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long projectId,
            @PathVariable Long milestoneId,
            @RequestParam MilestoneStatus status) {
        return ResponseEntity.ok(milestoneService.updateStatus(companyId, milestoneId, status));
    }

    @DeleteMapping("/{milestoneId}")
    public ResponseEntity<Void> deleteMilestone(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long projectId,
            @PathVariable Long milestoneId) {
        milestoneService.deleteMilestone(companyId, milestoneId);
        return ResponseEntity.noContent().build();
    }
}
