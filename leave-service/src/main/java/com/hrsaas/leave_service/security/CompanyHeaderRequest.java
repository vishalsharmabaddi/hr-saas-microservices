package com.hrsaas.leave_service.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletRequestWrapper;

import java.util.Collections;
import java.util.Enumeration;

// Request ke upar ek "cover" — X-Company-Id maango toh HAMESHA token wala companyId milega,
// client ne jo bheja tha wo dikhega hi nahi. Isse spoofing rukti hai.
public class CompanyHeaderRequest extends HttpServletRequestWrapper {

    private static final String HEADER = "X-Company-Id";
    private final String companyId;

    public CompanyHeaderRequest(HttpServletRequest request, String companyId) {
        super(request);
        this.companyId = companyId;
    }

    @Override
    public String getHeader(String name) {
        if (HEADER.equalsIgnoreCase(name)) {
            return companyId;                       // token wala — client ka nahi
        }
        return super.getHeader(name);
    }

    @Override
    public Enumeration<String> getHeaders(String name) {
        if (HEADER.equalsIgnoreCase(name)) {
            return Collections.enumeration(Collections.singletonList(companyId));
        }
        return super.getHeaders(name);
    }
}
