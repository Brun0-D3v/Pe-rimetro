package br.com.perimetro.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public class AvaliacaoRequestDto {

    @NotNull(message = "é obrigatória")
    @Min(value = 0, message = "deve estar entre 0 e 10")
    @Max(value = 10, message = "deve estar entre 0 e 10")
    private final Integer notaCalcada;

    @NotNull(message = "é obrigatória")
    @Min(value = 0, message = "deve estar entre 0 e 10")
    @Max(value = 10, message = "deve estar entre 0 e 10")
    private final Integer notaAcessibilidade;

    @NotNull(message = "é obrigatória")
    @Min(value = 0, message = "deve estar entre 0 e 10")
    @Max(value = 10, message = "deve estar entre 0 e 10")
    private final Integer notaIluminacao;

    @NotNull(message = "é obrigatória")
    @Min(value = 0, message = "deve estar entre 0 e 10")
    @Max(value = 10, message = "deve estar entre 0 e 10")
    private final Integer notaArborizacao;

    @NotNull(message = "é obrigatória")
    @Min(value = 0, message = "deve estar entre 0 e 10")
    @Max(value = 10, message = "deve estar entre 0 e 10")
    private final Integer notaTravessias;

    @NotNull(message = "é obrigatória")
    @Min(value = 0, message = "deve estar entre 0 e 10")
    @Max(value = 10, message = "deve estar entre 0 e 10")
    private final Integer notaMobiliario;

    public AvaliacaoRequestDto(Integer notaCalcada, Integer notaAcessibilidade, Integer notaIluminacao,
                                Integer notaArborizacao, Integer notaTravessias, Integer notaMobiliario) {
        this.notaCalcada = notaCalcada;
        this.notaAcessibilidade = notaAcessibilidade;
        this.notaIluminacao = notaIluminacao;
        this.notaArborizacao = notaArborizacao;
        this.notaTravessias = notaTravessias;
        this.notaMobiliario = notaMobiliario;
    }

    public Integer getNotaCalcada() {
        return notaCalcada;
    }

    public Integer getNotaAcessibilidade() {
        return notaAcessibilidade;
    }

    public Integer getNotaIluminacao() {
        return notaIluminacao;
    }

    public Integer getNotaArborizacao() {
        return notaArborizacao;
    }

    public Integer getNotaTravessias() {
        return notaTravessias;
    }

    public Integer getNotaMobiliario() {
        return notaMobiliario;
    }
}
