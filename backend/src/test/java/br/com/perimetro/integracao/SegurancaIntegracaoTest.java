package br.com.perimetro.integracao;

import br.com.perimetro.IntegracaoBase;
import br.com.perimetro.dto.PontoDto;
import br.com.perimetro.dto.TrechoRequestDto;
import br.com.perimetro.entity.AtivoInativo;
import br.com.perimetro.entity.Avaliacao;
import br.com.perimetro.entity.Perfil;
import br.com.perimetro.entity.Regiao;
import br.com.perimetro.entity.Trecho;
import br.com.perimetro.entity.Usuario;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import com.nimbusds.jose.jwk.source.ImmutableSecret;

import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Matriz de acesso da API (ver o plano da Sprint 04, tarefa 1.4). */
class SegurancaIntegracaoTest extends IntegracaoBase {

    private static final List<PontoDto> GEOMETRIA = List.of(
            new PontoDto(-8.0631, -34.8711),
            new PontoDto(-8.0640, -34.8720));

    @Autowired
    private org.springframework.security.oauth2.jwt.JwtDecoder jwtDecoder;

    private Regiao regiao;
    private Trecho trecho;

    private void prepararDados() {
        regiao = regiaoRepository.save(new Regiao("Recife Antigo"));
        trecho = trechoRepository.save(new Trecho(
                "Rua da Aurora", GEOMETRIA, -8.0631, -34.8711, AtivoInativo.ATIVO, regiao));
    }

    private String corpoTrecho() throws Exception {
        return objectMapper.writeValueAsString(new TrechoRequestDto(
                "Rua nova", GEOMETRIA, -8.0631, -34.8711, regiao.getId(), null));
    }

    private static String corpoAvaliacao() {
        return "{\"notaCalcada\":8,\"notaAcessibilidade\":8,\"notaIluminacao\":8,"
                + "\"notaArborizacao\":8,\"notaTravessias\":8,\"notaMobiliario\":8}";
    }

    private MockHttpServletRequestBuilder json(MockHttpServletRequestBuilder requisicao, String corpo) {
        return requisicao.contentType(MediaType.APPLICATION_JSON).content(corpo);
    }

    // ---- leitura pública ----

    @Test
    void leituraEPublica() throws Exception {
        prepararDados();

        mockMvc.perform(get("/api/v1/trechos")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/trechos/{id}", trecho.getId())).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/regioes")).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/health")).andExpect(status().isOk());
    }

    // ---- criar trecho e avaliar: exige login ----

    @Test
    void criarTrechoExigeLogin() throws Exception {
        prepararDados();

        mockMvc.perform(json(post("/api/v1/trechos"), corpoTrecho()))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(json(post("/api/v1/trechos"), corpoTrecho()).header("Authorization", autorizacao(Perfil.CIDADAO)))
                .andExpect(status().isCreated());
        mockMvc.perform(json(post("/api/v1/trechos"), corpoTrecho()).header("Authorization", autorizacao(Perfil.ADMINISTRADOR)))
                .andExpect(status().isCreated());
    }

    @Test
    void avaliarExigeLogin() throws Exception {
        prepararDados();

        mockMvc.perform(json(post("/api/v1/trechos/{id}/avaliacoes", trecho.getId()), corpoAvaliacao()))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(json(post("/api/v1/trechos/{id}/avaliacoes", trecho.getId()), corpoAvaliacao())
                        .header("Authorization", autorizacao(Perfil.CIDADAO)))
                .andExpect(status().isCreated());
    }

    // ---- editar/remover trecho e escrever regiões: só administrador ----

    @Test
    void atualizarTrechoSoAdministrador() throws Exception {
        prepararDados();
        String url = "/api/v1/trechos/{id}";

        mockMvc.perform(json(put(url, trecho.getId()), corpoTrecho()))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(json(put(url, trecho.getId()), corpoTrecho()).header("Authorization", autorizacao(Perfil.CIDADAO)))
                .andExpect(status().isForbidden());
        mockMvc.perform(json(put(url, trecho.getId()), corpoTrecho()).header("Authorization", autorizacao(Perfil.ADMINISTRADOR)))
                .andExpect(status().isOk());
    }

    @Test
    void removerTrechoSoAdministrador() throws Exception {
        prepararDados();
        String url = "/api/v1/trechos/{id}";

        mockMvc.perform(delete(url, trecho.getId())).andExpect(status().isUnauthorized());
        mockMvc.perform(delete(url, trecho.getId()).header("Authorization", autorizacao(Perfil.CIDADAO)))
                .andExpect(status().isForbidden());
        mockMvc.perform(delete(url, trecho.getId()).header("Authorization", autorizacao(Perfil.ADMINISTRADOR)))
                .andExpect(status().isNoContent());
    }

    @Test
    void escreverRegiaoSoAdministrador() throws Exception {
        String corpo = "{\"nome\":\"Boa Viagem\"}";

        mockMvc.perform(json(post("/api/v1/regioes"), corpo)).andExpect(status().isUnauthorized());
        mockMvc.perform(json(post("/api/v1/regioes"), corpo).header("Authorization", autorizacao(Perfil.CIDADAO)))
                .andExpect(status().isForbidden());
        mockMvc.perform(json(post("/api/v1/regioes"), corpo).header("Authorization", autorizacao(Perfil.ADMINISTRADOR)))
                .andExpect(status().isCreated());
    }

    // ---- tokens inválidos ----

    private String tokenCom(String segredo, Instant expiraEm, String perfil) {
        JwtEncoder encoder = new NimbusJwtEncoder(new ImmutableSecret<>(
                new SecretKeySpec(segredo.getBytes(StandardCharsets.UTF_8), "HmacSHA256")));
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject(UUID.randomUUID().toString())
                .claim("perfil", perfil)
                .issuedAt(expiraEm.minusSeconds(3600))
                .expiresAt(expiraEm)
                .build();
        return "Bearer " + encoder.encode(JwtEncoderParameters.from(
                JwsHeader.with(MacAlgorithm.HS256).build(), claims)).getTokenValue();
    }

    @Test
    void tokenExpiradoRetorna401() throws Exception {
        String expirado = tokenCom("segredo-somente-para-testes-0123456789-abcdef",
                Instant.now().minusSeconds(60), "CIDADAO");

        mockMvc.perform(get("/api/v1/usuarios/me").header("Authorization", expirado))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenAssinadoComOutroSegredoRetorna401() throws Exception {
        String forjado = tokenCom("outro-segredo-completamente-diferente-123456",
                Instant.now().plusSeconds(3600), "ADMINISTRADOR");

        mockMvc.perform(get("/api/v1/usuarios/me").header("Authorization", forjado))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void tokenLixoRetorna401() throws Exception {
        mockMvc.perform(get("/api/v1/usuarios/me").header("Authorization", "Bearer isto.nao.e-um-jwt"))
                .andExpect(status().isUnauthorized());
    }

    // ---- formato dos erros ----

    @Test
    void erros401E403TemCorpoJsonNoPadraoDoProjeto() throws Exception {
        prepararDados();

        mockMvc.perform(json(post("/api/v1/trechos"), corpoTrecho()))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.mensagem").isNotEmpty())
                .andExpect(jsonPath("$.ocorridoEm").isNotEmpty());
        mockMvc.perform(delete("/api/v1/trechos/{id}", trecho.getId()).header("Authorization", autorizacao(Perfil.CIDADAO)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.mensagem").isNotEmpty())
                .andExpect(jsonPath("$.ocorridoEm").isNotEmpty());
    }

    // ---- autoria ----

    @Test
    void avaliacaoGravaOAutorDoToken() throws Exception {
        prepararDados();
        Usuario ana = usuarioRepository.save(new Usuario("Ana", "ana@exemplo.com", "hash", Perfil.CIDADAO));
        String bearer = "Bearer " + tokenService().gerar(ana).getToken();

        mockMvc.perform(json(post("/api/v1/trechos/{id}/avaliacoes", trecho.getId()), corpoAvaliacao())
                        .header("Authorization", bearer))
                .andExpect(status().isCreated());

        Avaliacao avaliacao = avaliacaoRepository.findAll().get(0);
        assertThat(avaliacao.getUsuarioId()).isEqualTo(ana.getId());
    }

    @Test
    void autorEnviadoNoCorpoDaAvaliacaoEIgnorado() throws Exception {
        prepararDados();
        Usuario ana = usuarioRepository.save(new Usuario("Ana", "ana@exemplo.com", "hash", Perfil.CIDADAO));
        UUID forjado = UUID.randomUUID();
        String corpo = corpoAvaliacao().replace("}", ",\"usuarioId\":\"" + forjado + "\"}");

        mockMvc.perform(json(post("/api/v1/trechos/{id}/avaliacoes", trecho.getId()), corpo)
                        .header("Authorization", "Bearer " + tokenService().gerar(ana).getToken()))
                .andExpect(status().isCreated());

        assertThat(avaliacaoRepository.findAll().get(0).getUsuarioId()).isEqualTo(ana.getId());
    }

    @Test
    void trechoGravaOCriadorDoToken() throws Exception {
        prepararDados();
        Usuario ana = usuarioRepository.save(new Usuario("Ana", "ana@exemplo.com", "hash", Perfil.CIDADAO));

        String resposta = mockMvc.perform(json(post("/api/v1/trechos"), corpoTrecho())
                        .header("Authorization", "Bearer " + tokenService().gerar(ana).getToken()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.criadoPorId").doesNotExist())
                .andReturn().getResponse().getContentAsString();

        UUID id = UUID.fromString(objectMapper.readTree(resposta).get("id").asString());
        assertThat(trechoRepository.findById(id).orElseThrow().getCriadoPorId()).isEqualTo(ana.getId());
    }

    @Autowired
    private br.com.perimetro.service.TokenService tokenService;

    private br.com.perimetro.service.TokenService tokenService() {
        return tokenService;
    }
}
