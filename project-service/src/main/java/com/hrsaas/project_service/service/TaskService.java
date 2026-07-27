package com.hrsaas.project_service.service;

import com.hrsaas.project_service.dto.AssigneeInfo;
import com.hrsaas.project_service.dto.AssigneeStats;
import com.hrsaas.project_service.dto.TaskRequest;
import com.hrsaas.project_service.dto.TaskResponse;
import com.hrsaas.project_service.enums.TaskStatus;
import com.hrsaas.project_service.exception.ResourceNotFoundException;
import com.hrsaas.project_service.model.Task;
import com.hrsaas.project_service.model.TaskAssignee;
import com.hrsaas.project_service.model.TaskList;
import com.hrsaas.project_service.producer.TaskEventProducer;
import com.hrsaas.project_service.repository.ProjectMemberRepository;
import com.hrsaas.project_service.repository.TaskAssigneeRepository;
import com.hrsaas.project_service.repository.TaskListRepository;
import com.hrsaas.project_service.repository.TaskRepository;
import com.hrsaas.project_service.security.RoleGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskListRepository taskListRepository;
    private final TaskAssigneeRepository taskAssigneeRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final TaskEventProducer taskEventProducer;

    public TaskResponse createTask(Long companyId, TaskRequest request, String createdByEmail) {
        TaskList taskList = taskListRepository.findById(request.getTaskListId())
            .filter(t -> t.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("TaskList not found: " + request.getTaskListId()));

        Task task = new Task();
        task.setCompanyId(companyId);
        task.setTaskList(taskList);
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setPriority(request.getPriority());
        task.setDueDate(request.getDueDate());
        task.setEstimatedHours(request.getEstimatedHours());
        task.setCreatedByEmail(createdByEmail);     // ownership ke liye — kisne banaya
        // Assignment (and its notification) happens via PUT /{id}/assignees, not on create.
        return toResponse(taskRepository.save(task));
    }

    public List<TaskResponse> getTasksByTaskList(Long companyId, Long taskListId) {
        return taskRepository.findByTaskListIdAndCompanyId(taskListId, companyId)
            .stream().map(this::toResponse).toList();
    }

    public TaskResponse getTaskById(Long companyId, Long taskId) {
        Task task = taskRepository.findById(taskId)
            .filter(t -> t.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
        return toResponse(task);
    }

    public TaskResponse updateTask(Long companyId, Long taskId, TaskRequest request, String role, String email) {
        Task task = taskRepository.findById(taskId)
            .filter(t -> t.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));

        // Ownership: sirf MANAGER+ ya jisne task banaya wahi edit kar sakta hai
        boolean isManager = "ADMIN".equalsIgnoreCase(role) || "MANAGER".equalsIgnoreCase(role);
        boolean isOwner = task.getCreatedByEmail() != null && task.getCreatedByEmail().equalsIgnoreCase(email);
        if (!isManager && !isOwner) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Only the task creator or a manager can edit this task");
        }

        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setPriority(request.getPriority());
        task.setDueDate(request.getDueDate());
        task.setEstimatedHours(request.getEstimatedHours());
        return toResponse(taskRepository.save(task));
    }

    // Status-only update — sabke liye khula (collaborative). Ownership yahan nahi lagti.
    public TaskResponse updateStatus(Long companyId, Long taskId, TaskStatus status) {
        Task task = taskRepository.findById(taskId)
            .filter(t -> t.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
        task.setStatus(status);
        return toResponse(taskRepository.save(task));
    }

    // Replace the task's assignee set. Only a manager can assign, and every assignee
    // must already be a member of the task's project.
    @Transactional
    public TaskResponse assignTask(Long companyId, Long taskId, List<AssigneeInfo> assignees, String role) {
        RoleGuard.requireManager(role);
        Task task = taskRepository.findById(taskId)
            .filter(t -> t.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));

        Long projectId = task.getTaskList().getProject().getId();

        // Replace model — drop the old set, then insert the new one.
        taskAssigneeRepository.deleteAll(taskAssigneeRepository.findByTaskId(taskId));
        taskAssigneeRepository.flush();   // avoid unique-constraint clash on re-assign

        List<AssigneeInfo> desired = assignees == null ? List.of() : assignees;
        for (AssigneeInfo a : desired) {
            projectMemberRepository.findByProjectIdAndEmployeeId(projectId, a.getEmployeeId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Employee " + a.getEmployeeId() + " is not a member of this project"));

            TaskAssignee ta = new TaskAssignee();
            ta.setCompanyId(companyId);
            ta.setTask(task);
            ta.setEmployeeId(a.getEmployeeId());
            ta.setEmail(a.getEmail());
            ta.setName(a.getName());
            taskAssigneeRepository.save(ta);

            // Notify the assignee (Phase 2 consumer turns this into a WebSocket ping).
            taskEventProducer.sendTaskAssignedEvent(
                companyId, taskId, task.getTitle(), a.getEmployeeId(), a.getEmail(), a.getName());
        }
        return toResponse(task);
    }

    // Per-assignee workload for a project: total tasks held and how many are completed.
    public List<AssigneeStats> getAssigneeStats(Long companyId, Long projectId) {
        Map<Long, AssigneeStats> byEmployee = new LinkedHashMap<>();
        for (TaskAssignee a : taskAssigneeRepository.findByProject(companyId, projectId)) {
            AssigneeStats s = byEmployee.computeIfAbsent(a.getEmployeeId(),
                k -> new AssigneeStats(a.getEmployeeId(), a.getEmail(), a.getName(), 0, 0));
            s.setTotalTasks(s.getTotalTasks() + 1);
            if (a.getTask().getStatus() == TaskStatus.COMPLETED) {
                s.setCompletedTasks(s.getCompletedTasks() + 1);
            }
        }
        return new ArrayList<>(byEmployee.values());
    }

    // Cross-project "My Tasks" — every task the given user is assigned to, company-scoped.
    public List<TaskResponse> getMyAssignedTasks(Long companyId, String email) {
        if (email == null || email.isBlank()) return List.of();
        return taskAssigneeRepository.findByCompanyIdAndEmailIgnoreCase(companyId, email).stream()
            .map(a -> toResponse(a.getTask()))
            .toList();
    }

    @Transactional
    public void deleteTask(Long companyId, Long taskId) {
        Task task = taskRepository.findById(taskId)
            .filter(t -> t.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
        // Clear assignees first — their FK to the task would otherwise block the delete.
        taskAssigneeRepository.deleteAll(taskAssigneeRepository.findByTaskId(taskId));
        taskRepository.delete(task);
    }

    private TaskResponse toResponse(Task t) {
        TaskResponse res = new TaskResponse();
        res.setId(t.getId());
        res.setCompanyId(t.getCompanyId());
        res.setTaskListId(t.getTaskList().getId());
        res.setProjectId(t.getTaskList().getProject().getId());
        res.setProjectName(t.getTaskList().getProject().getName());
        res.setTitle(t.getTitle());
        res.setDescription(t.getDescription());
        res.setStatus(t.getStatus());
        res.setPriority(t.getPriority());
        res.setDueDate(t.getDueDate());
        res.setEstimatedHours(t.getEstimatedHours());
        res.setCreatedByEmail(t.getCreatedByEmail());
        res.setCreatedAt(t.getCreatedAt());
        res.setAssignees(
            taskAssigneeRepository.findByTaskId(t.getId()).stream()
                .map(a -> new AssigneeInfo(a.getEmployeeId(), a.getEmail(), a.getName()))
                .toList());
        return res;
    }
}
