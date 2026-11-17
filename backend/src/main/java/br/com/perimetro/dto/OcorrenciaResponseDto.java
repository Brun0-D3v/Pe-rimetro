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
public class OcorrenciaResponseDto {

    private final UUID id;
    private final UUID trechoId;
    private final String trechoNome;
    private final CategoriaResponseDto categoria;
    private final String descricao;
    private final StatusOcorrencia status;
    private final List<FotoResumoDto> fotos;
    private final Instant criadoEm;
    private final String autorNome;

    private OcorrenciaResponseDto(Ocorrencia ocorrencia, List<Foto> fotos, String autorNome) {
        this.id = ocorrencia.getId();
        this.trechoId = ocorrencia.getTrecho().getId();
        this.trechoNome = ocorrencia.getTrecho().getNome();
        this.categoria = CategoriaResponseDto.de(ocorrencia.getCategoria());
        this.descricao = ocorrencia.getDescricao();
        this.status = ocorrencia.getStatus();
        this.fotos = fotos.stream().map(FotoResumoDto::de).toList();
        this.criadoEm = ocorrencia.getCriadoEm();
        this.autorNome = autorNome;
    }

    public static OcorrenciaResponseDto de(Ocorrencia ocorrencia, List<Foto> fotos, String autorNome) {
        return new OcorrenciaResponseDto(ocorrencia, fotos, autorNome);
    }

    public UUID getId() {
        return id;
    }

    public UUID getTrechoId() {
        return trechoId;
    }

    public String getTrechoNome() {
        return trechoNome;
    }

    public CategoriaResponseDto getCategoria() {
        return categoria;
    }

    public String getDescricao() {
        return descricao;
    }

    public StatusOcorrencia getStatus() {
        return status;
    }

    public List<FotoResumoDto> getFotos() {
        return fotos;
    }

    public Instant getCriadoEm() {
        return criadoEm;
    }

    public String getAutorNome() {
        return autorNome;
    }
}
