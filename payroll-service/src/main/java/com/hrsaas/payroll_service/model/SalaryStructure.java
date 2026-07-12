package com.hrsaas.payroll_service.model;

import jakarta.persistence.*;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;

// Ek employee ka salary setup — ek baar banao, har mahine payslip isi se banti hai.
@Entity
@Table(
    name = "salary_structures",
    uniqueConstraints = @UniqueConstraint(columnNames = {"companyId", "employeeId"})
)
@Data
public class SalaryStructure {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long companyId;

    @Column(nullable = false)
    private Long employeeId;

    // EARNINGS (monthly ₹)
    private BigDecimal basic = BigDecimal.ZERO;
    private BigDecimal hra = BigDecimal.ZERO;
    private BigDecimal specialAllowance = BigDecimal.ZERO;

    // DEDUCTION toggles — contractor ke liye off/0 kar do to kuch nahi katega
    private boolean pfEnabled = true;              // PF = basic ka 12%
    private BigDecimal professionalTax = BigDecimal.ZERO;  // flat ₹ (0 = none)
    private boolean lopEnabled = true;             // absent/unpaid-leave din ka paisa kate?

    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }
}
