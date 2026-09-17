package br.com.perimetro.dto;

import java.time.LocalDateTime;

public class HealthResponseDto {

    private final String status;
    private final String banco;
    private final LocalDateTime verificadoEm;

    public HealthResponseDto(String status, String banco, LocalDateTime verificadoEm) {
        this.status = status;
        this.banco = banco;
        this.verificadoEm = verificadoEm;
    }

    public String getStatus() {
        return status;
    }

    public String getBanco() {
        return banco;
    }

    public LocalDateTime getVerificadoEm() {
        return verificadoEm;
    }
}
