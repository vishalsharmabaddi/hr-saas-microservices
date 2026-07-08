package com.hrsaas.attendance_service.dto;

import lombok.Data;

@Data
public class CheckInRequest {
    private Long employeeId;
    private String notes;
}
