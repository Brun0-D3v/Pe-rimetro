package br.com.perimetro.validation;

import br.com.perimetro.dto.PontoDto;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.within;

class GeometriaTrechoTest {

    private static final PontoDto A = new PontoDto(-8.0631, -34.8711);
    private static final PontoDto B = new PontoDto(-8.0640, -34.8720);

    @Test
    void doisPontosComCentenasDeMetrosSaoValidos() {
        assertThat(GeometriaTrecho.motivoDaInvalidez(List.of(A, B))).isNull();
    }

    @Test
    void umSoPontoEInvalido() {
        assertThat(GeometriaTrecho.motivoDaInvalidez(List.of(A))).isEqualTo("deve ter entre 2 e 200 pontos");
    }

    @Test
    void listaVaziaEInvalida() {
        assertThat(GeometriaTrecho.motivoDaInvalidez(List.of())).isEqualTo("deve ter entre 2 e 200 pontos");
    }

    @Test
    void maisDeDuzentosPontosEInvalido() {
        List<PontoDto> pontos = new ArrayList<>();
        for (int i = 0; i < 201; i++) {
            pontos.add(new PontoDto(-8.06 + i * 0.00001, -34.87));
        }
        assertThat(GeometriaTrecho.motivoDaInvalidez(pontos)).isEqualTo("deve ter entre 2 e 200 pontos");
    }

    @Test
    void latitudeForaDaFaixaEInvalida() {
        assertThat(GeometriaTrecho.motivoDaInvalidez(List.of(new PontoDto(91, 0), new PontoDto(0, 0))))
                .isEqualTo("contém coordenada inválida");
    }

    @Test
    void longitudeForaDaFaixaEInvalida() {
        assertThat(GeometriaTrecho.motivoDaInvalidez(List.of(new PontoDto(0, 181), new PontoDto(0, 0))))
                .isEqualTo("contém coordenada inválida");
    }

    @Test
    void coordenadaNaoNumericaEInvalida() {
        assertThat(GeometriaTrecho.motivoDaInvalidez(List.of(new PontoDto(Double.NaN, 0), new PontoDto(0, 0))))
                .isEqualTo("contém coordenada inválida");
    }

    @Test
    void pontosIguaisFormamUmTrechoCurtoDemais() {
        assertThat(GeometriaTrecho.motivoDaInvalidez(List.of(A, A))).isEqualTo("é curta demais (mínimo 5 m)");
    }

    @Test
    void maisDeCincoQuilometrosEInvalido() {
        // 0,06 grau de latitude = cerca de 6,7 km
        List<PontoDto> pontos = List.of(new PontoDto(-8.00, -34.87), new PontoDto(-8.06, -34.87));
        assertThat(GeometriaTrecho.motivoDaInvalidez(pontos)).isEqualTo("é longa demais (máximo 5000 m)");
    }

    @Test
    void calculaOComprimentoSomandoOsSegmentos() {
        // 0,01 grau de latitude = cerca de 1111,95 m; dois segmentos = cerca de 2223,9 m
        List<PontoDto> pontos = List.of(new PontoDto(-8.00, -34.87), new PontoDto(-8.01, -34.87), new PontoDto(-8.02, -34.87));
        assertThat(GeometriaTrecho.comprimentoMetros(pontos)).isCloseTo(2223.9, within(0.5));
    }
}
