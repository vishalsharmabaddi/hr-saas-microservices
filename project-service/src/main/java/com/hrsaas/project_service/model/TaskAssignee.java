package com.hrsaas.project_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

@Entity
@Table(name = "task_assignees",
    uniqueConstraints = @UniqueConstraint(columnNames = {"task_id", "employee_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskAssignee {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private Long companyId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "task_id", nullable = false)
    private Task task;

    @Column(nullable = false)
    private Long employeeId;

    // Denormalized display fields — captured at assign time so any viewer sees the
    // real name without needing employees-read permission or a cross-service call.
    private String email;
    private String name;

    @Column(updatable = false)
    private LocalDateTime assignedAt;

    @PrePersist
    protected void onCreate() {
        assignedAt = LocalDateTime.now();
    }
}
