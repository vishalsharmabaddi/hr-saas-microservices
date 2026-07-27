package com.hrsaas.project_service.repository;

import com.hrsaas.project_service.model.TaskAssignee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface TaskAssigneeRepository extends JpaRepository<TaskAssignee, Long> {
    List<TaskAssignee> findByTaskId(Long taskId);
    List<TaskAssignee> findByEmployeeIdAndCompanyId(Long employeeId, Long companyId);
    // "My Tasks" across projects — identity is the token email (case-insensitive).
    List<TaskAssignee> findByCompanyIdAndEmailIgnoreCase(Long companyId, String email);
    // All assignee rows within one project — for per-assignee workload analytics.
    @Query("SELECT ta FROM TaskAssignee ta WHERE ta.companyId = :companyId " +
           "AND ta.task.taskList.project.id = :projectId")
    List<TaskAssignee> findByProject(@Param("companyId") Long companyId, @Param("projectId") Long projectId);
}
