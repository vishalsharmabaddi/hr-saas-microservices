package com.hrsaas.gamification_service.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

import java.util.Collections;
import java.util.Enumeration;
import java.util.Map;

// Request ke upar "cover" — kuch headers (X-Company-Id, X-User-Role, X-User-Email)
// verified token se force kar dete hain. Client ne jo bheja tha wo dikhega hi nahi.
public class CompanyHeaderRequest extends HttpServletRequestWrapper {

    private final Map<String, String> overrides;   // header name (lowercase) -> value

    public CompanyHeaderRequest(HttpServletRequest request, Map<String, String> overrides) {
        super(request);
        this.overrides = overrides;
    }

    @Override
    public String getHeader(String name) {
        String v = overrides.get(name.toLowerCase());
        return v != null ? v : super.getHeader(name);   // token wala — client ka nahi
    }

    @Override
    public Enumeration<String> getHeaders(String name) {
        String v = overrides.get(name.toLowerCase());
        if (v != null) {
            return Collections.enumeration(Collections.singletonList(v));
        }
        return super.getHeaders(name);
    }
}
