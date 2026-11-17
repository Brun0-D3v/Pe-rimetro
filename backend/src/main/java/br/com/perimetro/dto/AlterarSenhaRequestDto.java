package br.com.perimetro.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AlterarSenhaRequestDto {

    @NotBlank(message = "é obrigatória")
    private final String senhaAtual;

    @NotBlank(message = "é obrigatória")
    @Size(min = 8, max = 72, message = "deve ter entre 8 e 72 caracteres")
    private final String novaSenha;

    public AlterarSenhaRequestDto(String senhaAtual, String novaSenha) {
        this.senhaAtual = senhaAtual;
        this.novaSenha = novaSenha;
    }

    public String getSenhaAtual() {
        return senhaAtual;
    }

    public String getNovaSenha() {
        return novaSenha;
    }
}
