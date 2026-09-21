package br.com.perimetro.dto;

import br.com.perimetro.entity.AtivoInativo;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

public class TrechoResponseDto {

    private final UUID id;
    private final String nome;
    private final List<PontoDto> geometria;
    private final double latitude;
    private final double longitude;
    private final BigDecimal indiceAtual;
    private final AtivoInativo status;
    private final UUID regiaoId;

    public TrechoResponseDto(UUID id, String nome, List<PontoDto> geometria, double latitude, double longitude,
                              BigDecimal indiceAtual, AtivoInativo status, UUID regiaoId) {
        this.id = id;
        this.nome = nome;
        this.geometria = geometria;
        this.latitude = latitude;
        this.longitude = longitude;
        this.indiceAtual = indiceAtual;
        this.status = status;
        this.regiaoId = regiaoId;
    }

    public UUID getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public List<PontoDto> getGeometria() {
        return geometria;
    }

    public double getLatitude() {
        return latitude;
    }

    public double getLongitude() {
        return longitude;
    }

    public BigDecimal getIndiceAtual() {
        return indiceAtual;
    }

    public AtivoInativo getStatus() {
        return status;
    }

    public UUID getRegiaoId() {
        return regiaoId;
    }
}
