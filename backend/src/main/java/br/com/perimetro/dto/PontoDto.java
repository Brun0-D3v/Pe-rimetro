package br.com.perimetro.dto;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonProperty;

public class PontoDto {

    private final double lat;
    private final double lng;

    @JsonCreator
    public PontoDto(@JsonProperty("lat") double lat, @JsonProperty("lng") double lng) {
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
