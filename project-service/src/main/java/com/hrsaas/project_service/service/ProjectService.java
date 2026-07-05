package com.hrsaas.project_service.service;

import com.hrsaas.project_service.dto.ProjectRequest;
import com.hrsaas.project_service.dto.ProjectResponse;
import com.hrsaas.project_service.exception.ResourceNotFoundException;
import com.hrsaas.project_service.model.Project;
import com.hrsaas.project_service.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;

    public ProjectResponse createProject(Long companyId, ProjectRequest request) {
        Project project = new Project();
        project.setCompanyId(companyId);
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setType(request.getType());
        project.setBillingType(request.getBillingType());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        project.setOwnerEmployeeId(request.getOwnerEmployeeId());
        Project saved = projectRepository.save(project);
        return toResponse(saved);
    }

    public List<ProjectResponse> getProjectsByCompany(Long companyId) {
        return projectRepository.findByCompanyId(companyId)
            .stream().map(this::toResponse).toList();
    }

    public ProjectResponse getProjectById(Long companyId, Long projectId) {
        Project project = projectRepository.findById(projectId)
            .filter(p -> p.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
        return toResponse(project);
    }

    public ProjectResponse updateProject(Long companyId, Long projectId, ProjectRequest request) {
        Project project = projectRepository.findById(projectId)
            .filter(p -> p.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));
        project.setName(request.getName());
        project.setDescription(request.getDescription());
        project.setType(request.getType());
        project.setBillingType(request.getBillingType());
        project.setStartDate(request.getStartDate());
        project.setEndDate(request.getEndDate());
        return toResponse(projectRepository.save(project));
    }

    private ProjectResponse toResponse(Project p) {
        ProjectResponse res = new ProjectResponse();
        res.setId(p.getId());
        res.setCompanyId(p.getCompanyId());
        res.setName(p.getName());
        res.setDescription(p.getDescription());
        res.setType(p.getType());
        res.setStatus(p.getStatus());
        res.setBillingType(p.getBillingType());
        res.setStartDate(p.getStartDate());
        res.setEndDate(p.getEndDate());
        res.setOwnerEmployeeId(p.getOwnerEmployeeId());
        res.setCreatedAt(p.getCreatedAt());
        return res;
    }
}
