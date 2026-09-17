package br.com.perimetro.controller;

import br.com.perimetro.dto.HealthResponseDto;
import br.com.perimetro.service.HealthService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HealthController {

    private final HealthService healthService;

    public HealthController(HealthService healthService) {
        this.healthService = healthService;
    }

    @GetMapping("/api/v1/health")
    public HealthResponseDto verificarSaude() {
        return healthService.verificarStatus();
    }
}
