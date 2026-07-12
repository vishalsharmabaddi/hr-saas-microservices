package com.hrsaas.leave_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LeaveApprovedEvent {
    private Long employeeId;
    private Long companyId;
    private String employeeName;
    private String recipientEmail;   // applicant ka email (notification targeting); null → broadcast
    private String message;
}
