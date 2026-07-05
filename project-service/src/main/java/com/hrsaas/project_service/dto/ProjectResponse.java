package com.hrsaas.project_service.dto;

import com.hrsaas.project_service.enums.BillingType;
import com.hrsaas.project_service.enums.ProjectStatus;
import com.hrsaas.project_service.enums.ProjectType;
import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class ProjectResponse {
    private Long id;
    private Long companyId;
    private String name;
    private String description;
    private ProjectType type;
    private ProjectStatus status;
    private BillingType billingType;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long ownerEmployeeId;
    private LocalDateTime createdAt;
}
