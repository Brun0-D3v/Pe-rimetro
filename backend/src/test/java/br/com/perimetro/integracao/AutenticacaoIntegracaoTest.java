package br.com.perimetro.integracao;

import br.com.perimetro.IntegracaoBase;
import br.com.perimetro.entity.Perfil;
import br.com.perimetro.entity.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.test.web.servlet.MvcResult;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class AutenticacaoIntegracaoTest extends IntegracaoBase {

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtDecoder jwtDecoder;

    private MvcResult registrar(String nome, String email, String senha) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/registrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("nome", nome, "email", email, "senha", senha))))
                .andReturn();
    }

    @Test
    void registraUsuarioCidadaoERetornaTokenSemExporASenha() throws Exception {
        mockMvc.perform(post("/api/v1/auth/registrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Ana","email":"Ana@Exemplo.com","senha":"senha-segura"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.tipo").value("Bearer"))
                .andExpect(jsonPath("$.usuario.email").value("ana@exemplo.com"))
                .andExpect(jsonPath("$.usuario.perfil").value("CIDADAO"))
                .andExpect(jsonPath("$.usuario.senhaHash").doesNotExist())
                .andExpect(jsonPath("$.usuario.senha").doesNotExist());

        Usuario salvo = usuarioRepository.findByEmailIgnoreCase("ana@exemplo.com").orElseThrow();
        assertThat(salvo.getSenhaHash()).isNotEqualTo("senha-segura");
        assertThat(passwordEncoder.matches("senha-segura", salvo.getSenhaHash())).isTrue();
    }

    @Test
    void ignoraPerfilEnviadoNoCadastroParaNaoPermitirAutopromocao() throws Exception {
        mockMvc.perform(post("/api/v1/auth/registrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Ana","email":"ana@exemplo.com","senha":"senha-segura","perfil":"ADMINISTRADOR"}"""))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.usuario.perfil").value("CIDADAO"));
    }

    @Test
    void rejeitaEmailDuplicadoComConflito() throws Exception {
        registrar("Ana", "ana@exemplo.com", "senha-segura");

        mockMvc.perform(post("/api/v1/auth/registrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Outra","email":"ANA@exemplo.com","senha":"senha-segura"}"""))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.mensagem").value("E-mail já cadastrado"));
    }

    @Test
    void rejeitaSenhaCurtaEEmailInvalido() throws Exception {
        mockMvc.perform(post("/api/v1/auth/registrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Ana","email":"ana@exemplo.com","senha":"curta"}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value(org.hamcrest.Matchers.containsString("senha")));

        mockMvc.perform(post("/api/v1/auth/registrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"nome":"Ana","email":"nao-e-email","senha":"senha-segura"}"""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value(org.hamcrest.Matchers.containsString("email")));
    }

    @Test
    void loginDevolveTokenComSubjectEPerfil() throws Exception {
        registrar("Ana", "ana@exemplo.com", "senha-segura");

        MvcResult resultado = mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"ANA@exemplo.com","senha":"senha-segura"}"""))
                .andExpect(status().isOk())
                .andReturn();

        String token = objectMapper.readTree(resultado.getResponse().getContentAsString()).get("token").asString();
        Jwt jwt = jwtDecoder.decode(token);
        Usuario usuario = usuarioRepository.findByEmailIgnoreCase("ana@exemplo.com").orElseThrow();
        assertThat(jwt.getSubject()).isEqualTo(usuario.getId().toString());
        assertThat(jwt.getClaimAsString("perfil")).isEqualTo(Perfil.CIDADAO.name());
        assertThat(jwt.getExpiresAt()).isAfter(jwt.getIssuedAt());
    }

    @Test
    void loginIncorretoRetorna401ComAMesmaMensagemParaSenhaEEmail() throws Exception {
        registrar("Ana", "ana@exemplo.com", "senha-segura");

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"ana@exemplo.com","senha":"senha-errada"}"""))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensagem").value("E-mail ou senha incorretos"));

        mockMvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"ninguem@exemplo.com","senha":"senha-segura"}"""))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensagem").value("E-mail ou senha incorretos"));
    }
}
