package com.hrsaas.attendance_service.repository;

import com.hrsaas.attendance_service.model.CompanyAttendancePolicy;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CompanyAttendancePolicyRepository extends JpaRepository<CompanyAttendancePolicy, Long> {

    Optional<CompanyAttendancePolicy> findByCompanyId(Long companyId);
}
