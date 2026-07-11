package com.hrsaas.project_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

// Ek "pending invitation". Membership abhi NAHI banti — sirf jab invitee accept kare.
// token = secret code jo link me jaata hai. status = PENDING | ACCEPTED | REVOKED.
@Entity
@Table(name = "invites")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Invite {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // kis email ko invite kiya — SIRF isi email se accept ho sakta hai
    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private Long companyId;

    // ADMIN | MANAGER | EMPLOYEE
    @Column(nullable = false)
    private String role;

    private String name;   // optional — admin ne bhara ho to

    // link ka secret — unique + random (UUID)
    @Column(nullable = false, unique = true)
    private String token;

    // PENDING | ACCEPTED | REVOKED
    @Column(nullable = false)
    private String status;

    private String invitedBy;   // admin ka email (audit ke liye)

    @Column(updatable = false)
    private LocalDateTime createdAt;

    private LocalDateTime expiresAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (email != null) email = email.toLowerCase();
    }
}
