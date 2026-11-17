package br.com.perimetro.repository;

import br.com.perimetro.entity.Foto;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface FotoRepository extends JpaRepository<Foto, UUID> {

    List<Foto> findByOcorrenciaIdIn(Collection<UUID> ocorrenciaIds);

    List<Foto> findByOcorrenciaId(UUID ocorrenciaId);

    long countByOcorrenciaId(UUID ocorrenciaId);
}
