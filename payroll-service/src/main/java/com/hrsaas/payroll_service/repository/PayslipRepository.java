package com.hrsaas.payroll_service.repository;

import com.hrsaas.payroll_service.model.Payslip;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface PayslipRepository extends JpaRepository<Payslip, Long> {

    // Re-run pe purani payslip overwrite karne ke liye dhoondo
    Optional<Payslip> findByCompanyIdAndEmployeeIdAndMonthAndYear(
            Long companyId, Long employeeId, int month, int year);

    // Admin: us month ki saari payslips
    List<Payslip> findByCompanyIdAndMonthAndYear(Long companyId, int month, int year);

    // Employee self: apni saari payslips (nayi pehle)
    List<Payslip> findByCompanyIdAndEmployeeIdOrderByYearDescMonthDesc(Long companyId, Long employeeId);
}
