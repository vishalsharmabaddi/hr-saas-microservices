package com.hrsaas.project_service.service;

import com.hrsaas.project_service.enums.MilestoneStatus;
import com.hrsaas.project_service.exception.ResourceNotFoundException;
import com.hrsaas.project_service.model.Milestone;
import com.hrsaas.project_service.model.Project;
import com.hrsaas.project_service.repository.MilestoneRepository;
import com.hrsaas.project_service.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDate;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final ProjectRepository projectRepository;

    public Milestone createMilestone(Long companyId, Long projectId,
                                     String name, String description, LocalDate dueDate) {
        Project project = projectRepository.findById(projectId)
            .filter(p -> p.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        Milestone milestone = new Milestone();
        milestone.setCompanyId(companyId);
        milestone.setProject(project);
        milestone.setName(name);
        milestone.setDescription(description);
        milestone.setDueDate(dueDate);
        return milestoneRepository.save(milestone);
    }

    public List<Milestone> getMilestonesByProject(Long companyId, Long projectId) {
        return milestoneRepository.findByProjectIdAndCompanyId(projectId, companyId);
    }

    public Milestone updateStatus(Long companyId, Long milestoneId, MilestoneStatus status) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
            .filter(m -> m.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Milestone not found: " + milestoneId));
        milestone.setStatus(status);
        return milestoneRepository.save(milestone);
    }

    public void deleteMilestone(Long companyId, Long milestoneId) {
        Milestone milestone = milestoneRepository.findById(milestoneId)
            .filter(m -> m.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Milestone not found: " + milestoneId));
        milestoneRepository.delete(milestone);
    }
}
