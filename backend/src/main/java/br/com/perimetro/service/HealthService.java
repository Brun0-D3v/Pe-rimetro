package br.com.perimetro.service;

import br.com.perimetro.dto.HealthResponseDto;
import br.com.perimetro.repository.SystemHealthRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class HealthService {

    private final SystemHealthRepository systemHealthRepository;

    public HealthService(SystemHealthRepository systemHealthRepository) {
        this.systemHealthRepository = systemHealthRepository;
    }

    public HealthResponseDto verificarStatus() {
        String statusBanco;
        try {
            systemHealthRepository.count();
            statusBanco = "UP";
        } catch (Exception excecao) {
            statusBanco = "DOWN";
        }
        return new HealthResponseDto("UP", statusBanco, LocalDateTime.now());
    }
}
