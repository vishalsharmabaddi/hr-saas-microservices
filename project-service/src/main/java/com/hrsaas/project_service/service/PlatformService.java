package com.hrsaas.project_service.service;

import com.hrsaas.project_service.dto.PlatformCompanyResponse;
import com.hrsaas.project_service.exception.ResourceNotFoundException;
import com.hrsaas.project_service.model.Company;
import com.hrsaas.project_service.repository.CompanyRepository;
import com.hrsaas.project_service.repository.MembershipRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class PlatformService {

    private static final Set<String> ALLOWED_PLANS = Set.of("FREE", "PRO", "BUSINESS");

    private final CompanyRepository companyRepository;
    private final MembershipRepository membershipRepository;

    public List<PlatformCompanyResponse> listCompanies() {
        return companyRepository.findAll().stream().map(this::toResponse).toList();
    }

    public PlatformCompanyResponse setStatus(Long id, Boolean active) {
        Company c = find(id);
        c.setIsActive(Boolean.TRUE.equals(active));
        return toResponse(companyRepository.save(c));
    }

    public PlatformCompanyResponse setPlan(Long id, String plan) {
        String p = plan == null ? "" : plan.trim().toUpperCase();
        if (!ALLOWED_PLANS.contains(p)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid plan: " + plan);
        }
        Company c = find(id);
        c.setPlan(p);
        return toResponse(companyRepository.save(c));
    }

    private Company find(Long id) {
        return companyRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));
    }

    private PlatformCompanyResponse toResponse(Company c) {
        PlatformCompanyResponse r = new PlatformCompanyResponse();
        r.setId(c.getId());
        r.setName(c.getName());
        r.setDomain(c.getDomain());
        r.setPlan(c.getPlan() != null ? c.getPlan() : "FREE");
        r.setIsActive(c.getIsActive());
        r.setCreatedAt(c.getCreatedAt());
        r.setUserCount(membershipRepository.countByCompanyId(c.getId()));
        return r;
    }
}
