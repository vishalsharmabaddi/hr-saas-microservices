package com.hrsaas.project_service.dto;

import com.hrsaas.project_service.enums.Priority;
import lombok.Data;
import java.time.LocalDate;

@Data
public class TaskRequest {
    private Long taskListId;
    private String title;
    private String description;
    private Priority priority;
    private LocalDate dueDate;
    private Double estimatedHours;
}
