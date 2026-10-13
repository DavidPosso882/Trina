package co.edu.uniquindio.trina.pedido;

import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Pedidos por rol (RF-31): el Cliente ve los propios, el Comerciante los de su negocio (el negocio
 * tiene un único propietario, V1) y el Administrador todos. El filtro por estado es opcional.
 */
public interface PedidoRepository extends JpaRepository<Pedido, Long> {

  List<Pedido> findByCliente_IdOrderByCreadoEnDesc(Long clienteId);

  List<Pedido> findByCliente_IdAndEstadoOrderByCreadoEnDesc(Long clienteId, String estado);

  List<Pedido> findByNegocio_Propietario_IdOrderByCreadoEnDesc(Long propietarioId);

  List<Pedido> findByNegocio_Propietario_IdAndEstadoOrderByCreadoEnDesc(
      Long propietarioId, String estado);

  List<Pedido> findAllByOrderByCreadoEnDesc();

  List<Pedido> findByEstadoOrderByCreadoEnDesc(String estado);

  /** RF-28 E5: pedidos PENDIENTE_PAGO creados antes del límite para cancelarlos. */
  List<Pedido> findByEstadoAndCreadoEnBefore(String estado, Instant limite);
}
