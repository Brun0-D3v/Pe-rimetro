package br.com.perimetro.service;

import br.com.perimetro.dto.RegiaoRequestDto;
import br.com.perimetro.dto.RegiaoResponseDto;
import br.com.perimetro.entity.Regiao;
import br.com.perimetro.exception.RegiaoNaoEncontradaException;
import br.com.perimetro.repository.RegiaoRepository;
import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class RegiaoServiceTest {

    @Test
    void criaRegiaoComNomeInformado() {
        RegiaoRepository repository = mock(RegiaoRepository.class);
        when(repository.save(any(Regiao.class))).thenAnswer(chamada -> chamada.getArgument(0));
        RegiaoService service = new RegiaoService(repository);

        RegiaoResponseDto resultado = service.criar(new RegiaoRequestDto("Centro"));

        assertThat(resultado.getNome()).isEqualTo("Centro");
    }

    @Test
    void listaTodasAsRegioesCadastradas() {
        RegiaoRepository repository = mock(RegiaoRepository.class);
        when(repository.findAll()).thenReturn(List.of(new Regiao("Centro"), new Regiao("Zona Norte")));
        RegiaoService service = new RegiaoService(repository);

        List<RegiaoResponseDto> resultado = service.listar();

        assertThat(resultado).hasSize(2);
    }

    @Test
    void buscaRegiaoPorIdExistente() {
        UUID id = UUID.randomUUID();
        RegiaoRepository repository = mock(RegiaoRepository.class);
        when(repository.findById(id)).thenReturn(Optional.of(new Regiao("Centro")));
        RegiaoService service = new RegiaoService(repository);

        RegiaoResponseDto resultado = service.buscarPorId(id);

        assertThat(resultado.getNome()).isEqualTo("Centro");
    }

    @Test
    void lancaExcecaoAoBuscarRegiaoInexistente() {
        UUID id = UUID.randomUUID();
        RegiaoRepository repository = mock(RegiaoRepository.class);
        when(repository.findById(id)).thenReturn(Optional.empty());
        RegiaoService service = new RegiaoService(repository);

        assertThatThrownBy(() -> service.buscarPorId(id))
                .isInstanceOf(RegiaoNaoEncontradaException.class);
    }

    @Test
    void atualizaNomeDeRegiaoExistente() {
        UUID id = UUID.randomUUID();
        RegiaoRepository repository = mock(RegiaoRepository.class);
        when(repository.findById(id)).thenReturn(Optional.of(new Regiao("Centro")));
        when(repository.save(any(Regiao.class))).thenAnswer(chamada -> chamada.getArgument(0));
        RegiaoService service = new RegiaoService(repository);

        RegiaoResponseDto resultado = service.atualizar(id, new RegiaoRequestDto("Centro Histórico"));

        assertThat(resultado.getNome()).isEqualTo("Centro Histórico");
    }

    @Test
    void removeRegiaoExistente() {
        UUID id = UUID.randomUUID();
        RegiaoRepository repository = mock(RegiaoRepository.class);
        when(repository.existsById(id)).thenReturn(true);
        RegiaoService service = new RegiaoService(repository);

        service.deletar(id);

        verify(repository).deleteById(id);
    }

    @Test
    void lancaExcecaoAoRemoverRegiaoInexistente() {
        UUID id = UUID.randomUUID();
        RegiaoRepository repository = mock(RegiaoRepository.class);
        when(repository.existsById(id)).thenReturn(false);
        RegiaoService service = new RegiaoService(repository);

        assertThatThrownBy(() -> service.deletar(id))
                .isInstanceOf(RegiaoNaoEncontradaException.class);
    }

    @Test
    void propagaConflitoAoRemoverRegiaoComTrechosVinculados() {
        UUID id = UUID.randomUUID();
        RegiaoRepository repository = mock(RegiaoRepository.class);
        when(repository.existsById(id)).thenReturn(true);
        doThrow(new DataIntegrityViolationException("violacao de FK")).when(repository).deleteById(id);
        RegiaoService service = new RegiaoService(repository);

        assertThatThrownBy(() -> service.deletar(id))
                .isInstanceOf(DataIntegrityViolationException.class);
    }
}
