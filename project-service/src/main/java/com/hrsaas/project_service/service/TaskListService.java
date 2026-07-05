package com.hrsaas.project_service.service;

import com.hrsaas.project_service.exception.ResourceNotFoundException;
import com.hrsaas.project_service.model.Project;
import com.hrsaas.project_service.model.TaskList;
import com.hrsaas.project_service.repository.ProjectRepository;
import com.hrsaas.project_service.repository.TaskListRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskListService {

    private final TaskListRepository taskListRepository;
    private final ProjectRepository projectRepository;

    public TaskList createTaskList(Long companyId, Long projectId, String name, String description) {
        Project project = projectRepository.findById(projectId)
            .filter(p -> p.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        TaskList taskList = new TaskList();
        taskList.setCompanyId(companyId);
        taskList.setProject(project);
        taskList.setName(name);
        taskList.setDescription(description);
        return taskListRepository.save(taskList);
    }

    public List<TaskList> getTaskListsByProject(Long companyId, Long projectId) {
        return taskListRepository.findByProjectIdAndCompanyId(projectId, companyId);
    }

    public void deleteTaskList(Long companyId, Long taskListId) {
        TaskList taskList = taskListRepository.findById(taskListId)
            .filter(t -> t.getCompanyId().equals(companyId))
            .orElseThrow(() -> new ResourceNotFoundException("TaskList not found: " + taskListId));
        taskListRepository.delete(taskList);
    }
}
