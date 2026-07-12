package com.hrsaas.payroll_service.model;

import jakarta.persistence.*;
import lombok.Data;

// Poori company ke liye ek payroll setting. Multi-tenant: har company apna row.
@Entity
@Table(
    name = "company_payroll_policy",
    uniqueConstraints = @UniqueConstraint(columnNames = "companyId")
)
@Data
public class CompanyPayrollPolicy {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long companyId;

    // Har mahine kitni leave par paisa NAHI katega. Uske baad wali leaves LOP.
    private int paidLeavesPerMonth = 2;
}
