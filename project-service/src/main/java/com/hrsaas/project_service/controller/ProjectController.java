package com.hrsaas.project_service.controller;

import com.hrsaas.project_service.dto.ProjectRequest;
import com.hrsaas.project_service.dto.ProjectResponse;
import com.hrsaas.project_service.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RefreshScope
@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestBody ProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(projectService.createProject(companyId, request));
    }

    @GetMapping
    public ResponseEntity<List<ProjectResponse>> getAllProjects(
            @RequestHeader("X-Company-Id") Long companyId) {
        return ResponseEntity.ok(projectService.getProjectsByCompany(companyId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProjectResponse> getProjectById(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(companyId, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ProjectResponse> updateProject(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long id,
            @RequestBody ProjectRequest request) {
        return ResponseEntity.ok(projectService.updateProject(companyId, id, request));
    }
}
