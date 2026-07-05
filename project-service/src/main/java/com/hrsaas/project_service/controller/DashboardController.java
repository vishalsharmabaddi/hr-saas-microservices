package com.hrsaas.project_service.controller;

import com.hrsaas.project_service.enums.TaskStatus;
import com.hrsaas.project_service.repository.IssueRepository;
import com.hrsaas.project_service.repository.MilestoneRepository;
import com.hrsaas.project_service.repository.ProjectRepository;
import com.hrsaas.project_service.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RefreshScope
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final MilestoneRepository milestoneRepository;
    private final IssueRepository issueRepository;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestHeader("X-Company-Id") Long companyId) {

        long totalProjects = projectRepository.findByCompanyId(companyId).size();
        long openTasks = taskRepository.findByCompanyIdAndStatus(companyId, TaskStatus.OPEN).size();
        long inProgressTasks = taskRepository.findByCompanyIdAndStatus(companyId, TaskStatus.IN_PROGRESS).size();
        long completedTasks = taskRepository.findByCompanyIdAndStatus(companyId, TaskStatus.COMPLETED).size();

        return ResponseEntity.ok(Map.of(
            "totalProjects", totalProjects,
            "openTasks", openTasks,
            "inProgressTasks", inProgressTasks,
            "completedTasks", completedTasks
        ));
    }
}
