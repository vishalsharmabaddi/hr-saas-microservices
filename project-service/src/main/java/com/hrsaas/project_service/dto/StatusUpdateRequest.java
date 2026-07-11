package com.hrsaas.project_service.dto;

import com.hrsaas.project_service.enums.TaskStatus;
import lombok.Data;

// Sirf status badalne ke liye chhota body — PATCH /tasks/{id}/status
@Data
public class StatusUpdateRequest {
    private TaskStatus status;
}
