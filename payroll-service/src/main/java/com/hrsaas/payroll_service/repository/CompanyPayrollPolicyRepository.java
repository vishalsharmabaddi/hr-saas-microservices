package com.hrsaas.payroll_service.repository;

import com.hrsaas.payroll_service.model.CompanyPayrollPolicy;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CompanyPayrollPolicyRepository extends JpaRepository<CompanyPayrollPolicy, Long> {

    Optional<CompanyPayrollPolicy> findByCompanyId(Long companyId);
}
