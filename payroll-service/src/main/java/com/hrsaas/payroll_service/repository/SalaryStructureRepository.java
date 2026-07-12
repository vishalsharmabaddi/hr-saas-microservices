package com.hrsaas.payroll_service.repository;

import com.hrsaas.payroll_service.model.SalaryStructure;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface SalaryStructureRepository extends JpaRepository<SalaryStructure, Long> {

    // "Is company ke is employee ka salary setup" — tenant-safe
    Optional<SalaryStructure> findByCompanyIdAndEmployeeId(Long companyId, Long employeeId);
}
