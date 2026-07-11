package com.hrsaas.employee_service.security;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

// Chhota reusable role-check. Role verified token se aata hai (X-User-Role header).
public final class RoleGuard {

    private RoleGuard() {}

    public static void require(String role, String... allowed) {
        String r = role == null ? "" : role.trim().toUpperCase();
        for (String a : allowed) {
            if (a.equalsIgnoreCase(r)) return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You don't have permission for this action");
    }

    public static void requireManager(String role) {
        require(role, "ADMIN", "MANAGER");
    }

    public static void requireAdmin(String role) {
        require(role, "ADMIN");
    }
}
