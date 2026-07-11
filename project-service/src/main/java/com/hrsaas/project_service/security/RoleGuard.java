package com.hrsaas.project_service.security;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

// Chhota reusable role-check. Role verified token se aata hai (X-User-Role header),
// isliye ispe bharosa kar sakte hain. Allowed roles me na ho → 403.
public final class RoleGuard {

    private RoleGuard() {}

    public static void require(String role, String... allowed) {
        String r = role == null ? "" : role.trim().toUpperCase();
        for (String a : allowed) {
            if (a.equalsIgnoreCase(r)) return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You don't have permission for this action");
    }

    // ADMIN ya MANAGER (manage-level actions)
    public static void requireManager(String role) {
        require(role, "ADMIN", "MANAGER");
    }

    // Sirf ADMIN
    public static void requireAdmin(String role) {
        require(role, "ADMIN");
    }
}
