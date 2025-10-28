package com.sk.app.repository;

import com.sk.app.model.Company;
import org.springframework.data.jpa.repository.JpaRepository;
 
public interface CompanyRepository extends JpaRepository<Company, Long> {
} 