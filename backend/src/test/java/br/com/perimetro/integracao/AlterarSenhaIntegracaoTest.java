package br.com.perimetro.integracao;

import br.com.perimetro.IntegracaoBase;
import br.com.perimetro.entity.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AlterarSenhaIntegracaoTest extends IntegracaoBase {

    private static final String EMAIL = "ana@exemplo.com";
    private static final String SENHA = "senha-segura";

    // Cadastra pela API para o hash ser um BCrypt de verdade.
    private String cadastrarERetornarBearer() throws Exception {
        String resposta = mockMvc.perform(post("/api/v1/auth/registrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Ana\",\"email\":\"" + EMAIL + "\",\"senha\":\"" + SENHA + "\"}"))
                .andReturn().getResponse().getContentAsString();
        return "Bearer " + objectMapper.readTree(resposta).get("token").asString();
    }

    private ResultActions trocar(String bearer, String atual, String nova) throws Exception {
        return mockMvc.perform(put("/api/v1/usuarios/me/senha")
                .header("Authorization", bearer)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"senhaAtual\":\"" + atual + "\",\"novaSenha\":\"" + nova + "\"}"));
    }

    private int login(String senha) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"" + EMAIL + "\",\"senha\":\"" + senha + "\"}"))
                .andReturn().getResponse().getStatus();
    }

    @Test
    void trocaASenhaELoginPassaAUsarANova() throws Exception {
        String bearer = cadastrarERetornarBearer();

        trocar(bearer, SENHA, "outra-senha-9").andExpect(status().isNoContent());

        assertThat(login("outra-senha-9")).isEqualTo(200);
        assertThat(login(SENHA)).isEqualTo(401);
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(EMAIL).orElseThrow();
        assertThat(usuario.getSenhaHash()).startsWith("$2");
        assertThat(usuario.getSenhaHash()).doesNotContain("outra-senha-9");
    }

    @Test
    void senhaAtualErradaRetorna400NaoOitocentosEUm() throws Exception {
        String bearer = cadastrarERetornarBearer();

        trocar(bearer, "senha-errada-1", "outra-senha-9")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("Senha atual incorreta"));

        assertThat(login(SENHA)).isEqualTo(200);
    }

    @Test
    void novaSenhaIgualAAtualRetorna400() throws Exception {
        String bearer = cadastrarERetornarBearer();

        trocar(bearer, SENHA, SENHA)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value("A nova senha deve ser diferente da atual"));
    }

    @Test
    void novaSenhaCurtaOuLongaDemaisRetorna400() throws Exception {
        String bearer = cadastrarERetornarBearer();

        trocar(bearer, SENHA, "curta").andExpect(status().isBadRequest());
        trocar(bearer, SENHA, "a".repeat(73)).andExpect(status().isBadRequest());
        assertThat(login(SENHA)).isEqualTo(200);
    }

    @Test
    void semTokenRetorna401() throws Exception {
        trocar("", SENHA, "outra-senha-9").andExpect(status().isUnauthorized());
    }
}
