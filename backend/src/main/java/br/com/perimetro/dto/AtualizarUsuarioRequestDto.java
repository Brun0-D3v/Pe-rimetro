package br.com.perimetro.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AtualizarUsuarioRequestDto {

    @NotBlank(message = "é obrigatório")
    @Size(min = 2, max = 120, message = "deve ter entre 2 e 120 caracteres")
    private final String nome;

    public AtualizarUsuarioRequestDto(String nome) {
        this.nome = nome;
    }

    public String getNome() {
        return nome;
    }
}
