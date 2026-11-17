package br.com.perimetro.entity;

import java.math.BigDecimal;
import java.math.RoundingMode;

public enum Classificacao {
    RUIM,
    MEDIO,
    BOM;

    private static final BigDecimal LIMITE_MEDIO = new BigDecimal("4.0");
    private static final BigDecimal LIMITE_BOM = new BigDecimal("7.0");

    // A faixa é decidida pelo valor exibido ao usuário (1 casa decimal, HALF_UP).
    public static Classificacao de(BigDecimal indice) {
        if (indice == null) {
            return null;
        }
        BigDecimal exibido = indice.setScale(1, RoundingMode.HALF_UP);
        if (exibido.compareTo(LIMITE_MEDIO) < 0) {
            return RUIM;
        }
        if (exibido.compareTo(LIMITE_BOM) < 0) {
            return MEDIO;
        }
        return BOM;
    }
}
