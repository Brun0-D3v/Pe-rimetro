package br.com.perimetro.integracao;

import br.com.perimetro.IntegracaoBase;
import br.com.perimetro.dto.PontoDto;
import br.com.perimetro.entity.AtivoInativo;
import br.com.perimetro.entity.Avaliacao;
import br.com.perimetro.entity.Regiao;
import br.com.perimetro.entity.Trecho;
import br.com.perimetro.repository.AvaliacaoRepository.MediasPorDimensao;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AvaliacaoRepositoryIntegracaoTest extends IntegracaoBase {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private Trecho novoTrecho() {
        Regiao regiao = regiaoRepository.save(new Regiao("Recife Antigo"));
        return trechoRepository.save(new Trecho(
                "Rua da Aurora", List.of(new PontoDto(-8.06, -34.87)), -8.06, -34.87, AtivoInativo.ATIVO, regiao));
    }

    @Test
    void calculaAsMediasPorDimensaoNoBanco() {
        Trecho trecho = novoTrecho();
        avaliacaoRepository.save(new Avaliacao(trecho, 10, 8, 6, 4, 2, 0));
        avaliacaoRepository.save(new Avaliacao(trecho, 6, 4, 2, 0, 10, 8));

        MediasPorDimensao medias = avaliacaoRepository.mediasPorDimensao(trecho.getId());

        assertThat(medias.getCalcada()).isEqualTo(8.0);
        assertThat(medias.getAcessibilidade()).isEqualTo(6.0);
        assertThat(medias.getIluminacao()).isEqualTo(4.0);
        assertThat(medias.getArborizacao()).isEqualTo(2.0);
        assertThat(medias.getTravessias()).isEqualTo(6.0);
        assertThat(medias.getMobiliario()).isEqualTo(4.0);
        assertThat(avaliacaoRepository.countByTrechoId(trecho.getId())).isEqualTo(2);
    }

    @Test
    void persisteAvaliacaoAnonima() {
        Trecho trecho = novoTrecho();
        Avaliacao salva = avaliacaoRepository.save(new Avaliacao(trecho, 5, 5, 5, 5, 5, 5));

        Integer semUsuario = jdbcTemplate.queryForObject(
                "select count(*) from avaliacao where id = ? and usuario_id is null", Integer.class, salva.getId());
        assertThat(semUsuario).isEqualTo(1);
    }

    @Test
    void bancoRejeitaNotaForaDeZeroADez() {
        Trecho trecho = novoTrecho();

        assertThatThrownBy(() -> avaliacaoRepository.saveAndFlush(new Avaliacao(trecho, 11, 5, 5, 5, 5, 5)))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void trechoComAvaliacoesNaoPodeSerRemovido() {
        Trecho trecho = novoTrecho();
        avaliacaoRepository.save(new Avaliacao(trecho, 5, 5, 5, 5, 5, 5));

        assertThatThrownBy(() -> trechoRepository.deleteById(trecho.getId()))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
