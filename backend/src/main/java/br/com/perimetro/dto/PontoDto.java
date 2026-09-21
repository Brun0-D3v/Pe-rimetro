package br.com.perimetro.dto;

public class PontoDto {

    private final double lat;
    private final double lng;

    public PontoDto(double lat, double lng) {
        this.lat = lat;
        this.lng = lng;
    }

    public double getLat() {
        return lat;
    }

    public double getLng() {
        return lng;
    }
}
