package br.com.perimetro;

import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.UUID;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

/** Autenticação simulada para testes de controller (@WebMvcTest), sem passar pelo login. */
public final class JwtTestes {

    private JwtTestes() {
    }

    public static RequestPostProcessor cidadao() {
        return usuarioComPerfil(UUID.randomUUID(), "CIDADAO");
    }

    public static RequestPostProcessor cidadao(UUID id) {
        return usuarioComPerfil(id, "CIDADAO");
    }

    public static RequestPostProcessor admin() {
        return usuarioComPerfil(UUID.randomUUID(), "ADMINISTRADOR");
    }

    private static RequestPostProcessor usuarioComPerfil(UUID id, String perfil) {
        return jwt()
                .jwt(token -> token.subject(id.toString()).claim("perfil", perfil))
                .authorities(new SimpleGrantedAuthority("ROLE_" + perfil));
    }
}
