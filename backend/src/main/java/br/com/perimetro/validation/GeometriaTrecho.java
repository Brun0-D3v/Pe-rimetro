package br.com.perimetro.validation;

import br.com.perimetro.dto.PontoDto;

import java.util.List;

// Única fonte dos limites da geometria de um trecho. O frontend espelha estes valores
// em config/trechoConfig.js apenas para responder mais rápido; quem decide é o backend.
public final class GeometriaTrecho {

    public static final int MIN_PONTOS = 2;
    public static final int MAX_PONTOS = 200;
    public static final double COMPRIMENTO_MIN_METROS = 5;
    public static final double COMPRIMENTO_MAX_METROS = 5000;

    private static final double RAIO_TERRA_METROS = 6_371_000;

    private GeometriaTrecho() {
    }

    // Devolve o motivo (texto curto, em português) ou null quando a geometria é válida.
    public static String motivoDaInvalidez(List<PontoDto> pontos) {
        if (pontos == null || pontos.size() < MIN_PONTOS || pontos.size() > MAX_PONTOS) {
            return "deve ter entre " + MIN_PONTOS + " e " + MAX_PONTOS + " pontos";
        }
        for (PontoDto ponto : pontos) {
            if (ponto == null || !latitudeValida(ponto.getLat()) || !longitudeValida(ponto.getLng())) {
                return "contém coordenada inválida";
            }
        }
        double comprimento = comprimentoMetros(pontos);
        if (comprimento < COMPRIMENTO_MIN_METROS) {
            return "é curta demais (mínimo " + (int) COMPRIMENTO_MIN_METROS + " m)";
        }
        if (comprimento > COMPRIMENTO_MAX_METROS) {
            return "é longa demais (máximo " + (int) COMPRIMENTO_MAX_METROS + " m)";
        }
        return null;
    }

    public static double comprimentoMetros(List<PontoDto> pontos) {
        double total = 0;
        for (int i = 1; i < pontos.size(); i++) {
            total += distanciaMetros(pontos.get(i - 1), pontos.get(i));
        }
        return total;
    }

    // Distância aproximada (haversine) entre dois pontos, em metros.
    public static double distanciaMetros(PontoDto a, PontoDto b) {
        double dLat = Math.toRadians(b.getLat() - a.getLat());
        double dLng = Math.toRadians(b.getLng() - a.getLng());
        double h = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(a.getLat())) * Math.cos(Math.toRadians(b.getLat()))
                * Math.pow(Math.sin(dLng / 2), 2);
        return 2 * RAIO_TERRA_METROS * Math.asin(Math.sqrt(h));
    }

    // Escrito como "está dentro da faixa" para que NaN também seja rejeitado.
    private static boolean latitudeValida(double lat) {
        return lat >= -90 && lat <= 90;
    }

    private static boolean longitudeValida(double lng) {
        return lng >= -180 && lng <= 180;
    }
}
