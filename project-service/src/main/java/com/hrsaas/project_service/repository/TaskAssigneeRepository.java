package com.hrsaas.project_service.repository;

import com.hrsaas.project_service.model.TaskAssignee;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskAssigneeRepository extends JpaRepository<TaskAssignee, Long> {
    List<TaskAssignee> findByTaskId(Long taskId);
    List<TaskAssignee> findByEmployeeIdAndCompanyId(Long employeeId, Long companyId);
}
