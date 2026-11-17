package br.com.perimetro.integracao;

import br.com.perimetro.IntegracaoBase;
import br.com.perimetro.entity.Perfil;
import br.com.perimetro.entity.Usuario;
import br.com.perimetro.service.TokenService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class UsuarioIntegracaoTest extends IntegracaoBase {

    @Autowired
    private TokenService tokenService;

    private Usuario criar(Perfil perfil) {
        return usuarioRepository.save(new Usuario("Ana", "ana@exemplo.com", "hash", perfil));
    }

    private String bearer(Usuario usuario) {
        return "Bearer " + tokenService.gerar(usuario).getToken();
    }

    @Test
    void meSemTokenRetorna401() throws Exception {
        mockMvc.perform(get("/api/v1/usuarios/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void meComTokenDevolveOsDadosSemSenha() throws Exception {
        Usuario ana = criar(Perfil.CIDADAO);

        mockMvc.perform(get("/api/v1/usuarios/me").header("Authorization", bearer(ana)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(ana.getId().toString()))
                .andExpect(jsonPath("$.email").value("ana@exemplo.com"))
                .andExpect(jsonPath("$.perfil").value("CIDADAO"))
                .andExpect(jsonPath("$.senhaHash").doesNotExist());
    }

    @Test
    void tokenDeUsuarioApagadoRetorna401() throws Exception {
        Usuario ana = criar(Perfil.CIDADAO);
        String token = bearer(ana);
        usuarioRepository.delete(ana);

        mockMvc.perform(get("/api/v1/usuarios/me").header("Authorization", token))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void putAlteraSoONomeEIgnoraEmailEPerfil() throws Exception {
        Usuario ana = criar(Perfil.CIDADAO);

        mockMvc.perform(put("/api/v1/usuarios/me")
                        .header("Authorization", bearer(ana))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"  Ana Maria ","email":"outro@exemplo.com","perfil":"ADMINISTRADOR"}"""))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Ana Maria"))
                .andExpect(jsonPath("$.email").value("ana@exemplo.com"))
                .andExpect(jsonPath("$.perfil").value("CIDADAO"));

        Usuario depois = usuarioRepository.findById(ana.getId()).orElseThrow();
        assertThat(depois.getNome()).isEqualTo("Ana Maria");
        assertThat(depois.getPerfil()).isEqualTo(Perfil.CIDADAO);
    }

    @Test
    void putComNomeEmBrancoRetorna400() throws Exception {
        Usuario ana = criar(Perfil.CIDADAO);

        mockMvc.perform(put("/api/v1/usuarios/me")
                        .header("Authorization", bearer(ana))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"  "}"""))
                .andExpect(status().isBadRequest());
    }
}
