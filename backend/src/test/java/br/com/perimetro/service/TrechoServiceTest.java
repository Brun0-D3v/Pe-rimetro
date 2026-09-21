package br.com.perimetro.service;

import br.com.perimetro.dto.PontoDto;
import br.com.perimetro.dto.TrechoRequestDto;
import br.com.perimetro.dto.TrechoResponseDto;
import br.com.perimetro.entity.AtivoInativo;
import br.com.perimetro.entity.Regiao;
import br.com.perimetro.entity.Trecho;
import br.com.perimetro.exception.RegiaoNaoEncontradaException;
import br.com.perimetro.exception.TrechoNaoEncontradoException;
import br.com.perimetro.repository.RegiaoRepository;
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

class TrechoServiceTest {

    private static final List<PontoDto> GEOMETRIA_EXEMPLO = List.of(
            new PontoDto(-23.550520, -46.633308),
            new PontoDto(-23.551200, -46.634000)
    );

    @Test
    void criaTrechoQuandoRegiaoExiste() {
        UUID regiaoId = UUID.randomUUID();
        Regiao regiao = new Regiao("Centro");
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        RegiaoRepository regiaoRepository = mock(RegiaoRepository.class);
        when(regiaoRepository.findById(regiaoId)).thenReturn(Optional.of(regiao));
        when(trechoRepository.save(any(Trecho.class))).thenAnswer(chamada -> chamada.getArgument(0));
        TrechoService service = new TrechoService(trechoRepository, regiaoRepository);

        TrechoResponseDto resultado = service.criar(new TrechoRequestDto(
                "Rua das Flores", GEOMETRIA_EXEMPLO, -23.55, -46.63, regiaoId, null));

        assertThat(resultado.getNome()).isEqualTo("Rua das Flores");
        assertThat(resultado.getStatus()).isEqualTo(AtivoInativo.ATIVO);
        assertThat(resultado.getGeometria()).hasSize(2);
    }

    @Test
    void lancaExcecaoAoCriarTrechoComRegiaoInexistente() {
        UUID regiaoId = UUID.randomUUID();
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        RegiaoRepository regiaoRepository = mock(RegiaoRepository.class);
        when(regiaoRepository.findById(regiaoId)).thenReturn(Optional.empty());
        TrechoService service = new TrechoService(trechoRepository, regiaoRepository);

        assertThatThrownBy(() -> service.criar(new TrechoRequestDto(
                "Rua das Flores", GEOMETRIA_EXEMPLO, -23.55, -46.63, regiaoId, null)))
                .isInstanceOf(RegiaoNaoEncontradaException.class);
    }

    @Test
    void listaTrechosFiltradosPorRegiao() {
        UUID regiaoId = UUID.randomUUID();
        Regiao regiao = new Regiao("Centro");
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        RegiaoRepository regiaoRepository = mock(RegiaoRepository.class);
        when(trechoRepository.findByRegiaoId(regiaoId)).thenReturn(
                List.of(new Trecho("Rua A", GEOMETRIA_EXEMPLO, -23.55, -46.63, AtivoInativo.ATIVO, regiao)));
        TrechoService service = new TrechoService(trechoRepository, regiaoRepository);

        List<TrechoResponseDto> resultado = service.listar(regiaoId);

        assertThat(resultado).hasSize(1);
        verify(trechoRepository).findByRegiaoId(regiaoId);
        verify(trechoRepository, never()).findAll();
    }

    @Test
    void listaTodosOsTrechosQuandoRegiaoNaoInformada() {
        Regiao regiao = new Regiao("Centro");
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        RegiaoRepository regiaoRepository = mock(RegiaoRepository.class);
        when(trechoRepository.findAll()).thenReturn(
                List.of(new Trecho("Rua A", GEOMETRIA_EXEMPLO, -23.55, -46.63, AtivoInativo.ATIVO, regiao)));
        TrechoService service = new TrechoService(trechoRepository, regiaoRepository);

        List<TrechoResponseDto> resultado = service.listar(null);

        assertThat(resultado).hasSize(1);
        verify(trechoRepository).findAll();
    }

    @Test
    void lancaExcecaoAoBuscarTrechoInexistente() {
        UUID id = UUID.randomUUID();
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        RegiaoRepository regiaoRepository = mock(RegiaoRepository.class);
        when(trechoRepository.findById(id)).thenReturn(Optional.empty());
        TrechoService service = new TrechoService(trechoRepository, regiaoRepository);

        assertThatThrownBy(() -> service.buscarPorId(id))
                .isInstanceOf(TrechoNaoEncontradoException.class);
    }

    @Test
    void buscaTrechoPorIdExistente() {
        UUID id = UUID.randomUUID();
        Regiao regiao = new Regiao("Centro");
        Trecho trecho = new Trecho("Rua A", GEOMETRIA_EXEMPLO, -23.55, -46.63, AtivoInativo.ATIVO, regiao);
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        RegiaoRepository regiaoRepository = mock(RegiaoRepository.class);
        when(trechoRepository.findById(id)).thenReturn(Optional.of(trecho));
        TrechoService service = new TrechoService(trechoRepository, regiaoRepository);

        TrechoResponseDto resultado = service.buscarPorId(id);

        assertThat(resultado.getNome()).isEqualTo("Rua A");
    }

    @Test
    void atualizaTrechoExistente() {
        UUID id = UUID.randomUUID();
        UUID regiaoId = UUID.randomUUID();
        Regiao regiao = new Regiao("Centro");
        Trecho trecho = new Trecho("Rua A", GEOMETRIA_EXEMPLO, -23.55, -46.63, AtivoInativo.ATIVO, regiao);
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        RegiaoRepository regiaoRepository = mock(RegiaoRepository.class);
        when(trechoRepository.findById(id)).thenReturn(Optional.of(trecho));
        when(regiaoRepository.findById(regiaoId)).thenReturn(Optional.of(regiao));
        when(trechoRepository.save(any(Trecho.class))).thenAnswer(chamada -> chamada.getArgument(0));
        TrechoService service = new TrechoService(trechoRepository, regiaoRepository);

        TrechoResponseDto resultado = service.atualizar(id, new TrechoRequestDto(
                "Rua das Flores Atualizada", GEOMETRIA_EXEMPLO, -23.56, -46.64, regiaoId, AtivoInativo.INATIVO));

        assertThat(resultado.getNome()).isEqualTo("Rua das Flores Atualizada");
        assertThat(resultado.getStatus()).isEqualTo(AtivoInativo.INATIVO);
    }

    @Test
    void lancaExcecaoAoAtualizarTrechoComRegiaoInexistente() {
        UUID id = UUID.randomUUID();
        UUID regiaoId = UUID.randomUUID();
        Regiao regiao = new Regiao("Centro");
        Trecho trecho = new Trecho("Rua A", GEOMETRIA_EXEMPLO, -23.55, -46.63, AtivoInativo.ATIVO, regiao);
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        RegiaoRepository regiaoRepository = mock(RegiaoRepository.class);
        when(trechoRepository.findById(id)).thenReturn(Optional.of(trecho));
        when(regiaoRepository.findById(regiaoId)).thenReturn(Optional.empty());
        TrechoService service = new TrechoService(trechoRepository, regiaoRepository);

        assertThatThrownBy(() -> service.atualizar(id, new TrechoRequestDto(
                "Rua das Flores", GEOMETRIA_EXEMPLO, -23.55, -46.63, regiaoId, null)))
                .isInstanceOf(RegiaoNaoEncontradaException.class);
    }

    @Test
    void lancaExcecaoAoRemoverTrechoInexistente() {
        UUID id = UUID.randomUUID();
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        RegiaoRepository regiaoRepository = mock(RegiaoRepository.class);
        when(trechoRepository.existsById(id)).thenReturn(false);
        TrechoService service = new TrechoService(trechoRepository, regiaoRepository);

        assertThatThrownBy(() -> service.deletar(id))
                .isInstanceOf(TrechoNaoEncontradoException.class);
    }

    @Test
    void removeTrechoExistente() {
        UUID id = UUID.randomUUID();
        TrechoRepository trechoRepository = mock(TrechoRepository.class);
        RegiaoRepository regiaoRepository = mock(RegiaoRepository.class);
        when(trechoRepository.existsById(id)).thenReturn(true);
        TrechoService service = new TrechoService(trechoRepository, regiaoRepository);

        service.deletar(id);

        verify(trechoRepository).deleteById(id);
    }
}
