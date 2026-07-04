package com.hrsaas.leave_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class LeaveApprovedEvent {
    private Long employeeId;
    private String employeeName;
    private String message;
}
