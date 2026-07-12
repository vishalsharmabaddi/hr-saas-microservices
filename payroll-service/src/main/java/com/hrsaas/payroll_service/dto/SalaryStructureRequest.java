package com.hrsaas.payroll_service.dto;

import lombok.Data;
import java.math.BigDecimal;

// Admin salary structure set/update karta hai. companyId/employeeId body me NAHI —
// wo token/URL se aate hain (client apni marzi se nahi bhej sakta).
@Data
public class SalaryStructureRequest {
    private BigDecimal basic;
    private BigDecimal hra;
    private BigDecimal specialAllowance;
    private boolean pfEnabled;
    private BigDecimal professionalTax;
    private boolean lopEnabled;
}
