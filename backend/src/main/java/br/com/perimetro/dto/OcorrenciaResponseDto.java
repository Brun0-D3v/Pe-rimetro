package br.com.perimetro.dto;

import br.com.perimetro.entity.Foto;
import br.com.perimetro.entity.Ocorrencia;
import br.com.perimetro.entity.StatusOcorrencia;
import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Ocorrência como exposta pela API. O autor nunca aparece por id: só {@code autorNome}, e apenas
 * quando quem monta a resposta é a moderação (nas listas públicas e em "minhas" fica nulo).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record OcorrenciaResponseDto(
        UUID id,
        UUID trechoId,
        String trechoNome,
        CategoriaResponseDto categoria,
        String descricao,
        StatusOcorrencia status,
        List<FotoResumoDto> fotos,
        Instant criadoEm,
        String autorNome) {

    public static OcorrenciaResponseDto de(Ocorrencia ocorrencia, List<Foto> fotos, String autorNome) {
        return new OcorrenciaResponseDto(
                ocorrencia.getId(),
                ocorrencia.getTrecho().getId(),
                ocorrencia.getTrecho().getNome(),
                CategoriaResponseDto.de(ocorrencia.getCategoria()),
                ocorrencia.getDescricao(),
                ocorrencia.getStatus(),
                fotos.stream().map(FotoResumoDto::de).toList(),
                ocorrencia.getCriadoEm(),
                autorNome);
    }
}
