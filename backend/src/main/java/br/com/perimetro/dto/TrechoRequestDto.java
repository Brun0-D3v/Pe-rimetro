package br.com.perimetro.dto;

import br.com.perimetro.entity.AtivoInativo;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

public class TrechoRequestDto {

    @NotBlank(message = "nome é obrigatório")
    @Size(max = 150, message = "nome deve ter no máximo 150 caracteres")
    private final String nome;

    @NotNull(message = "geometria é obrigatória")
    private final List<PontoDto> geometria;

    @NotNull(message = "latitude é obrigatória")
    private final Double latitude;

    @NotNull(message = "longitude é obrigatória")
    private final Double longitude;

    @NotNull(message = "regiaoId é obrigatório")
    private final UUID regiaoId;

    private final AtivoInativo status;

    public TrechoRequestDto(String nome, List<PontoDto> geometria, Double latitude, Double longitude,
                             UUID regiaoId, AtivoInativo status) {
        this.nome = nome;
        this.geometria = geometria;
        this.latitude = latitude;
        this.longitude = longitude;
        this.regiaoId = regiaoId;
        this.status = status;
    }

    public String getNome() {
        return nome;
    }

    public List<PontoDto> getGeometria() {
        return geometria;
    }

    public Double getLatitude() {
        return latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public UUID getRegiaoId() {
        return regiaoId;
    }

    public AtivoInativo getStatus() {
        return status;
    }
}
