package com.hrsaas.project_service.controller;

import com.hrsaas.project_service.enums.TaskStatus;
import com.hrsaas.project_service.repository.IssueRepository;
import com.hrsaas.project_service.repository.MilestoneRepository;
import com.hrsaas.project_service.repository.ProjectRepository;
import com.hrsaas.project_service.repository.TaskRepository;
import com.hrsaas.project_service.repository.TimeLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RefreshScope
@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final TimeLogRepository timeLogRepository;
    private final MilestoneRepository milestoneRepository;
    private final IssueRepository issueRepository;

    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @RequestHeader("X-Company-Id") Long companyId) {

        long totalProjects  = projectRepository.findByCompanyId(companyId).size();
        long openTasks      = taskRepository.findByCompanyIdAndStatus(companyId, TaskStatus.OPEN).size();
        long inProgressTasks= taskRepository.findByCompanyIdAndStatus(companyId, TaskStatus.IN_PROGRESS).size();
        long completedTasks = taskRepository.findByCompanyIdAndStatus(companyId, TaskStatus.COMPLETED).size();

        List<Map<String, Object>> recentProjects = projectRepository
            .findTop5ByCompanyIdOrderByCreatedAtDesc(companyId)
            .stream()
            .map(p -> Map.<String, Object>of(
                "id",        p.getId(),
                "name",      p.getName(),
                "status",    p.getStatus().name(),
                "createdAt", p.getCreatedAt().toString()
            ))
            .toList();

        List<Map<String, Object>> recentLogs = timeLogRepository
            .findTop5ByCompanyIdOrderByCreatedAtDesc(companyId)
            .stream()
            .map(t -> {
                Map<String, Object> m = new HashMap<>();
                m.put("id",          t.getId());
                m.put("taskId",      t.getTask().getId());
                m.put("employeeId",  t.getEmployeeId());
                m.put("logDate",     t.getLogDate().toString());
                m.put("hoursLogged", t.getHoursLogged());
                m.put("notes",       t.getNotes());
                return m;
            })
            .toList();

        Map<String, Object> response = new HashMap<>();
        response.put("totalProjects",   totalProjects);
        response.put("openTasks",       openTasks);
        response.put("inProgressTasks", inProgressTasks);
        response.put("completedTasks",  completedTasks);
        response.put("recentProjects",  recentProjects);
        response.put("recentLogs",      recentLogs);

        return ResponseEntity.ok(response);
    }
}
