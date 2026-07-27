package com.hrsaas.project_service.dto;

import com.hrsaas.project_service.enums.Priority;
import com.hrsaas.project_service.enums.TaskStatus;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
public class TaskResponse {
    private Long id;
    private Long companyId;
    private Long taskListId;
    private Long projectId;
    private String projectName;
    private String title;
    private String description;
    private TaskStatus status;
    private Priority priority;
    private LocalDate dueDate;
    private Double estimatedHours;
    private String createdByEmail;
    private LocalDateTime createdAt;
    private List<AssigneeInfo> assignees = new ArrayList<>();
}
