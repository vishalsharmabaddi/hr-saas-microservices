package com.hrsaas.project_service.repository;

import com.hrsaas.project_service.model.TimeLog;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;

public interface TimeLogRepository extends JpaRepository<TimeLog, Long> {
    List<TimeLog> findByTaskIdAndCompanyId(Long taskId, Long companyId);
    List<TimeLog> findByEmployeeIdAndCompanyIdAndLogDateBetween(
        Long employeeId, Long companyId, LocalDate from, LocalDate to);
}
