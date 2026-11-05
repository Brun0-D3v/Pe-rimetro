package br.com.perimetro.service;

import br.com.perimetro.dto.AvaliacaoRequestDto;
import br.com.perimetro.dto.AvaliacaoResponseDto;
import br.com.perimetro.dto.PontoDto;
import br.com.perimetro.entity.AtivoInativo;
import br.com.perimetro.entity.Avaliacao;
import br.com.perimetro.entity.Classificacao;
import br.com.perimetro.entity.Regiao;
import br.com.perimetro.entity.Trecho;
import br.com.perimetro.exception.TrechoInativoException;
import br.com.perimetro.exception.TrechoNaoEncontradoException;
import br.com.perimetro.repository.AvaliacaoRepository;
import br.com.perimetro.repository.AvaliacaoRepository.MediasPorDimensao;
import br.com.perimetro.repository.TrechoRepository;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AvaliacaoServiceTest {

    private static final List<PontoDto> GEOMETRIA = List.of(new PontoDto(-8.06, -34.87));

    private static Trecho trecho(AtivoInativo status) {
        return new Trecho("Rua da Aurora", GEOMETRIA, -8.06, -34.87, status, new Regiao("Centro"));
    }

    private static AvaliacaoRequestDto notas(int valor) {
        return new AvaliacaoRequestDto(valor, valor, valor, valor, valor, valor);
    }

    @Test
    void lancaExcecaoQuandoOTrechoNaoExiste() {
        UUID trechoId = UUID.randomUUID();
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        AvaliacaoRepository avaliacaoRepository = mock(AvaliacaoRepository.class);
        when(trechoRepository.buscarParaAtualizacao(trechoId)).thenReturn(Optional.empty());
        AvaliacaoService service = new AvaliacaoService(avaliacaoRepository, trechoRepository);

        assertThatThrownBy(() -> service.criar(trechoId, notas(5), UUID.randomUUID()))
                .isInstanceOf(TrechoNaoEncontradoException.class);
    }

    @Test
    void recusaAvaliarTrechoInativo() {
        UUID trechoId = UUID.randomUUID();
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        AvaliacaoRepository avaliacaoRepository = mock(AvaliacaoRepository.class);
        when(trechoRepository.buscarParaAtualizacao(trechoId)).thenReturn(Optional.of(trecho(AtivoInativo.INATIVO)));
        AvaliacaoService service = new AvaliacaoService(avaliacaoRepository, trechoRepository);

        assertThatThrownBy(() -> service.criar(trechoId, notas(5), UUID.randomUUID()))
                .isInstanceOf(TrechoInativoException.class);
        verify(avaliacaoRepository, never()).save(any());
    }

    @Test
    void gravaAAvaliacaoERecalculaOIndiceDoTrecho() {
        UUID trechoId = UUID.randomUUID();
        Trecho trecho = trecho(AtivoInativo.ATIVO);
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        AvaliacaoRepository avaliacaoRepository = mock(AvaliacaoRepository.class);
        MediasPorDimensao medias = mock(MediasPorDimensao.class);
        when(medias.getCalcada()).thenReturn(8.0);
        when(medias.getAcessibilidade()).thenReturn(6.0);
        when(medias.getIluminacao()).thenReturn(4.0);
        when(medias.getArborizacao()).thenReturn(2.0);
        when(medias.getTravessias()).thenReturn(0.0);
        when(medias.getMobiliario()).thenReturn(10.0);
        when(trechoRepository.buscarParaAtualizacao(trechoId)).thenReturn(Optional.of(trecho));
        when(avaliacaoRepository.save(any(Avaliacao.class))).thenAnswer(chamada -> chamada.getArgument(0));
        when(avaliacaoRepository.mediasPorDimensao(trechoId)).thenReturn(medias);
        when(avaliacaoRepository.countByTrechoId(trechoId)).thenReturn(3L);
        AvaliacaoService service = new AvaliacaoService(avaliacaoRepository, trechoRepository);

        AvaliacaoResponseDto resposta = service.criar(trechoId, notas(5), UUID.randomUUID());

        assertThat(resposta.getTrecho().getIndiceAtual()).isEqualByComparingTo("5.40");
        assertThat(resposta.getTrecho().getTotalAvaliacoes()).isEqualTo(3);
        assertThat(resposta.getTrecho().getClassificacao()).isEqualTo(Classificacao.MEDIO);
        assertThat(resposta.getNotaCalcada()).isEqualTo(5);
        verify(trechoRepository).save(trecho);
    }
}
