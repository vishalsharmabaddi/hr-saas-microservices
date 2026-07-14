package com.hrsaas.leave_service.repository;

import com.hrsaas.leave_service.model.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;

public interface LeaveRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    List<LeaveRequest> findByCompanyIdAndStatusOrderByCreatedAtDesc(Long companyId, String status);

    List<LeaveRequest> findByCompanyIdAndEmployeeIdOrderByCreatedAtDesc(Long companyId, Long employeeId);

    // Date-range (startDate) filters — type-safe derived queries.
    // (JPQL ":param IS NULL" pattern PostgreSQL pe null-param type inference se fail hota hai.)
    List<LeaveRequest> findByCompanyIdAndStartDateBetweenOrderByCreatedAtDesc(
            Long companyId, LocalDate from, LocalDate to);

    List<LeaveRequest> findByCompanyIdAndStatusAndStartDateBetweenOrderByCreatedAtDesc(
            Long companyId, String status, LocalDate from, LocalDate to);
}
