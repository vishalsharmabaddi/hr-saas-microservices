package com.hrsaas.leave_service.repository;

import com.hrsaas.leave_service.model.LeaveRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LeaveRepository extends JpaRepository<LeaveRequest, Long> {

    List<LeaveRequest> findByCompanyIdOrderByCreatedAtDesc(Long companyId);

    List<LeaveRequest> findByCompanyIdAndStatusOrderByCreatedAtDesc(Long companyId, String status);

    List<LeaveRequest> findByCompanyIdAndEmployeeIdOrderByCreatedAtDesc(Long companyId, Long employeeId);
}
