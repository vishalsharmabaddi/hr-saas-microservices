package com.hrsaas.payroll_service.dto;

import lombok.Data;

// Admin ek month ke liye payroll chalata hai.
// employeeId null/absent → us company ke saare employees (jinki structure set hai).
@Data
public class PayrollRunRequest {
    private int month;        // 1-12
    private int year;
    private Long employeeId;  // null = "all"
}
