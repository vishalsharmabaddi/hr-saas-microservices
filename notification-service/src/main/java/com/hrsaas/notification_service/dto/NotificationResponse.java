package com.hrsaas.notification_service.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NotificationResponse {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String type;
    private String message;
    private Boolean isRead;
    private LocalDateTime createdAt;
}
