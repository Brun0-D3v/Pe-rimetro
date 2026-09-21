package br.com.perimetro.repository;

import br.com.perimetro.entity.Regiao;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface RegiaoRepository extends JpaRepository<Regiao, UUID> {
}
