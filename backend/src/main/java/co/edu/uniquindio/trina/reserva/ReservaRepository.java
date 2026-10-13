package co.edu.uniquindio.trina.reserva;

import co.edu.uniquindio.trina.negocio.Negocio;
import jakarta.persistence.LockModeType;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

/**
 * Reservas por rol (RF-31) y consultas de capacidad (RN-07). {@link #bloquearNegocio} toma el
 * lock pesimista de la fila del negocio para serializar la creación de reservas superpuestas.
 */
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

  List<Reserva> findByCliente_IdOrderByCreadoEnDesc(Long clienteId);

  List<Reserva> findByCliente_IdAndEstadoOrderByCreadoEnDesc(Long clienteId, String estado);

  List<Reserva> findByNegocio_Propietario_IdOrderByCreadoEnDesc(Long propietarioId);

  List<Reserva> findByNegocio_Propietario_IdAndEstadoOrderByCreadoEnDesc(
      Long propietarioId, String estado);

  List<Reserva> findAllByOrderByCreadoEnDesc();

  List<Reserva> findByEstadoOrderByCreadoEnDesc(String estado);

  /** RF-26 E5: reservas pendientes creadas antes del límite para cancelarlas. */
  List<Reserva> findByEstadoAndCreadoEnBefore(String estado, Instant limite);

  /** RF-26: bloquea la fila del negocio mientras se cuenta el cupo y se crea la reserva. */
  @Lock(LockModeType.PESSIMISTIC_WRITE)
  @Query("select n from Negocio n where n.id = :negocioId")
  Optional<Negocio> bloquearNegocio(Long negocioId);

  /**
   * RN-07: reservas activas (PENDIENTE_CONFIRMACION o CONFIRMADA) que se superponen con
   * [inicio, fin). Un intervalo [a, b) se superpone con [c, d) si a < d y b > c.
   */
  @Query(
      """
      select count(r) from Reserva r
      where r.negocio.id = :negocioId
        and r.estado in ('PENDIENTE_CONFIRMACION', 'CONFIRMADA')
        and r.inicio < :fin and r.fin > :inicio
      """)
  long contarSuperpuestasActivas(Long negocioId, Instant inicio, Instant fin);

  /** Misma superposición que {@link #contarSuperpuestasActivas}, pero devuelve las reservas. */
  @Query(
      """
      select r from Reserva r
      where r.negocio.id = :negocioId
        and r.estado in ('PENDIENTE_CONFIRMACION', 'CONFIRMADA')
        and r.inicio < :fin and r.fin > :inicio
      """)
  List<Reserva> findSuperpuestasActivas(Long negocioId, Instant inicio, Instant fin);
}
