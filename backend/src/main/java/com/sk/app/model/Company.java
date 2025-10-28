  package com.sk.app.model;

import jakarta.persistence.*;
import java.util.List;

@Entity
public class Company {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    @ElementCollection
    private List<Double> stockPrices;

    // Getters and setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public List<Double> getStockPrices() { return stockPrices; }
    public void setStockPrices(List<Double> stockPrices) { this.stockPrices = stockPrices; }
} 