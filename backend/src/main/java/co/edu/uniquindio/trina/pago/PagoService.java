package co.edu.uniquindio.trina.pago;

import co.edu.uniquindio.trina.admin.AuditoriaService;
import co.edu.uniquindio.trina.membresia.MembresiaSuscripcion;
import co.edu.uniquindio.trina.membresia.MembresiaSuscripcionRepository;
import co.edu.uniquindio.trina.pedido.Pedido;
import co.edu.uniquindio.trina.pedido.PedidoRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Pago simulado con idempotencia y comisión (RF-28/RF-29). El gateway vive tras
 * {@link PagoPorts.PaymentGatewayPort} (D-08) y el reembolso se dispara desde las transiciones de
 * pedido (RF-27). La notificación de pago queda para el slice de notificaciones.
 */
@Service
public class PagoService {

  // TODO: leer `comision_pct` de parametro_sistema cuando exista la entidad de parámetros (RF-29 E2).
  static final BigDecimal COMISION_PCT = new BigDecimal("5");
  // TODO: leer `pedido_expira_min` de parametro_sistema cuando exista la entidad de parámetros.
  static final int EXPIRA_MIN = 30;

  private static final String ADMINISTRADOR = "ADMINISTRADOR";
  private static final String CLIENTE = "CLIENTE";
  private static final String COMERCIANTE = "COMERCIANTE";

  private final PagoRepository pagos;
  private final PedidoRepository pedidos;
  private final MembresiaSuscripcionRepository suscripciones;
  private final PagoPorts.PaymentGatewayPort gateway;
  private final AuditoriaService auditoria;

  public PagoService(
      PagoRepository pagos,
      PedidoRepository pedidos,
      MembresiaSuscripcionRepository suscripciones,
      PagoPorts.PaymentGatewayPort gateway,
      AuditoriaService auditoria) {
    this.pagos = pagos;
    this.pedidos = pedidos;
    this.suscripciones = suscripciones;
    this.gateway = gateway;
    this.auditoria = auditoria;
  }

  /**
   * RF-28/RF-34: cobra con clave de idempotencia; el destino es un pedido o la suscripción
   * Destacada del Comerciante. La misma clave devuelve el pago original sin volver a cobrar.
   */
  @Transactional
  public PagoDto.CobroRespuesta cobrar(
      Long usuarioId, PagoDto.CobroRequest req, String claveIdempotencia) {
    String clave = limpiarClave(claveIdempotencia);
    if (req.pedidoId() != null && req.suscripcionId() != null) {
      throw new IllegalArgumentException("Elegí un solo destino para el pago.");
    }
    if (req.suscripcionId() != null) {
      return cobrarSuscripcion(usuarioId, req.suscripcionId(), req.tarjeta(), clave);
    }
    if (req.pedidoId() == null) {
      throw new IllegalArgumentException("Indicá el pedido o la suscripción que querés pagar.");
    }
    return cobrarPedido(usuarioId, req.pedidoId(), req.tarjeta(), clave);
  }

  /**
   * RF-28: un pago aprobado pasa el pedido a PENDIENTE y registra la comisión RN-06; un rechazo
   * deja el pedido PENDIENTE_PAGO para reintentar.
   */
  private PagoDto.CobroRespuesta cobrarPedido(
      Long clienteId, Long pedidoId, String tarjeta, String clave) {
    var pedido =
        pedidos
            .findById(pedidoId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ese pedido no existe."));
    if (!pedido.getCliente().getId().equals(clienteId)) {
      throw new AccessDeniedException("Ese pedido no es tuyo.");
    }
    var existente = pagos.findByClaveIdempotencia(clave);
    if (existente.isPresent()) {
      return repetido(existente.get(), pedido);
    }
    if (!Pedido.PENDIENTE_PAGO.equals(pedido.getEstado())) {
      throw new IllegalStateException("Ese pedido no está esperando pago.");
    }

    var pago = pagos.save(Pago.iniciar(pedido, tarjeta, clave));
    var resultado = gateway.cobrar(new PagoPorts.SolicitudCobro(pedido.getTotalCop(), tarjeta, clave));
    if (resultado.aprobado()) {
      int[] comisionYNeto = PagoPorts.comisionYNeto(pedido.getTotalCop(), COMISION_PCT);
      pago.aprobar(resultado.referencia(), comisionYNeto[0]);
      pedido.pagar();
      pedidos.save(pedido);
    } else {
      pago.rechazar();
    }
    pagos.save(pago);
    return PagoDto.CobroRespuesta.de(pago, resultado.motivo());
  }

  /**
   * RF-34/RF-36: cobra el plan Destacada del negocio propio. Al aprobarse, activa la suscripción
   * respetando la ventana planificada (activarAlCobrar) y deja la auditoría de la activación. Si
   * se rechaza, la suscripción queda PENDIENTE_PAGO y el plan efectivo sigue siendo BASICA.
   */
  private PagoDto.CobroRespuesta cobrarSuscripcion(
      Long comercianteId, Long suscripcionId, String tarjeta, String clave) {
    var suscripcion =
        suscripciones
            .findById(suscripcionId)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Esa suscripción no existe."));
    if (!suscripcion.getNegocio().getPropietario().getId().equals(comercianteId)) {
      throw new AccessDeniedException("Esa suscripción no es tuya.");
    }
    var existente = pagos.findByClaveIdempotencia(clave);
    if (existente.isPresent()) {
      return repetidoSuscripcion(existente.get(), suscripcionId);
    }
    if (!MembresiaSuscripcion.PENDIENTE_PAGO.equals(suscripcion.getEstado())) {
      throw new IllegalStateException("Esa suscripción no está esperando pago.");
    }
    int monto = suscripcion.getPlan().getPrecioMensualCop();
    if (monto <= 0) {
      throw new IllegalStateException("Ese plan no requiere pago.");
    }

    var pago = pagos.save(Pago.iniciarSuscripcion(suscripcionId, monto, tarjeta, clave));
    var resultado = gateway.cobrar(new PagoPorts.SolicitudCobro(monto, tarjeta, clave));
    if (resultado.aprobado()) {
      pago.aprobar(resultado.referencia(), 0);
      suscripcion.activarAlCobrar(Instant.now());
      suscripciones.save(suscripcion);
      auditoria.registrar(
          comercianteId,
          "ACTIVAR_SUSCRIPCION",
          "MEMBRESIA_SUSCRIPCION",
          suscripcion.getId(),
          "Pago " + pago.getId() + " aprobado",
          null);
    } else {
      pago.rechazar();
    }
    pagos.save(pago);
    return PagoDto.CobroRespuesta.de(pago, resultado.motivo());
  }

  /** RF-31: el pago lo ven el Cliente dueño, el Comerciante del negocio o el Administrador. */
  @Transactional(readOnly = true)
  public PagoDto.PagoRespuesta detalle(Long usuarioId, String rol, Long pagoId) {
    var pago =
        pagos
            .findById(pagoId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ese pago no existe."));
    if (!puedeVer(usuarioId, rol, pago)) {
      throw new AccessDeniedException("Ese pago no es tuyo.");
    }
    return PagoDto.PagoRespuesta.de(pago);
  }

  /**
   * §5.1 / RF-27 E2: si el pedido tiene un pago APROBADO, lo reembolsa y revierte la comisión. Sin
   * pago aprobado no hace nada (pedidos EN_LOCAL o PENDIENTE_PAGO).
   */
  @Transactional
  public void reembolsarPedido(Long pedidoId) {
    pagos
        .findFirstByPedido_IdAndEstadoOrderByIdDesc(pedidoId, Pago.APROBADO)
        .ifPresent(
            pago -> {
              if (!gateway.reembolsar(pago.getReferencia())) {
                throw new IllegalStateException("No se pudo reembolsar el pago.");
              }
              pago.reembolsar();
              pagos.save(pago);
            });
  }

  /** RF-28 E5: cada 5 minutos cancela los pedidos PENDIENTE_PAGO con más de 30 minutos. */
  @Scheduled(fixedDelay = 300_000, initialDelay = 300_000)
  @Transactional
  public void cancelarPendientesVencidos() {
    var limite = Instant.now().minus(EXPIRA_MIN, ChronoUnit.MINUTES);
    for (var pedido : pedidos.findByEstadoAndCreadoEnBefore(Pedido.PENDIENTE_PAGO, limite)) {
      pedido.expirarPago();
    }
  }

  private PagoDto.CobroRespuesta repetido(Pago pago, Pedido pedido) {
    if (pago.getPedido() == null || !pago.getPedido().getId().equals(pedido.getId())) {
      throw new IllegalArgumentException("Esa clave de idempotencia ya se usó en otro pago.");
    }
    String motivo =
        Pago.RECHAZADO.equals(pago.getEstado()) ? "Ese intento de pago ya quedó rechazado." : null;
    return PagoDto.CobroRespuesta.de(pago, motivo);
  }

  private PagoDto.CobroRespuesta repetidoSuscripcion(Pago pago, Long suscripcionId) {
    if (!suscripcionId.equals(pago.getSuscripcionId())) {
      throw new IllegalArgumentException("Esa clave de idempotencia ya se usó en otro pago.");
    }
    String motivo =
        Pago.RECHAZADO.equals(pago.getEstado()) ? "Ese intento de pago ya quedó rechazado." : null;
    return PagoDto.CobroRespuesta.de(pago, motivo);
  }

  private static boolean puedeVer(Long usuarioId, String rol, Pago pago) {
    if (ADMINISTRADOR.equals(rol)) {
      return true;
    }
    if (pago.getPedido() == null) {
      return false;
    }
    return switch (rol) {
      case CLIENTE -> pago.getPedido().getCliente().getId().equals(usuarioId);
      case COMERCIANTE ->
          pago.getPedido().getNegocio().getPropietario().getId().equals(usuarioId);
      default -> false;
    };
  }

  private static String limpiarClave(String clave) {
    if (clave == null || clave.isBlank()) {
      throw new IllegalArgumentException("Falta la clave de idempotencia.");
    }
    return clave.trim();
  }
}
