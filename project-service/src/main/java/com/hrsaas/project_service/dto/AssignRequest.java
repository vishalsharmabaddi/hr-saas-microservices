package com.hrsaas.project_service.dto;

import lombok.Data;
import java.util.List;

// Body for PUT /api/tasks/{id}/assignees — the full desired assignee set (replace model).
@Data
public class AssignRequest {
    private List<AssigneeInfo> assignees;
}
