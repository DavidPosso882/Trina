package co.edu.uniquindio.trina.membresia;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface MembresiaSuscripcionRepository extends JpaRepository<MembresiaSuscripcion, Long> {

  /** RN-05: suscripción ACTIVA con fin futuro más lejana del negocio (plan efectivo DESTACADA). */
  Optional<MembresiaSuscripcion> findFirstByNegocio_IdAndEstadoAndFinAfterOrderByFinDesc(
      Long negocioId, String estado, Instant momento);

  /** RF-34: el pendiente vigente se reutiliza si el comerciante vuelve a solicitar. */
  Optional<MembresiaSuscripcion> findFirstByNegocio_IdAndEstadoOrderByIdDesc(
      Long negocioId, String estado);

  /** RF-35 E1: última suscripción del negocio, sin importar su estado. */
  Optional<MembresiaSuscripcion> findFirstByNegocio_IdOrderByIdDesc(Long negocioId);

  /** Barrido horario: ACTIVA con fin anterior al límite. */
  List<MembresiaSuscripcion> findByEstadoAndFinBefore(String estado, Instant limite);

  /** RF-37: ids de negocios con DESTACADA vigente; una sola query para armar la insignia. */
  @Query(
      """
      select s.negocio.id from MembresiaSuscripcion s
      where s.estado = 'ACTIVA' and s.fin > :momento and s.plan.codigo = 'DESTACADA'
      """)
  List<Long> idsDestacadosVigentes(Instant momento);
}
