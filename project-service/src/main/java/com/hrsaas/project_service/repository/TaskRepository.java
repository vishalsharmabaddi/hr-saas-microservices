package com.hrsaas.project_service.repository;

import com.hrsaas.project_service.model.Task;
import com.hrsaas.project_service.enums.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByTaskListIdAndCompanyId(Long taskListId, Long companyId);
    List<Task> findByCompanyIdAndStatus(Long companyId, TaskStatus status);
}
