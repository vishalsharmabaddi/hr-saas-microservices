package com.hrsaas.notification_service.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class PayslipGeneratedEvent {
    private Long companyId;
    private Long employeeId;
    private String employeeName;
    private String recipientEmail;   // isi employee ke bell me dikhe (salary private)
    private Integer month;
    private Integer year;
    private BigDecimal netPay;
    private String message;
}
