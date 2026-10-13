package co.edu.uniquindio.trina.resena;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Reseñas por negocio, autor y cola de moderación (RF-38/RF-39). */
public interface ResenaRepository extends JpaRepository<Resena, Long> {

  /** RF-38 E3: una sola reseña por par negocio+cliente (UNIQUE de V13). */
  Optional<Resena> findByNegocio_IdAndCliente_Id(Long negocioId, Long clienteId);

  /** RF-38/RN-08: listado público y promedio solo con las visibles. */
  List<Resena> findByNegocio_IdAndVisibleTrueOrderByCreadoEnDesc(Long negocioId);

  /** RF-39: cola de reportadas del Administrador. */
  List<Resena> findByReportadaTrueOrderByCreadoEnDesc();

  /** RF-39: moderación completa, incluidas las ocultas. */
  List<Resena> findAllByOrderByCreadoEnDesc();
}
