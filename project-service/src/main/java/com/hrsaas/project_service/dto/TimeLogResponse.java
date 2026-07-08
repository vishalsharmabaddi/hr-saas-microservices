package com.hrsaas.project_service.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TimeLogResponse {
    private Long id;
    private Long companyId;
    private Long taskId;
    private Long employeeId;
    private LocalDate logDate;
    private Double hoursLogged;
    private String notes;
    private LocalDateTime createdAt;
}
