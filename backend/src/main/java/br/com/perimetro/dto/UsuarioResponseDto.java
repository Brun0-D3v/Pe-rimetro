package br.com.perimetro.dto;

import br.com.perimetro.entity.Perfil;
import br.com.perimetro.entity.Usuario;

import java.util.UUID;

public class UsuarioResponseDto {

    private final UUID id;
    private final String nome;
    private final String email;
    private final Perfil perfil;

    public UsuarioResponseDto(UUID id, String nome, String email, Perfil perfil) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.perfil = perfil;
    }

    public static UsuarioResponseDto de(Usuario usuario) {
        return new UsuarioResponseDto(usuario.getId(), usuario.getNome(), usuario.getEmail(), usuario.getPerfil());
    }

    public UUID getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getEmail() {
        return email;
    }

    public Perfil getPerfil() {
        return perfil;
    }
}
