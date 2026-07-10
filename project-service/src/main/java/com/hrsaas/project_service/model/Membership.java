package com.hrsaas.project_service.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.LocalDateTime;

// Ye table batati hai: kaunsa email -> kaunsi company -> kya role.
// (email, companyId) ka combination unique hai — ek email ek company me ek hi baar,
// lekin same email KAI companies me alag rows ke roop me ho sakta hai (multi-tenant).
@Entity
@Table(
    name = "memberships",
    uniqueConstraints = @UniqueConstraint(columnNames = {"email", "companyId"})
)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Membership {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // hamesha lowercase store karenge (compare karte waqt case-mismatch na ho)
    @Column(nullable = false)
    private String email;

    @Column(nullable = false)
    private Long companyId;

    // ADMIN | MANAGER | EMPLOYEE
    @Column(nullable = false)
    private String role;

    @Column(updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        if (email != null) {
            email = email.toLowerCase();
        }
    }
}
