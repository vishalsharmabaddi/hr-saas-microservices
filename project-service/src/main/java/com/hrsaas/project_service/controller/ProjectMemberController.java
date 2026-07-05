package com.hrsaas.project_service.controller;

import com.hrsaas.project_service.enums.ProjectRole;
import com.hrsaas.project_service.model.ProjectMember;
import com.hrsaas.project_service.service.ProjectMemberService;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RefreshScope
@RestController
@RequestMapping("/api/projects/{projectId}/members")
@RequiredArgsConstructor
public class ProjectMemberController {

    private final ProjectMemberService projectMemberService;

    @PostMapping
    public ResponseEntity<ProjectMember> addMember(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long projectId,
            @RequestBody Map<String, String> body) {
        Long employeeId = Long.valueOf(body.get("employeeId"));
        ProjectRole role = ProjectRole.valueOf(body.get("role"));
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(projectMemberService.addMember(companyId, projectId, employeeId, role));
    }

    @GetMapping
    public ResponseEntity<List<ProjectMember>> getMembers(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long projectId) {
        return ResponseEntity.ok(projectMemberService.getMembersByProject(companyId, projectId));
    }

    @DeleteMapping("/{memberId}")
    public ResponseEntity<Void> removeMember(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long projectId,
            @PathVariable Long memberId) {
        projectMemberService.removeMember(companyId, memberId);
        return ResponseEntity.noContent().build();
    }
}
