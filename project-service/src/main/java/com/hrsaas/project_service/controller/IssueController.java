package com.hrsaas.project_service.controller;

import com.hrsaas.project_service.enums.IssueSeverity;
import com.hrsaas.project_service.enums.IssueStatus;
import com.hrsaas.project_service.model.Issue;
import com.hrsaas.project_service.service.IssueService;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RefreshScope
@RestController
@RequestMapping("/api/projects/{projectId}/issues")
@RequiredArgsConstructor
public class IssueController {

    private final IssueService issueService;

    @PostMapping
    public ResponseEntity<Issue> createIssue(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long projectId,
            @RequestBody Map<String, String> body) {
        IssueSeverity severity = body.get("severity") != null
            ? IssueSeverity.valueOf(body.get("severity")) : IssueSeverity.MEDIUM;
        Long reportedBy = body.get("reportedBy") != null
            ? Long.valueOf(body.get("reportedBy")) : null;
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(issueService.createIssue(
                companyId, projectId,
                body.get("title"),
                body.get("description"),
                severity, reportedBy));
    }

    @GetMapping
    public ResponseEntity<List<Issue>> getIssues(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long projectId) {
        return ResponseEntity.ok(issueService.getIssuesByProject(companyId, projectId));
    }

    @PatchMapping("/{issueId}/status")
    public ResponseEntity<Issue> updateStatus(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long projectId,
            @PathVariable Long issueId,
            @RequestParam IssueStatus status,
            @RequestParam(required = false) Long assignedTo) {
        return ResponseEntity.ok(issueService.updateStatus(companyId, issueId, status, assignedTo));
    }

    @DeleteMapping("/{issueId}")
    public ResponseEntity<Void> deleteIssue(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long projectId,
            @PathVariable Long issueId) {
        issueService.deleteIssue(companyId, issueId);
        return ResponseEntity.noContent().build();
    }
}
