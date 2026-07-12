package com.hrsaas.payroll_service.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

// Ek generate hui payslip ka snapshot. Structure baad me badle to purani payslip
// na badle — isliye saare numbers yahin freeze kar dete hain.
@Entity
@Table(
    name = "payslips",
    uniqueConstraints = @UniqueConstraint(columnNames = {"companyId", "employeeId", "month", "year"})
)
@Data
public class Payslip {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long companyId;

    @Column(nullable = false)
    private Long employeeId;

    private String employeeName;   // snapshot (display ke liye)

    @Column(nullable = false)
    private int month;             // 1-12
    @Column(nullable = false)
    private int year;

    // EARNINGS
    private BigDecimal basic;
    private BigDecimal hra;
    private BigDecimal specialAllowance;
    private BigDecimal grossPay;

    // DEDUCTIONS
    private BigDecimal pf;
    private BigDecimal professionalTax;
    private int absentDays;
    private int approvedLeaveDays;
    private int paidLeaveDays;
    private int unpaidLeaveDays;
    private int lopDays;
    private BigDecimal lopAmount;
    private BigDecimal totalDeductions;

    private BigDecimal netPay;

    private LocalDateTime generatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        generatedAt = LocalDateTime.now();
    }
}
