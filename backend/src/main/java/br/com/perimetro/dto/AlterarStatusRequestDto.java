package br.com.perimetro.dto;

import br.com.perimetro.entity.StatusOcorrencia;
import jakarta.validation.constraints.NotNull;

public class AlterarStatusRequestDto {

    @NotNull(message = "é obrigatório")
    private final StatusOcorrencia status;

    public AlterarStatusRequestDto(StatusOcorrencia status) {
        this.status = status;
    }

    public StatusOcorrencia getStatus() {
        return status;
    }
}
