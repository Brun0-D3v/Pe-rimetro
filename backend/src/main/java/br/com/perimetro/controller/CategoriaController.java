package br.com.perimetro.controller;

import br.com.perimetro.dto.CategoriaResponseDto;
import br.com.perimetro.repository.CategoriaOcorrenciaRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/categorias")
public class CategoriaController {

    private final CategoriaOcorrenciaRepository repository;

    public CategoriaController(CategoriaOcorrenciaRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<CategoriaResponseDto> listar() {
        return repository.findAllByOrderByNomeAsc().stream().map(CategoriaResponseDto::de).toList();
    }
}
