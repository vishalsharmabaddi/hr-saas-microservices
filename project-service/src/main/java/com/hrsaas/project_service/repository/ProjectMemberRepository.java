package com.hrsaas.project_service.repository;

import com.hrsaas.project_service.model.ProjectMember;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface ProjectMemberRepository extends JpaRepository<ProjectMember, Long> {
    List<ProjectMember> findByProjectIdAndCompanyId(Long projectId, Long companyId);
    Optional<ProjectMember> findByProjectIdAndEmployeeId(Long projectId, Long employeeId);
}
