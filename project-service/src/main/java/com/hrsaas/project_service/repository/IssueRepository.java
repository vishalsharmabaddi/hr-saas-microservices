package com.hrsaas.project_service.repository;

import com.hrsaas.project_service.model.Issue;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface IssueRepository extends JpaRepository<Issue, Long> {
    List<Issue> findByProjectIdAndCompanyId(Long projectId, Long companyId);
}
