package br.com.perimetro.dto;

import br.com.perimetro.entity.CategoriaOcorrencia;

import java.util.UUID;

public record CategoriaResponseDto(UUID id, String nome) {

    public static CategoriaResponseDto de(CategoriaOcorrencia categoria) {
        return new CategoriaResponseDto(categoria.getId(), categoria.getNome());
    }
}
