package co.edu.uniquindio.trina.membresia;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MembresiaPlanRepository extends JpaRepository<MembresiaPlan, Long> {

  /** RF-33: catálogo público de planes vigentes (Básica primero por precio). */
  List<MembresiaPlan> findByActivoTrueOrderByPrecioMensualCopAsc();

  Optional<MembresiaPlan> findByCodigo(String codigo);
}
