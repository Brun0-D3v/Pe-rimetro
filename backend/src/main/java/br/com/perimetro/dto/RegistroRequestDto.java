package br.com.perimetro.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class RegistroRequestDto {

    @NotBlank(message = "é obrigatório")
    @Size(min = 2, max = 120, message = "deve ter entre 2 e 120 caracteres")
    private final String nome;

    @NotBlank(message = "é obrigatório")
    @Email(message = "deve ser um e-mail válido")
    @Size(max = 254, message = "deve ter no máximo 254 caracteres")
    private final String email;

    @NotBlank(message = "é obrigatória")
    @Size(min = 8, max = 72, message = "deve ter entre 8 e 72 caracteres")
    private final String senha;

    public RegistroRequestDto(String nome, String email, String senha) {
        this.nome = nome;
        this.email = email;
        this.senha = senha;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    public String getSenha() {
        return senha;
    }
}
