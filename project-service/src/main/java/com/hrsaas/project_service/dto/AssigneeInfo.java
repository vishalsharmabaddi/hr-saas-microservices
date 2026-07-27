package com.hrsaas.project_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// One assignee — denormalized so any viewer sees the real name without a cross-service call.
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssigneeInfo {
    private Long employeeId;
    private String email;
    private String name;
}
