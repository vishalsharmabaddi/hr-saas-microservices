package com.hrsaas.notification_service.dto;

import lombok.Data;

@Data
public class LeaveApprovedEvent {
    private Long employeeId;
    private Long companyId;
    private String employeeName;
    private String message;
}
