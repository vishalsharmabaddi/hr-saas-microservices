package com.hrsaas.project_service;

import com.hrsaas.project_service.dto.TimeLogRequest;
import com.hrsaas.project_service.dto.TimeLogResponse;
import com.hrsaas.project_service.model.Task;
import com.hrsaas.project_service.model.TaskList;
import com.hrsaas.project_service.model.TimeLog;
import com.hrsaas.project_service.repository.TaskRepository;
import com.hrsaas.project_service.repository.TimeLogRepository;
import com.hrsaas.project_service.service.TimeLogService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TimeLogServiceTest {

    @Mock
    private TimeLogRepository timeLogRepository;

    @Mock
    private TaskRepository taskRepository;

    @InjectMocks
    private TimeLogService timeLogService;

    @Test
    void logTime_shouldSaveAndReturnResponse() {
        // ARRANGE
        Long companyId = 1L;

        TaskList taskList = new TaskList();
        taskList.setId(1L);

        Task task = new Task();
        task.setId(10L);
        task.setCompanyId(companyId);
        task.setTitle("Design login page");
        task.setTaskList(taskList);

        TimeLogRequest request = new TimeLogRequest();
        request.setTaskId(10L);
        request.setEmployeeId(5L);
        request.setLogDate(LocalDate.of(2026, 7, 5));
        request.setHoursLogged(3.5);
        request.setNotes("Completed the wireframe and color palette selection");

        TimeLog saved = new TimeLog();
        saved.setId(1L);
        saved.setCompanyId(companyId);
        saved.setTask(task);
        saved.setEmployeeId(5L);
        saved.setLogDate(LocalDate.of(2026, 7, 5));
        saved.setHoursLogged(3.5);
        saved.setNotes("Completed the wireframe and color palette selection");

        when(taskRepository.findById(10L)).thenReturn(Optional.of(task));
        when(timeLogRepository.save(any(TimeLog.class))).thenReturn(saved);

        // ACT
        TimeLogResponse response = timeLogService.logTime(companyId, "amit@acme.com", request);

        // ASSERT
        assertThat(response).isNotNull();
        assertThat(response.getHoursLogged()).isEqualTo(3.5);
        assertThat(response.getNotes()).isEqualTo("Completed the wireframe and color palette selection");
        assertThat(response.getEmployeeId()).isEqualTo(5L);
    }

    @Test
    void getLogsByTask_shouldReturnList() {
        // ARRANGE
        Long companyId = 1L;
        Long taskId = 10L;

        TaskList taskList = new TaskList();
        taskList.setId(1L);

        Task task = new Task();
        task.setId(taskId);
        task.setCompanyId(companyId);
        task.setTaskList(taskList);

        TimeLog log = new TimeLog();
        log.setId(1L);
        log.setCompanyId(companyId);
        log.setTask(task);
        log.setEmployeeId(5L);
        log.setHoursLogged(2.0);
        log.setLogDate(LocalDate.of(2026, 7, 5));
        log.setNotes("Fixed navbar bug");

        when(timeLogRepository.findByTaskIdAndCompanyId(taskId, companyId))
            .thenReturn(List.of(log));

        // ACT
        List<TimeLogResponse> result = timeLogService.getLogsByTask(companyId, taskId);

        // ASSERT
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getNotes()).isEqualTo("Fixed navbar bug");
    }
}
