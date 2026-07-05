package com.hrsaas.project_service.service;

import com.hrsaas.project_service.dto.TaskRequest;
import com.hrsaas.project_service.dto.TaskResponse;
import com.hrsaas.project_service.exception.ResourceNotFoundException;
import com.hrsaas.project_service.model.Task;
import com.hrsaas.project_service.model.TaskList;
import com.hrsaas.project_service.producer.TaskEventProducer;
import com.hrsaas.project_service.repository.TaskAssigneeRepository;
import com.hrsaas.project_service.repository.TaskListRepository;
import com.hrsaas.project_service.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final TaskListRepository taskListRepository;
    private final TaskEventProducer taskEventProducer;

    public TaskResponse createTask(Long companyId, TaskRequest request) {
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
        TaskResponse response = toResponse(taskRepository.save(task));
        // Kafka event — notification-service ko batao
        taskEventProducer.sendTaskAssignedEvent(response.getId(), companyId, request.getTitle());
        return response;
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

    public TaskResponse updateTask(Long companyId, Long taskId, TaskRequest request) {
        Task task = taskRepository.findById(taskId)
            .filter(t -> t.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
        task.setTitle(request.getTitle());
        task.setDescription(request.getDescription());
        task.setPriority(request.getPriority());
        task.setDueDate(request.getDueDate());
        task.setEstimatedHours(request.getEstimatedHours());
        return toResponse(taskRepository.save(task));
    }

    public void deleteTask(Long companyId, Long taskId) {
        Task task = taskRepository.findById(taskId)
            .filter(t -> t.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
        taskRepository.delete(task);
    }

    private TaskResponse toResponse(Task t) {
        TaskResponse res = new TaskResponse();
        res.setId(t.getId());
        res.setCompanyId(t.getCompanyId());
        res.setTaskListId(t.getTaskList().getId());
        res.setTitle(t.getTitle());
        res.setDescription(t.getDescription());
        res.setStatus(t.getStatus());
        res.setPriority(t.getPriority());
        res.setDueDate(t.getDueDate());
        res.setEstimatedHours(t.getEstimatedHours());
        res.setCreatedAt(t.getCreatedAt());
        return res;
    }
}
