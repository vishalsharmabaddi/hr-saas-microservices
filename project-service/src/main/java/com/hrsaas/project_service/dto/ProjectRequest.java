package com.hrsaas.project_service.dto;

import com.hrsaas.project_service.enums.BillingType;
import com.hrsaas.project_service.enums.ProjectType;
import lombok.Data;
import java.time.LocalDate;

@Data
public class ProjectRequest {
    private String name;
    private String description;
    private ProjectType type;
    private BillingType billingType;
    private LocalDate startDate;
    private LocalDate endDate;
    private Long ownerEmployeeId;
}
