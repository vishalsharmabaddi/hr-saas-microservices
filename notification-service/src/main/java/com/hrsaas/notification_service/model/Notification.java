package com.hrsaas.notification_service.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "notifications")
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long companyId;
    private Long employeeId;
    private String employeeName;

    // Kiske bell me dikhe. null = broadcast (poori company ko dikhe).
    private String recipientEmail;

    // LEAVE_APPROVED, LEAVE_REJECTED, PAYSLIP_GENERATED, etc.
    private String type;

    @Column(length = 500)
    private String message;

    private Boolean isRead = false;

    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}
