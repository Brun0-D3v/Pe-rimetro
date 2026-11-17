package br.com.perimetro.integracao;

import br.com.perimetro.IntegracaoBase;
import br.com.perimetro.dto.PontoDto;
import br.com.perimetro.entity.AtivoInativo;
import br.com.perimetro.entity.Ocorrencia;
import br.com.perimetro.entity.Perfil;
import br.com.perimetro.entity.Regiao;
import br.com.perimetro.entity.StatusOcorrencia;
import br.com.perimetro.entity.Trecho;
import br.com.perimetro.repository.CategoriaOcorrenciaRepository;
import com.jayway.jsonpath.JsonPath;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

class OcorrenciaIntegracaoTest extends IntegracaoBase {

    private static final String POR_TRECHO = "/api/v1/trechos/{id}/ocorrencias";

    @Autowired
    private CategoriaOcorrenciaRepository categoriaRepository;

    @Autowired
    private JwtDecoder jwtDecoder;

    private Trecho novoTrecho(AtivoInativo status) {
        Regiao regiao = regiaoRepository.save(new Regiao("Recife Antigo"));
        return trechoRepository.save(new Trecho(
                "Rua da Aurora", List.of(new PontoDto(-8.06, -34.87)), -8.06, -34.87, status, regiao));
    }

    private UUID categoriaId() {
        return categoriaRepository.findAllByOrderByNomeAsc().get(0).getId();
    }

    private UUID outraCategoriaId() {
        return categoriaRepository.findAllByOrderByNomeAsc().get(1).getId();
    }

    private String corpo(UUID categoria, String descricao) {
        String desc = descricao == null ? "null" : "\"" + descricao + "\"";
        return "{\"categoriaId\":\"" + categoria + "\",\"descricao\":" + desc + "}";
    }

    private UUID idDoToken(String autorizacao) {
        return UUID.fromString(jwtDecoder.decode(autorizacao.substring("Bearer ".length())).getSubject());
    }

    private UUID registrar(Trecho trecho, String autorizacao, String descricao) throws Exception {
        String resposta = mockMvc.perform(post(POR_TRECHO, trecho.getId())
                        .header("Authorization", autorizacao)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(categoriaId(), descricao)))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(JsonPath.read(resposta, "$.id"));
    }

    private void alterarStatus(UUID id, String autorizacao, String novo) throws Exception {
        mockMvc.perform(patch("/api/v1/ocorrencias/{id}", id)
                        .header("Authorization", autorizacao)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"" + novo + "\"}"))
                .andExpect(status().isOk());
    }

    @Test
    void cidadaoRegistraOcorrenciaQueNasceVisivelSemExporAutor() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);

        mockMvc.perform(post("/api/v1/trechos/{id}/ocorrencias", trecho.getId())
                        .header("Authorization", autorizacao(Perfil.CIDADAO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(categoriaId(), "Buraco grande na esquina")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("VISIVEL"))
                .andExpect(jsonPath("$.descricao").value("Buraco grande na esquina"))
                .andExpect(jsonPath("$.trechoId").value(trecho.getId().toString()))
                .andExpect(jsonPath("$.categoria.nome").value("Buraco na calçada"))
                .andExpect(jsonPath("$.autorNome").doesNotExist())
                .andExpect(jsonPath("$.usuarioId").doesNotExist());
    }

    @Test
    void anonimoNaoRegistra() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        mockMvc.perform(post(POR_TRECHO, trecho.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(categoriaId(), "x")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void semCategoriaRetorna400() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        mockMvc.perform(post(POR_TRECHO, trecho.getId())
                        .header("Authorization", autorizacao(Perfil.CIDADAO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"descricao\":\"x\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.mensagem").value(containsString("categoriaId")));
    }

    @Test
    void categoriaInexistenteRetorna404() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        mockMvc.perform(post(POR_TRECHO, trecho.getId())
                        .header("Authorization", autorizacao(Perfil.CIDADAO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(UUID.randomUUID(), "x")))
                .andExpect(status().isNotFound());
    }

    @Test
    void descricaoMaiorQue500Retorna400() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        mockMvc.perform(post(POR_TRECHO, trecho.getId())
                        .header("Authorization", autorizacao(Perfil.CIDADAO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(categoriaId(), "a".repeat(501))))
                .andExpect(status().isBadRequest());
    }

    @Test
    void descricaoSoComEspacosViraNula() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        mockMvc.perform(post(POR_TRECHO, trecho.getId())
                        .header("Authorization", autorizacao(Perfil.CIDADAO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(categoriaId(), "   ")))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.descricao").doesNotExist());
    }

    @Test
    void trechoInexistenteRetorna404() throws Exception {
        mockMvc.perform(post(POR_TRECHO, UUID.randomUUID())
                        .header("Authorization", autorizacao(Perfil.CIDADAO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(categoriaId(), "x")))
                .andExpect(status().isNotFound());
    }

    @Test
    void trechoInativoRetorna409() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.INATIVO);
        mockMvc.perform(post(POR_TRECHO, trecho.getId())
                        .header("Authorization", autorizacao(Perfil.CIDADAO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(categoriaId(), "x")))
                .andExpect(status().isConflict());
    }

    @Test
    void autorVemDoToken() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        String auth = autorizacao(Perfil.CIDADAO);
        UUID forjado = UUID.randomUUID();

        mockMvc.perform(post(POR_TRECHO, trecho.getId())
                        .header("Authorization", auth)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"categoriaId\":\"" + categoriaId() + "\",\"descricao\":\"x\",\"usuarioId\":\""
                                + forjado + "\"}"))
                .andExpect(status().isCreated());

        List<Ocorrencia> todas = ocorrenciaRepository.findAll();
        assertThat(todas).hasSize(1);
        assertThat(todas.get(0).getUsuarioId()).isEqualTo(idDoToken(auth));
    }

    @Test
    void listaPublicaDoTrechoSoMostraVisiveisMaisRecentesPrimeiroSemAutor() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        String auth = autorizacao(Perfil.CIDADAO);
        registrar(trecho, auth, "primeira");
        registrar(trecho, auth, "segunda");

        mockMvc.perform(get(POR_TRECHO, trecho.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.itens[0].descricao").value("segunda"))
                .andExpect(jsonPath("$.itens[1].descricao").value("primeira"))
                .andExpect(jsonPath("$.itens[0].status").value("VISIVEL"))
                .andExpect(jsonPath("$.itens[0].autorNome").doesNotExist())
                .andExpect(jsonPath("$.itens[0].usuarioId").doesNotExist());
    }

    @Test
    void listaPublicaEscondeOcultas() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        UUID id = registrar(trecho, autorizacao(Perfil.CIDADAO), "some");
        alterarStatus(id, autorizacao(Perfil.ADMINISTRADOR), "OCULTA");

        mockMvc.perform(get(POR_TRECHO, trecho.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0));
    }

    @Test
    void paginacaoELimitadaA50() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        mockMvc.perform(get(POR_TRECHO, trecho.getId()).param("tamanho", "500"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tamanho").value(50));
    }

    @Test
    void contagemPorTrechoConsideraSoVisiveis() throws Exception {
        Trecho a = novoTrecho(AtivoInativo.ATIVO);
        String auth = autorizacao(Perfil.CIDADAO);
        registrar(a, auth, "um");
        registrar(a, auth, "dois");
        UUID oculta = registrar(a, auth, "tres");
        alterarStatus(oculta, autorizacao(Perfil.ADMINISTRADOR), "OCULTA");

        mockMvc.perform(get("/api/v1/ocorrencias/contagem-por-trecho"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].trechoId").value(a.getId().toString()))
                .andExpect(jsonPath("$[0].total").value(2));
    }

    @Test
    void adminListaTudoComAutorNome() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        String admin = autorizacao(Perfil.ADMINISTRADOR);
        UUID id = registrar(trecho, autorizacao(Perfil.CIDADAO), "x");
        alterarStatus(id, admin, "OCULTA");
        registrar(trecho, autorizacao(Perfil.CIDADAO), "y");

        mockMvc.perform(get("/api/v1/ocorrencias").header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.itens[0].autorNome").value("Usuário CIDADAO"));
    }

    @Test
    void filtroPorStatus() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        String admin = autorizacao(Perfil.ADMINISTRADOR);
        UUID id = registrar(trecho, autorizacao(Perfil.CIDADAO), "x");
        registrar(trecho, autorizacao(Perfil.CIDADAO), "y");
        alterarStatus(id, admin, "OCULTA");

        mockMvc.perform(get("/api/v1/ocorrencias").param("status", "OCULTA").header("Authorization", admin))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.itens[0].status").value("OCULTA"));
    }

    @Test
    void moderadasPorMimFiltraPeloAdministrador() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        String adminA = autorizacao(Perfil.ADMINISTRADOR);
        String adminB = autorizacao(Perfil.ADMINISTRADOR);
        UUID id = registrar(trecho, autorizacao(Perfil.CIDADAO), "x");
        alterarStatus(id, adminA, "OCULTA");

        mockMvc.perform(get("/api/v1/ocorrencias").param("moderadasPorMim", "true").header("Authorization", adminB))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(0));
        mockMvc.perform(get("/api/v1/ocorrencias").param("moderadasPorMim", "true").header("Authorization", adminA))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void cidadaoNaListaAdminRecebe403() throws Exception {
        mockMvc.perform(get("/api/v1/ocorrencias").header("Authorization", autorizacao(Perfil.CIDADAO)))
                .andExpect(status().isForbidden());
    }

    @Test
    void anonimoNaListaAdminRecebe401() throws Exception {
        mockMvc.perform(get("/api/v1/ocorrencias"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void adminOcultaERegistraModerador() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        String admin = autorizacao(Perfil.ADMINISTRADOR);
        UUID id = registrar(trecho, autorizacao(Perfil.CIDADAO), "x");

        mockMvc.perform(patch("/api/v1/ocorrencias/{id}", id)
                        .header("Authorization", admin)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"OCULTA\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("OCULTA"));

        Ocorrencia salva = ocorrenciaRepository.findById(id).orElseThrow();
        assertThat(salva.getStatus()).isEqualTo(StatusOcorrencia.OCULTA);
        assertThat(salva.getModeradaPorId()).isEqualTo(idDoToken(admin));
    }

    @Test
    void adminReexibeEVoltaALista() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        String admin = autorizacao(Perfil.ADMINISTRADOR);
        UUID id = registrar(trecho, autorizacao(Perfil.CIDADAO), "x");
        alterarStatus(id, admin, "OCULTA");
        alterarStatus(id, admin, "VISIVEL");

        mockMvc.perform(get(POR_TRECHO, trecho.getId()))
                .andExpect(jsonPath("$.total").value(1));
    }

    @Test
    void cidadaoNoPatchRecebe403() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        String dono = autorizacao(Perfil.CIDADAO);
        UUID id = registrar(trecho, dono, "x");

        mockMvc.perform(patch("/api/v1/ocorrencias/{id}", id)
                        .header("Authorization", dono)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"OCULTA\"}"))
                .andExpect(status().isForbidden());
    }

    @Test
    void statusInvalidoRetorna400() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        UUID id = registrar(trecho, autorizacao(Perfil.CIDADAO), "x");

        mockMvc.perform(patch("/api/v1/ocorrencias/{id}", id)
                        .header("Authorization", autorizacao(Perfil.ADMINISTRADOR))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"RESOLVIDA\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void donoEditaOcorrencia() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        String dono = autorizacao(Perfil.CIDADAO);
        UUID id = registrar(trecho, dono, "antiga");

        mockMvc.perform(put("/api/v1/ocorrencias/{id}", id)
                        .header("Authorization", dono)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(outraCategoriaId(), "nova")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.descricao").value("nova"))
                .andExpect(jsonPath("$.categoria.id").value(outraCategoriaId().toString()));
    }

    @Test
    void outroUsuarioNaoEdita() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        UUID id = registrar(trecho, autorizacao(Perfil.CIDADAO), "x");

        mockMvc.perform(put("/api/v1/ocorrencias/{id}", id)
                        .header("Authorization", autorizacao(Perfil.CIDADAO))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(categoriaId(), "hack")))
                .andExpect(status().isForbidden());
    }

    @Test
    void donoNaoEditaOcorrenciaOculta() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        String dono = autorizacao(Perfil.CIDADAO);
        UUID id = registrar(trecho, dono, "x");
        alterarStatus(id, autorizacao(Perfil.ADMINISTRADOR), "OCULTA");

        mockMvc.perform(put("/api/v1/ocorrencias/{id}", id)
                        .header("Authorization", dono)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(corpo(categoriaId(), "tarde")))
                .andExpect(status().isConflict());
    }

    @Test
    void donoExcluiOcorrencia() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        String dono = autorizacao(Perfil.CIDADAO);
        UUID id = registrar(trecho, dono, "x");

        mockMvc.perform(delete("/api/v1/ocorrencias/{id}", id).header("Authorization", dono))
                .andExpect(status().isNoContent());

        assertThat(ocorrenciaRepository.findById(id)).isEmpty();
    }

    @Test
    void outroUsuarioNaoExclui() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        UUID id = registrar(trecho, autorizacao(Perfil.CIDADAO), "x");

        mockMvc.perform(delete("/api/v1/ocorrencias/{id}", id).header("Authorization", autorizacao(Perfil.CIDADAO)))
                .andExpect(status().isForbidden());
        assertThat(ocorrenciaRepository.findById(id)).isPresent();
    }

    @Test
    void minhasOcorrenciasMostraSoAsDelasInclusiveOcultas() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        String eu = autorizacao(Perfil.CIDADAO);
        UUID oculta = registrar(trecho, eu, "minha oculta");
        registrar(trecho, eu, "minha visivel");
        registrar(trecho, autorizacao(Perfil.CIDADAO), "de outro");
        alterarStatus(oculta, autorizacao(Perfil.ADMINISTRADOR), "OCULTA");

        mockMvc.perform(get("/api/v1/usuarios/me/ocorrencias").header("Authorization", eu))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(2))
                .andExpect(jsonPath("$.itens[0].status").value("VISIVEL"))
                .andExpect(jsonPath("$.itens[1].status").value("OCULTA"));
    }

    @Test
    void resumoTrazTotalDeOcorrencias() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        String eu = autorizacao(Perfil.CIDADAO);
        registrar(trecho, eu, "a");
        registrar(trecho, eu, "b");

        mockMvc.perform(get("/api/v1/usuarios/me/resumo").header("Authorization", eu))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalOcorrencias").value(2))
                .andExpect(jsonPath("$.totalAvaliacoes").value(0));
    }

    @Test
    void registrarOcorrenciaNaoAlteraOIndiceDoTrecho() throws Exception {
        Trecho trecho = novoTrecho(AtivoInativo.ATIVO);
        String antes = mockMvc.perform(get("/api/v1/trechos/{id}", trecho.getId()))
                .andReturn().getResponse().getContentAsString();

        registrar(trecho, autorizacao(Perfil.CIDADAO), "x");

        String depois = mockMvc.perform(get("/api/v1/trechos/{id}", trecho.getId()))
                .andReturn().getResponse().getContentAsString();
        assertThat(depois).isEqualTo(antes);
    }
}
