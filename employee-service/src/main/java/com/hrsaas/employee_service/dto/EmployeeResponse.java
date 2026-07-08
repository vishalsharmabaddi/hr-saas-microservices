package com.hrsaas.employee_service.dto;

import lombok.Data;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class EmployeeResponse {
    private Long id;
    private Long companyId;
    private String firstName;
    private String lastName;
    private String fullName;
    private String email;
    private String phone;
    private String department;
    private String designation;
    private String employmentType;
    private Boolean isActive;
    private LocalDate joiningDate;
    private LocalDateTime createdAt;
}
