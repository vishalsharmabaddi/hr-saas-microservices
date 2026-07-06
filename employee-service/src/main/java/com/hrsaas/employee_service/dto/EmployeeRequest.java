package com.hrsaas.employee_service.dto;

import lombok.Data;
import java.time.LocalDate;

@Data
public class EmployeeRequest {
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private String department;
    private String designation;
    private String employmentType;
    private LocalDate joiningDate;
}
