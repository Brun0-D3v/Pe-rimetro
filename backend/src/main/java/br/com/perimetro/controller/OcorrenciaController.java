package br.com.perimetro.controller;

import br.com.perimetro.dto.AlterarStatusRequestDto;
import br.com.perimetro.dto.ContagemOcorrenciaDto;
import br.com.perimetro.dto.OcorrenciaRequestDto;
import br.com.perimetro.dto.OcorrenciaResponseDto;
import br.com.perimetro.dto.PaginaDto;
import br.com.perimetro.entity.StatusOcorrencia;
import br.com.perimetro.service.OcorrenciaService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
public class OcorrenciaController {

    private final OcorrenciaService ocorrenciaService;

    public OcorrenciaController(OcorrenciaService ocorrenciaService) {
        this.ocorrenciaService = ocorrenciaService;
    }

    private static UUID idDe(Authentication autenticacao) {
        return UUID.fromString(autenticacao.getName());
    }

    @PostMapping("/trechos/{trechoId}/ocorrencias")
    @ResponseStatus(HttpStatus.CREATED)
    public OcorrenciaResponseDto criar(@PathVariable UUID trechoId, @Valid @RequestBody OcorrenciaRequestDto dto,
                                       Authentication autenticacao) {
        return ocorrenciaService.criar(trechoId, dto, idDe(autenticacao));
    }

    @GetMapping("/trechos/{trechoId}/ocorrencias")
    public PaginaDto<OcorrenciaResponseDto> listarDoTrecho(@PathVariable UUID trechoId,
                                                           @RequestParam(defaultValue = "0") int pagina,
                                                           @RequestParam(defaultValue = "20") int tamanho) {
        return ocorrenciaService.listarPublicasDoTrecho(trechoId, pagina, tamanho);
    }

    @GetMapping("/ocorrencias/contagem-por-trecho")
    public List<ContagemOcorrenciaDto> contagemPorTrecho() {
        return ocorrenciaService.contagemPorTrecho();
    }

    @GetMapping("/ocorrencias")
    public PaginaDto<OcorrenciaResponseDto> listarParaModeracao(
            @RequestParam(required = false) StatusOcorrencia status,
            @RequestParam(defaultValue = "false") boolean moderadasPorMim,
            @RequestParam(defaultValue = "0") int pagina,
            @RequestParam(defaultValue = "20") int tamanho,
            Authentication autenticacao) {
        return ocorrenciaService.listarParaModeracao(status, moderadasPorMim, idDe(autenticacao), pagina, tamanho);
    }

    @PatchMapping("/ocorrencias/{id}")
    public OcorrenciaResponseDto alterarStatus(@PathVariable UUID id,
                                               @Valid @RequestBody AlterarStatusRequestDto dto,
                                               Authentication autenticacao) {
        return ocorrenciaService.alterarStatus(id, dto.getStatus(), idDe(autenticacao));
    }

    @PutMapping("/ocorrencias/{id}")
    public OcorrenciaResponseDto editar(@PathVariable UUID id, @Valid @RequestBody OcorrenciaRequestDto dto,
                                        Authentication autenticacao) {
        return ocorrenciaService.editar(id, dto, idDe(autenticacao));
    }

    @DeleteMapping("/ocorrencias/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void excluir(@PathVariable UUID id, Authentication autenticacao) {
        ocorrenciaService.excluir(id, idDe(autenticacao));
    }
}
