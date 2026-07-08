package com.hrsaas.project_service;

import com.hrsaas.project_service.dto.ProjectRequest;
import com.hrsaas.project_service.dto.ProjectResponse;
import com.hrsaas.project_service.enums.ProjectStatus;
import com.hrsaas.project_service.enums.ProjectType;
import com.hrsaas.project_service.model.Project;
import com.hrsaas.project_service.repository.ProjectRepository;
import com.hrsaas.project_service.service.ProjectService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ProjectServiceTest {

    @Mock
    private ProjectRepository projectRepository;

    @InjectMocks
    private ProjectService projectService;

    @Test
    void createProject_shouldReturnProjectResponse() {
        // ARRANGE — test ka setup
        Long companyId = 1L;
        ProjectRequest request = new ProjectRequest();
        request.setName("WorkTrack MVP");
        request.setType(ProjectType.DEPARTMENT);

        Project savedProject = new Project();
        savedProject.setId(1L);
        savedProject.setCompanyId(companyId);
        savedProject.setName("WorkTrack MVP");
        savedProject.setType(ProjectType.DEPARTMENT);
        savedProject.setStatus(ProjectStatus.PLANNING);

        when(projectRepository.save(any(Project.class))).thenReturn(savedProject);

        // ACT — actual method call
        ProjectResponse response = projectService.createProject(companyId, request);

        // ASSERT — check karo
        assertThat(response).isNotNull();
        assertThat(response.getName()).isEqualTo("WorkTrack MVP");
        assertThat(response.getStatus()).isEqualTo(ProjectStatus.PLANNING);
        assertThat(response.getCompanyId()).isEqualTo(companyId);
    }

    @Test
    void getProjectsByCompany_shouldReturnList() {
        // ARRANGE
        Long companyId = 1L;
        Project p1 = new Project();
        p1.setId(1L);
        p1.setCompanyId(companyId);
        p1.setName("Project Alpha");

        when(projectRepository.findByCompanyId(companyId))
            .thenReturn(java.util.List.of(p1));

        // ACT
        var result = projectService.getProjectsByCompany(companyId);

        // ASSERT
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getName()).isEqualTo("Project Alpha");
    }
}
