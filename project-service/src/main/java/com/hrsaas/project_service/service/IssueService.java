package com.hrsaas.project_service.service;

import com.hrsaas.project_service.enums.IssueSeverity;
import com.hrsaas.project_service.enums.IssueStatus;
import com.hrsaas.project_service.exception.ResourceNotFoundException;
import com.hrsaas.project_service.model.Issue;
import com.hrsaas.project_service.model.Project;
import com.hrsaas.project_service.repository.IssueRepository;
import com.hrsaas.project_service.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class IssueService {

    private final IssueRepository issueRepository;
    private final ProjectRepository projectRepository;

    public Issue createIssue(Long companyId, Long projectId, String title,
                              String description, IssueSeverity severity, Long reportedBy) {
        Project project = projectRepository.findById(projectId)
            .filter(p -> p.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        Issue issue = new Issue();
        issue.setCompanyId(companyId);
        issue.setProject(project);
        issue.setTitle(title);
        issue.setDescription(description);
        issue.setSeverity(severity);
        issue.setReportedByEmployeeId(reportedBy);
        return issueRepository.save(issue);
    }

    public List<Issue> getIssuesByProject(Long companyId, Long projectId) {
        return issueRepository.findByProjectIdAndCompanyId(projectId, companyId);
    }

    public Issue updateStatus(Long companyId, Long issueId, IssueStatus status, Long assignedTo) {
        Issue issue = issueRepository.findById(issueId)
            .filter(i -> i.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Issue not found: " + issueId));
        issue.setStatus(status);
        if (assignedTo != null) issue.setAssignedToEmployeeId(assignedTo);
        return issueRepository.save(issue);
    }

    public void deleteIssue(Long companyId, Long issueId) {
        Issue issue = issueRepository.findById(issueId)
            .filter(i -> i.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Issue not found: " + issueId));
        issueRepository.delete(issue);
    }
}
