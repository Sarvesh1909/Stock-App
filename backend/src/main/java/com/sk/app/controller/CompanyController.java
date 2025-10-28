package com.sk.app.controller;

import com.sk.app.model.Company;
import com.sk.app.repository.CompanyRepository;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/companies")
public class CompanyController {
    private final CompanyRepository companyRepository;

    public CompanyController(CompanyRepository companyRepository) {
        this.companyRepository = companyRepository;
    }

    @GetMapping
    public List<Company> getAllCompanies() {
        return companyRepository.findAll();
    }

    @PostMapping
    public Company createCompany(@RequestBody Company company) {
        return companyRepository.save(company);
    }
} 