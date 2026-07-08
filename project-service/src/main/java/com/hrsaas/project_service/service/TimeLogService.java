package com.hrsaas.project_service.service;

import com.hrsaas.project_service.dto.TimeLogRequest;
import com.hrsaas.project_service.dto.TimeLogResponse;
import com.hrsaas.project_service.exception.ResourceNotFoundException;
import com.hrsaas.project_service.model.Task;
import com.hrsaas.project_service.model.TimeLog;
import com.hrsaas.project_service.repository.TaskRepository;
import com.hrsaas.project_service.repository.TimeLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class TimeLogService {

    private final TimeLogRepository timeLogRepository;
    private final TaskRepository taskRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    public TimeLogResponse logTime(Long companyId, TimeLogRequest request) {
        Task task = taskRepository.findById(request.getTaskId())
            .filter(t -> t.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + request.getTaskId()));

        TimeLog entry = new TimeLog();
        entry.setCompanyId(companyId);
        entry.setTask(task);
        entry.setEmployeeId(request.getEmployeeId());
        entry.setLogDate(request.getLogDate());
        entry.setHoursLogged(request.getHoursLogged());
        entry.setNotes(request.getNotes());
        TimeLog saved = timeLogRepository.save(entry);

        // Kafka event → gamification-service XP calculate karega
        try {
            String event = String.format(
                "{\"employeeId\":%d,\"logDate\":\"%s\",\"hoursLogged\":%.1f}",
                saved.getEmployeeId(), saved.getLogDate(), saved.getHoursLogged()
            );
            kafkaTemplate.send("timelog-submitted", event);
        } catch (Exception e) {
            log.warn("Kafka timelog event skipped: {}", e.getMessage());
        }

        return toResponse(saved);
    }

    public List<TimeLogResponse> getLogsByTask(Long companyId, Long taskId) {
        return timeLogRepository.findByTaskIdAndCompanyId(taskId, companyId)
            .stream().map(this::toResponse).toList();
    }

    public List<TimeLogResponse> getLogsByEmployee(Long companyId, Long employeeId,
                                                    LocalDate from, LocalDate to) {
        return timeLogRepository
            .findByEmployeeIdAndCompanyIdAndLogDateBetween(employeeId, companyId, from, to)
            .stream().map(this::toResponse).toList();
    }

    private TimeLogResponse toResponse(TimeLog t) {
        TimeLogResponse res = new TimeLogResponse();
        res.setId(t.getId());
        res.setCompanyId(t.getCompanyId());
        res.setTaskId(t.getTask().getId());
        res.setEmployeeId(t.getEmployeeId());
        res.setLogDate(t.getLogDate());
        res.setHoursLogged(t.getHoursLogged());
        res.setNotes(t.getNotes());
        res.setCreatedAt(t.getCreatedAt());
        return res;
    }
}
