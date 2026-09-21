package br.com.perimetro.dto;

import java.util.UUID;

public class RegiaoResponseDto {

    private final UUID id;
    private final String nome;

    public RegiaoResponseDto(UUID id, String nome) {
        this.id = id;
        this.nome = nome;
    }

    public UUID getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }
}
