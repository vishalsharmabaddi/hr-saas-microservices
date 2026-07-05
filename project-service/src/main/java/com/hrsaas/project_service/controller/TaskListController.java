package com.hrsaas.project_service.controller;

import com.hrsaas.project_service.model.TaskList;
import com.hrsaas.project_service.service.TaskListService;
import lombok.RequiredArgsConstructor;
import org.springframework.cloud.context.config.annotation.RefreshScope;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RefreshScope
@RestController
@RequestMapping("/api/projects/{projectId}/tasklists")
@RequiredArgsConstructor
public class TaskListController {

    private final TaskListService taskListService;

    @PostMapping
    public ResponseEntity<TaskList> createTaskList(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long projectId,
            @RequestBody Map<String, String> body) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(taskListService.createTaskList(
                companyId, projectId,
                body.get("name"),
                body.get("description")));
    }

    @GetMapping
    public ResponseEntity<List<TaskList>> getTaskLists(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long projectId) {
        return ResponseEntity.ok(taskListService.getTaskListsByProject(companyId, projectId));
    }

    @DeleteMapping("/{taskListId}")
    public ResponseEntity<Void> deleteTaskList(
            @RequestHeader("X-Company-Id") Long companyId,
            @PathVariable Long projectId,
            @PathVariable Long taskListId) {
        taskListService.deleteTaskList(companyId, taskListId);
        return ResponseEntity.noContent().build();
    }
}
