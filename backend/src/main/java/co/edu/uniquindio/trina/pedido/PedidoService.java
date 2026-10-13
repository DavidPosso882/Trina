package co.edu.uniquindio.trina.pedido;

import co.edu.uniquindio.trina.catalogo.CatalogoItemRepository;
import co.edu.uniquindio.trina.negocio.HorarioService;
import co.edu.uniquindio.trina.negocio.NegocioRepository;
import co.edu.uniquindio.trina.notificacion.NotificacionService;
import co.edu.uniquindio.trina.pago.PagoService;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Pedidos para recoger (RF-25, RF-27, RF-31). Reglas de creación: negocio APROBADO que acepte
 * pedidos y esté abierto ahora (solo si configuró horarios), un solo negocio, ítems activos y
 * disponibles, carrito no vacío. Rechazar o cancelar un pedido con pago aprobado dispara el
 * reembolso simulado (RF-27 E2, RF-28/29).
 */
@Service
public class PedidoService {

  private static final String APROBADO = "APROBADO";
  private static final String CLIENTE = "CLIENTE";
  private static final String COMERCIANTE = "COMERCIANTE";
  private static final String ADMINISTRADOR = "ADMINISTRADOR";

  private final PedidoRepository pedidos;
  private final NegocioRepository negocios;
  private final CatalogoItemRepository items;
  private final UsuarioRepository usuarios;
  private final PagoService pagos;
  private final NotificacionService notificaciones;
  private final HorarioService horarios;

  public PedidoService(
      PedidoRepository pedidos,
      NegocioRepository negocios,
      CatalogoItemRepository items,
      UsuarioRepository usuarios,
      PagoService pagos,
      NotificacionService notificaciones,
      HorarioService horarios) {
    this.pedidos = pedidos;
    this.negocios = negocios;
    this.items = items;
    this.usuarios = usuarios;
    this.pagos = pagos;
    this.notificaciones = notificaciones;
    this.horarios = horarios;
  }

  /** RF-25: crea el pedido copiando precios vigentes y notifica al comerciante cuando queda PENDIENTE. */
  @Transactional
  public PedidoDto.PedidoRespuesta crear(Long clienteId, PedidoDto.CrearPedidoRequest req) {
    var cliente =
        usuarios
            .findById(clienteId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Iniciá sesión."));
    var negocio =
        negocios
            .findByIdAndEstado(req.negocioId(), APROBADO)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Negocio no publicado."));
    if (!negocio.isAceptaPedidos()) {
      throw new IllegalArgumentException("Ese negocio no está recibiendo pedidos ahora.");
    }
    // RF-25 E3: el pedido es para ahora; sin franjas configuradas no se bloquea.
    if (!horarios.abiertoSiTieneFranjas(negocio.getId(), Instant.now())) {
      throw new IllegalArgumentException(
          "Este negocio está cerrado ahora. Revisá sus horarios y volvé cuando abra.");
    }
    var lineas = new ArrayList<Pedido.Linea>();
    for (var pedida : req.items()) {
      var item =
          items
              .findById(pedida.itemId())
              .orElseThrow(
                  () ->
                      new ResponseStatusException(
                          HttpStatus.NOT_FOUND, "Ese ítem no existe."));
      if (!item.isActivo()) {
        throw new IllegalArgumentException(
            "El ítem «" + item.getNombre() + "» ya no está publicado.");
      }
      if (!item.isDisponible()) {
        throw new IllegalArgumentException(
            "El ítem «" + item.getNombre() + "» no está disponible ahora.");
      }
      if (!item.getNegocio().getId().equals(negocio.getId())) {
        throw new IllegalArgumentException(
            "El ítem «" + item.getNombre() + "» es de otro negocio.");
      }
      lineas.add(new Pedido.Linea(item, pedida.cantidad()));
    }
    var pedido = pedidos.save(Pedido.crear(cliente, negocio, req.metodoPago(), req.nota(), lineas));
    notificaciones.notificar(negocio.getPropietario().getId(), "PEDIDO_CREADO", "Tenés un pedido nuevo de " + cliente.getNombre() + ".", "PEDIDO", pedido.getId());
    return PedidoDto.PedidoRespuesta.de(pedido);
  }

  /** RF-31: historial según rol y filtro opcional por estado. */
  @Transactional(readOnly = true)
  public List<PedidoDto.PedidoRespuesta> listar(
      Long usuarioId, String rol, String estado) {
    String filtro = limpiar(estado);
    var encontrados =
        switch (rol) {
          case CLIENTE ->
              filtro == null
                  ? pedidos.findByCliente_IdOrderByCreadoEnDesc(usuarioId)
                  : pedidos.findByCliente_IdAndEstadoOrderByCreadoEnDesc(usuarioId, filtro);
          case COMERCIANTE ->
              filtro == null
                  ? pedidos.findByNegocio_Propietario_IdOrderByCreadoEnDesc(usuarioId)
                  : pedidos.findByNegocio_Propietario_IdAndEstadoOrderByCreadoEnDesc(
                      usuarioId, filtro);
          case ADMINISTRADOR ->
              filtro == null
                  ? pedidos.findAllByOrderByCreadoEnDesc()
                  : pedidos.findByEstadoOrderByCreadoEnDesc(filtro);
          default -> throw new AccessDeniedException("No podés ver pedidos.");
        };
    return encontrados.stream().map(PedidoDto.PedidoRespuesta::de).toList();
  }

  /** RF-31 E2: detalle con ítems para el cliente dueño, el negocio dueño o el Administrador. */
  @Transactional(readOnly = true)
  public PedidoDto.PedidoRespuesta detalle(Long usuarioId, String rol, Long pedidoId) {
    return PedidoDto.PedidoRespuesta.de(buscarConAcceso(usuarioId, rol, pedidoId));
  }

  /** RF-27: aceptar, rechazar, marcar listo, completar o cancelar según el rol y §5.1. */
  @Transactional
  public PedidoDto.PedidoRespuesta cambiarEstado(
      Long usuarioId, String rol, Long pedidoId, PedidoDto.AccionRequest req) {
    var pedido = buscarConAcceso(usuarioId, rol, pedidoId);
    String accion = req.accion().trim().toUpperCase(Locale.ROOT);
    switch (accion) {
      case "ACEPTAR" -> {
        exigirComerciante(rol);
        pedido.aceptar();
        notificaciones.notificar(pedido.getCliente().getId(), "PEDIDO_EN_PREPARACION", "Tu pedido en " + pedido.getNegocio().getNombre() + " está en preparación.", "PEDIDO", pedido.getId());
      }
      case "RECHAZAR" -> {
        exigirComerciante(rol);
        pedido.rechazar(req.motivo());
        pagos.reembolsarPedido(pedido.getId());
        notificaciones.notificar(pedido.getCliente().getId(), "PEDIDO_RECHAZADO", "Tu pedido en " + pedido.getNegocio().getNombre() + " fue rechazado: " + pedido.getMotivo(), "PEDIDO", pedido.getId());
      }
      case "MARCAR_LISTO" -> {
        exigirComerciante(rol);
        pedido.marcarListo();
        notificaciones.notificar(pedido.getCliente().getId(), "PEDIDO_LISTO", "Tu pedido en " + pedido.getNegocio().getNombre() + " está listo para retirar.", "PEDIDO", pedido.getId());
      }
      case "COMPLETAR" -> {
        exigirComerciante(rol);
        pedido.completar();
        notificaciones.notificar(pedido.getCliente().getId(), "PEDIDO_COMPLETADO", "Tu pedido en " + pedido.getNegocio().getNombre() + " quedó completado. ¡Gracias!", "PEDIDO", pedido.getId());
      }
      case "CANCELAR" -> {
        if (COMERCIANTE.equals(rol)) {
          pedido.cancelar(req.motivo());
        } else if (CLIENTE.equals(rol)) {
          pedido.cancelar();
        } else {
          throw new AccessDeniedException("No podés cancelar pedidos.");
        }
        pagos.reembolsarPedido(pedido.getId());
        notificaciones.notificar(pedido.getCliente().getId(), "PEDIDO_CANCELADO", "Tu pedido en " + pedido.getNegocio().getNombre() + " fue cancelado.", "PEDIDO", pedido.getId());
      }
      default -> throw new IllegalArgumentException("Esa acción no existe.");
    }
    return PedidoDto.PedidoRespuesta.de(pedido);
  }

  private Pedido buscarConAcceso(Long usuarioId, String rol, Long pedidoId) {
    var pedido =
        pedidos
            .findById(pedidoId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Ese pedido no existe."));
    boolean permitido =
        switch (rol) {
          case ADMINISTRADOR -> true;
          case CLIENTE -> pedido.getCliente().getId().equals(usuarioId);
          case COMERCIANTE -> pedido.getNegocio().getPropietario().getId().equals(usuarioId);
          default -> false;
        };
    if (!permitido) {
      throw new AccessDeniedException("Ese pedido no es tuyo.");
    }
    return pedido;
  }

  private static void exigirComerciante(String rol) {
    if (!COMERCIANTE.equals(rol)) {
      throw new AccessDeniedException("Solo el comerciante puede hacer esa acción.");
    }
  }

  private static String limpiar(String s) {
    return s == null || s.isBlank() ? null : s.trim();
  }
}
