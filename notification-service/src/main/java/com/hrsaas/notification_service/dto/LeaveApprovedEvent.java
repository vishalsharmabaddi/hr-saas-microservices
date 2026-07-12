package com.hrsaas.notification_service.dto;

import lombok.Data;

@Data
public class LeaveApprovedEvent {
    private Long employeeId;
    private Long companyId;
    private String employeeName;
    private String recipientEmail;   // kisko notify karna (applicant); null → broadcast
    private String message;
}
