package br.com.perimetro.repository;

import br.com.perimetro.entity.SystemHealth;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SystemHealthRepository extends JpaRepository<SystemHealth, Long> {
}
