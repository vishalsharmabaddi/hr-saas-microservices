package com.hrsaas.project_service.service;

import com.hrsaas.project_service.exception.ResourceNotFoundException;
import com.hrsaas.project_service.model.Company;
import com.hrsaas.project_service.repository.CompanyRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CompanyService {

    private final CompanyRepository companyRepository;

    public Company createCompany(Company company) {
        return companyRepository.save(company);
    }

    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    public Company getCompanyById(Long id) {
        return companyRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Company not found with id: " + id));
    }

    public Company updateCompany(Long id, Company updated) {
        Company existing = getCompanyById(id);
        existing.setName(updated.getName());
        existing.setDomain(updated.getDomain());
        existing.setLogoUrl(updated.getLogoUrl());
        return companyRepository.save(existing);
    }
}
