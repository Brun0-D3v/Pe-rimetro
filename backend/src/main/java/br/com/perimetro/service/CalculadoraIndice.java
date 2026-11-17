package br.com.perimetro.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

// Única fonte dos pesos das 6 dimensões do Índice de Caminhabilidade.
public final class CalculadoraIndice {

    public static final BigDecimal PESO_CALCADA = new BigDecimal("0.25");
    public static final BigDecimal PESO_ACESSIBILIDADE = new BigDecimal("0.25");
    public static final BigDecimal PESO_ILUMINACAO = new BigDecimal("0.15");
    public static final BigDecimal PESO_ARBORIZACAO = new BigDecimal("0.15");
    public static final BigDecimal PESO_TRAVESSIAS = new BigDecimal("0.10");
    public static final BigDecimal PESO_MOBILIARIO = new BigDecimal("0.10");

    private CalculadoraIndice() {
    }

    // Recebe notas (ou médias de notas) de 0 a 10 e devolve o índice com 2 casas decimais.
    public static BigDecimal indice(double calcada, double acessibilidade, double iluminacao,
                                    double arborizacao, double travessias, double mobiliario) {
        return parcela(calcada, PESO_CALCADA)
                .add(parcela(acessibilidade, PESO_ACESSIBILIDADE))
                .add(parcela(iluminacao, PESO_ILUMINACAO))
                .add(parcela(arborizacao, PESO_ARBORIZACAO))
                .add(parcela(travessias, PESO_TRAVESSIAS))
                .add(parcela(mobiliario, PESO_MOBILIARIO))
                .setScale(2, RoundingMode.HALF_UP);
    }

    private static BigDecimal parcela(double nota, BigDecimal peso) {
        return BigDecimal.valueOf(nota).multiply(peso);
    }
}
