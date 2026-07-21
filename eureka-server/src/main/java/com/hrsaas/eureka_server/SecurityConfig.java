package com.hrsaas.eureka_server;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

/**
 * M7: lock the Eureka registry and dashboard behind HTTP Basic auth.
 *
 * Before this, GET /eureka/apps and the web dashboard were fully public, handing
 * every service's name, host, IP and port to any anonymous caller (an internal
 * network map). The credentials come from spring.security.user.* (env-backed).
 */
@Configuration
public class SecurityConfig {

    @Bean
    SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                // Eureka clients register with a non-browser POST to /eureka/apps/**.
                // Spring Security's default CSRF protection would reject those POSTs
                // (no CSRF token), so no service could ever register. Disabling CSRF is
                // safe here: this is a machine-to-machine API guarded by Basic auth, not
                // a cookie/session browser app, so there is no CSRF attack surface.
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().authenticated())
                .httpBasic(Customizer.withDefaults());
        return http.build();
    }
}
