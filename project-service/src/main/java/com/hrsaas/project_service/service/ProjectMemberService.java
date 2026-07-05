package com.hrsaas.project_service.service;

import com.hrsaas.project_service.enums.ProjectRole;
import com.hrsaas.project_service.exception.ResourceNotFoundException;
import com.hrsaas.project_service.model.Project;
import com.hrsaas.project_service.model.ProjectMember;
import com.hrsaas.project_service.repository.ProjectMemberRepository;
import com.hrsaas.project_service.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectMemberService {

    private final ProjectMemberRepository projectMemberRepository;
    private final ProjectRepository projectRepository;

    public ProjectMember addMember(Long companyId, Long projectId, Long employeeId, ProjectRole role) {
        Project project = projectRepository.findById(projectId)
            .filter(p -> p.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        ProjectMember member = new ProjectMember();
        member.setCompanyId(companyId);
        member.setProject(project);
        member.setEmployeeId(employeeId);
        member.setRole(role);
        return projectMemberRepository.save(member);
    }

    public List<ProjectMember> getMembersByProject(Long companyId, Long projectId) {
        return projectMemberRepository.findByProjectIdAndCompanyId(projectId, companyId);
    }

    public void removeMember(Long companyId, Long memberId) {
        ProjectMember member = projectMemberRepository.findById(memberId)
            .filter(m -> m.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Member not found: " + memberId));
        projectMemberRepository.delete(member);
    }
}
