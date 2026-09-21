package br.com.perimetro.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegiaoRequestDto {

    @NotBlank(message = "nome é obrigatório")
    @Size(max = 150, message = "nome deve ter no máximo 150 caracteres")
    private final String nome;

    public RegiaoRequestDto(String nome) {
        this.nome = nome;
    }

    public String getNome() {
        return nome;
    }
}
