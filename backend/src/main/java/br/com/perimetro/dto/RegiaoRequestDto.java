package br.com.perimetro.dto;

import jakarta.validation.constraints.NotBlank;

public class RegiaoRequestDto {

    @NotBlank(message = "nome é obrigatório")
    private final String nome;

    public RegiaoRequestDto(String nome) {
        this.nome = nome;
    }

    public String getNome() {
        return nome;
    }
}
