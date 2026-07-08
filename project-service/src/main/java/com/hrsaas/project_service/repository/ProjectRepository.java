package com.hrsaas.project_service.repository;

import com.hrsaas.project_service.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByCompanyId(Long companyId);

    List<Project> findTop5ByCompanyIdOrderByCreatedAtDesc(Long companyId);
}
