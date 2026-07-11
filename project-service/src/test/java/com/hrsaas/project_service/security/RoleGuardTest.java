package com.hrsaas.project_service.security;

import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.*;

// RoleGuard: sahi role → pass, galat/null role → 403.
class RoleGuardTest {

    private int status(Throwable t) {
        return ((ResponseStatusException) t).getStatusCode().value();
    }

    @Test
    void managerActionAllowsAdminAndManager() {
        assertThatCode(() -> RoleGuard.requireManager("ADMIN")).doesNotThrowAnyException();
        assertThatCode(() -> RoleGuard.requireManager("MANAGER")).doesNotThrowAnyException();
        assertThatCode(() -> RoleGuard.requireManager("manager")).doesNotThrowAnyException();   // case-insensitive
    }

    @Test
    void managerActionBlocksEmployeeAndNull() {
        assertThatThrownBy(() -> RoleGuard.requireManager("EMPLOYEE"))
                .isInstanceOf(ResponseStatusException.class).satisfies(e -> assertThat(status(e)).isEqualTo(403));
        assertThatThrownBy(() -> RoleGuard.requireManager(null))
                .isInstanceOf(ResponseStatusException.class).satisfies(e -> assertThat(status(e)).isEqualTo(403));
    }

    @Test
    void adminActionBlocksManager() {
        assertThatCode(() -> RoleGuard.requireAdmin("ADMIN")).doesNotThrowAnyException();
        assertThatThrownBy(() -> RoleGuard.requireAdmin("MANAGER"))
                .isInstanceOf(ResponseStatusException.class).satisfies(e -> assertThat(status(e)).isEqualTo(403));
    }
}
