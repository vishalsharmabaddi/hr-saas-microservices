package com.hrsaas.project_service.repository;

import com.hrsaas.project_service.model.TaskList;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskListRepository extends JpaRepository<TaskList, Long> {
    List<TaskList> findByProjectIdAndCompanyId(Long projectId, Long companyId);
}
