package com.hrsaas.project_service.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class TimeLogRequest {
    private Long taskId;
    private Long employeeId;
    private LocalDate logDate;
    private Double hoursLogged;
    private String notes;
}
