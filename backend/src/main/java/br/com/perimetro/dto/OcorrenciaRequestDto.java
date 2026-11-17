package br.com.perimetro.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.UUID;

public class OcorrenciaRequestDto {

    @NotNull(message = "é obrigatória")
    private final UUID categoriaId;

    @Size(max = 500, message = "deve ter no máximo 500 caracteres")
    private final String descricao;

    public OcorrenciaRequestDto(UUID categoriaId, String descricao) {
        this.categoriaId = categoriaId;
        this.descricao = descricao;
    }

    public UUID getCategoriaId() {
        return categoriaId;
    }

    public String getDescricao() {
        return descricao;
    }
}
