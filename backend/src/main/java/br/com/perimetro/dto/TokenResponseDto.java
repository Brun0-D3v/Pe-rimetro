package br.com.perimetro.dto;

import java.time.Instant;

public class TokenResponseDto {

    private final String token;
    private final String tipo;
    private final Instant expiraEm;
    private final UsuarioResponseDto usuario;

    public TokenResponseDto(String token, Instant expiraEm, UsuarioResponseDto usuario) {
        this.token = token;
        this.tipo = "Bearer";
        this.expiraEm = expiraEm;
        this.usuario = usuario;
    }

    public String getToken() {
        return token;
    }

    public String getTipo() {
        return tipo;
    }

    public Instant getExpiraEm() {
        return expiraEm;
    }

    public UsuarioResponseDto getUsuario() {
        return usuario;
    }
}
