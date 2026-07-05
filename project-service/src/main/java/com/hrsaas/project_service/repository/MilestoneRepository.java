package com.hrsaas.project_service.repository;

import com.hrsaas.project_service.model.Milestone;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MilestoneRepository extends JpaRepository<Milestone, Long> {
    List<Milestone> findByProjectIdAndCompanyId(Long projectId, Long companyId);
}
