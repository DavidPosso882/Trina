package co.edu.uniquindio.trina.negocio;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NegocioRepository extends JpaRepository<Negocio, Long> {
  List<Negocio> findByEstado(String estado);

  List<Negocio> findByEstadoAndCategoriaId(String estado, Long categoriaId);

  boolean existsByPropietario_Id(Long propietarioId);

  /** Consulta de publicación para el catálogo público (RF-17): solo negocios APROBADO. */
  Optional<Negocio> findByIdAndEstado(Long id, String estado);
}
