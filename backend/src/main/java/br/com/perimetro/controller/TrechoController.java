package br.com.perimetro.controller;

import br.com.perimetro.dto.TrechoRequestDto;
import br.com.perimetro.dto.TrechoResponseDto;
import br.com.perimetro.service.TrechoService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
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
@RequestMapping("/api/v1/trechos")
public class TrechoController {

    private final TrechoService trechoService;

    public TrechoController(TrechoService trechoService) {
        this.trechoService = trechoService;
    }

    @GetMapping
    public List<TrechoResponseDto> listar(@RequestParam(required = false) UUID regiaoId) {
        return trechoService.listar(regiaoId);
    }

    @GetMapping("/{id}")
    public TrechoResponseDto buscarPorId(@PathVariable UUID id) {
        return trechoService.buscarPorId(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TrechoResponseDto criar(@Valid @RequestBody TrechoRequestDto dto) {
        return trechoService.criar(dto);
    }

    @PutMapping("/{id}")
    public TrechoResponseDto atualizar(@PathVariable UUID id, @Valid @RequestBody TrechoRequestDto dto) {
        return trechoService.atualizar(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletar(@PathVariable UUID id) {
        trechoService.deletar(id);
    }
}
