package com.hrsaas.project_service.dto;

import com.hrsaas.project_service.enums.Priority;
import com.hrsaas.project_service.enums.TaskStatus;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TaskResponse {
    private Long id;
    private Long companyId;
    private Long taskListId;
    private String title;
    private String description;
    private TaskStatus status;
    private Priority priority;
    private LocalDate dueDate;
    private Double estimatedHours;
    private LocalDateTime createdAt;
}
