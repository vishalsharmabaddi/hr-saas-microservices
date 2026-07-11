package com.hrsaas.project_service.service;

import com.hrsaas.project_service.dto.TaskRequest;
import com.hrsaas.project_service.dto.TaskResponse;
import com.hrsaas.project_service.enums.TaskStatus;
import com.hrsaas.project_service.model.Task;
import com.hrsaas.project_service.model.TaskList;
import com.hrsaas.project_service.producer.TaskEventProducer;
import com.hrsaas.project_service.repository.TaskListRepository;
import com.hrsaas.project_service.repository.TaskRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

// Task edit ownership — sirf creator ya MANAGER+ edit kare; status sabke liye khula. Repos mock.
class TaskServiceOwnershipTest {

    private TaskRepository taskRepo;
    private TaskService taskService;

    @BeforeEach
    void setup() {
        taskRepo = mock(TaskRepository.class);
        TaskListRepository taskListRepo = mock(TaskListRepository.class);
        TaskEventProducer producer = mock(TaskEventProducer.class);
        taskService = new TaskService(taskRepo, taskListRepo, producer);
    }

    // company 1 ka task, banaya "owner@acme.com" ne
    private Task existingTask() {
        TaskList tl = new TaskList();
        tl.setId(5L);
        Task task = new Task();
        task.setId(10L);
        task.setCompanyId(1L);
        task.setCreatedByEmail("owner@acme.com");
        task.setStatus(TaskStatus.OPEN);
        task.setTaskList(tl);
        when(taskRepo.findById(10L)).thenReturn(Optional.of(task));
        when(taskRepo.save(any(Task.class))).thenAnswer(inv -> inv.getArgument(0));
        return task;
    }

    private TaskRequest editReq() {
        TaskRequest req = new TaskRequest();
        req.setTitle("Updated title");
        return req;
    }

    @Test
    void ownerCanEditOwnTask() {
        existingTask();
        TaskResponse res = taskService.updateTask(1L, 10L, editReq(), "EMPLOYEE", "owner@acme.com");
        assertThat(res.getTitle()).isEqualTo("Updated title");
    }

    @Test
    void nonOwnerEmployeeCannotEdit() {
        existingTask();
        assertThatThrownBy(() -> taskService.updateTask(1L, 10L, editReq(), "EMPLOYEE", "someoneelse@acme.com"))
                .isInstanceOf(ResponseStatusException.class)
                .satisfies(e -> assertThat(((ResponseStatusException) e).getStatusCode().value()).isEqualTo(403));
    }

    @Test
    void managerCanEditAnyTask() {
        existingTask();
        TaskResponse res = taskService.updateTask(1L, 10L, editReq(), "MANAGER", "someoneelse@acme.com");
        assertThat(res.getTitle()).isEqualTo("Updated title");
    }

    @Test
    void anyoneCanChangeStatus() {
        existingTask();
        // koi role/email nahi — status change sabke liye khula hai
        TaskResponse res = taskService.updateStatus(1L, 10L, TaskStatus.IN_PROGRESS);
        assertThat(res.getStatus()).isEqualTo(TaskStatus.IN_PROGRESS);
    }
}
