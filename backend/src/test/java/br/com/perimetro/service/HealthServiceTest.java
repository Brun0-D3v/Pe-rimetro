package br.com.perimetro.service;

import br.com.perimetro.dto.HealthResponseDto;
import br.com.perimetro.repository.SystemHealthRepository;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class HealthServiceTest {

    @Test
    void retornaBancoUpQuandoRepositorioResponde() {
        SystemHealthRepository repository = mock(SystemHealthRepository.class);
        when(repository.count()).thenReturn(1L);
        HealthService service = new HealthService(repository);

        HealthResponseDto resultado = service.verificarStatus();

        assertThat(resultado.getStatus()).isEqualTo("UP");
        assertThat(resultado.getBanco()).isEqualTo("UP");
    }

    @Test
    void retornaBancoDownQuandoRepositorioFalha() {
        SystemHealthRepository repository = mock(SystemHealthRepository.class);
        when(repository.count()).thenThrow(new RuntimeException("conexao recusada"));
        HealthService service = new HealthService(repository);

        HealthResponseDto resultado = service.verificarStatus();

        assertThat(resultado.getStatus()).isEqualTo("UP");
        assertThat(resultado.getBanco()).isEqualTo("DOWN");
    }
}
