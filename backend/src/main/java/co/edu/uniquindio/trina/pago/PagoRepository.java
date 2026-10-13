package co.edu.uniquindio.trina.pago;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/** Pagos por clave de idempotencia, referencia y pedido (RF-28/RF-29). */
public interface PagoRepository extends JpaRepository<Pago, Long> {

  Optional<Pago> findByClaveIdempotencia(String claveIdempotencia);

  Optional<Pago> findByReferencia(String referencia);

  List<Pago> findByPedido_IdOrderByIdAsc(Long pedidoId);

  /** Último pago que quedó APROBADO: es el que se reembolsa al rechazar o cancelar el pedido. */
  Optional<Pago> findFirstByPedido_IdAndEstadoOrderByIdDesc(Long pedidoId, String estado);
}
