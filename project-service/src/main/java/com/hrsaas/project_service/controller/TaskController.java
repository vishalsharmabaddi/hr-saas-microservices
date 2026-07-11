package com.hrsaas.project_service.controller;

import com.hrsaas.project_service.dto.StatusUpdateRequest;
import com.hrsaas.project_service.dto.TaskRequest;
import com.hrsaas.project_service.dto.TaskResponse;
import com.hrsaas.project_service.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.http.HttpStatus;
import com.hrsaas.project_service.security.RoleGuard;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RefreshScope
@RestController
@RequestMapping("/api/tasks")
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    @PostMapping
    public ResponseEntity<TaskResponse> createTask(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @RequestBody TaskRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(taskService.createTask(companyId, request, email));
    }

    @GetMapping("/tasklist/{taskListId}")
    public ResponseEntity<List<TaskResponse>> getTasksByTaskList(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long taskListId) {
        return ResponseEntity.ok(taskService.getTasksByTaskList(companyId, taskListId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TaskResponse> getTaskById(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long id) {
        return ResponseEntity.ok(taskService.getTaskById(companyId, id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<TaskResponse> updateTask(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @RequestHeader(value = "X-User-Email", required = false) String email,
            @PathVariable Long id,
            @RequestBody TaskRequest request) {
        return ResponseEntity.ok(taskService.updateTask(companyId, id, request, role, email));
    }

    // Status-only change — collaborative, sabke liye khula (koi RoleGuard nahi)
    @PatchMapping("/{id}/status")
    public ResponseEntity<TaskResponse> updateStatus(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long id,
            @RequestBody StatusUpdateRequest request) {
        return ResponseEntity.ok(taskService.updateStatus(companyId, id, request.getStatus()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(
            @RequestHeader("X-Company-Id") Long companyId,
            @RequestHeader(value = "X-User-Role", required = false) String role,
            @PathVariable Long id) {
        RoleGuard.requireManager(role);
        taskService.deleteTask(companyId, id);
        return ResponseEntity.noContent().build();
    }
}
