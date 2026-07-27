package com.hrsaas.project_service.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

// Per-assignee workload for one project: how many tasks they hold and how many are done.
@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssigneeStats {
    private Long employeeId;
    private String email;
    private String name;
    private long totalTasks;
    private long completedTasks;
}
