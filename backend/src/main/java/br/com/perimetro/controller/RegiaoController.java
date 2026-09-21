package br.com.perimetro.controller;

import br.com.perimetro.dto.RegiaoRequestDto;
import br.com.perimetro.dto.RegiaoResponseDto;
import br.com.perimetro.service.RegiaoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/regioes")
public class RegiaoController {

    private final RegiaoService regiaoService;

    public RegiaoController(RegiaoService regiaoService) {
        this.regiaoService = regiaoService;
    }

    @GetMapping
    public List<RegiaoResponseDto> listar() {
        return regiaoService.listar();
    }

    @GetMapping("/{id}")
    public RegiaoResponseDto buscarPorId(@PathVariable UUID id) {
        return regiaoService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public RegiaoResponseDto criar(@Valid @RequestBody RegiaoRequestDto dto) {
        return regiaoService.criar(dto);
    }

    @PutMapping("/{id}")
    public RegiaoResponseDto atualizar(@PathVariable UUID id, @Valid @RequestBody RegiaoRequestDto dto) {
        return regiaoService.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable UUID id) {
        regiaoService.deletar(id);
    }
}
