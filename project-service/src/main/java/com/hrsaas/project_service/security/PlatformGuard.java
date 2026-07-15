package com.hrsaas.project_service.security;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.Set;

// Platform Console = cross-tenant (SAARI companies). Sirf platform owner (env-configured email)
// hi allow. Email verified token se aata hai (X-User-Email), client se nahi.
public final class PlatformGuard {

    private PlatformGuard() {}

    public static void requireOwner(String email, Set<String> owners) {
        String e = email == null ? "" : email.trim().toLowerCase();
        if (!owners.contains(e)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Platform owner only");
        }
    }
}
