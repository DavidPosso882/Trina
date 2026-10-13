package co.edu.uniquindio.trina.reserva;

import co.edu.uniquindio.trina.negocio.HorarioService;
import co.edu.uniquindio.trina.negocio.Negocio;
import co.edu.uniquindio.trina.negocio.NegocioRepository;
import co.edu.uniquindio.trina.notificacion.NotificacionService;
import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Reservas con control de capacidad (RF-26, RF-27; RN-07). Reglas de creación: negocio APROBADO y
 * que acepte reservas, fecha futura, intervalo válido, franja dentro del horario de atención (sin
 * franjas configuradas no se bloquea) y cupo libre contando las reservas activas superpuestas
 * (PENDIENTE_CONFIRMACION o CONFIRMADA). La fila del negocio se bloquea con lock pesimista para
 * serializar creaciones simultáneas. Simplificaciones documentadas: la condición "después de la
 * hora de inicio" para completar no se valida, y la disponibilidad pública usa una grilla fija de
 * una hora entre las 8:00 y las 20:00 en {@code America/Bogota}. Sin pago de reservas (D-04); las
 * notificaciones en plataforma (RF-32) se crean dentro de la misma transacción del cambio.
 */
@Service
public class ReservaService {

  private static final String APROBADO = "APROBADO";
  private static final String FRANJA = "FRANJA";
  private static final String ALOJAMIENTO = "ALOJAMIENTO";
  private static final String CLIENTE = "CLIENTE";
  private static final String COMERCIANTE = "COMERCIANTE";
  private static final String ADMINISTRADOR = "ADMINISTRADOR";
  private static final int HORA_APERTURA = 8;
  private static final int HORA_CIERRE = 20;
  private static final long EXPIRA_HORAS = 24;

  private final ReservaRepository reservas;
  private final NegocioRepository negocios;
  private final UsuarioRepository usuarios;
  private final NotificacionService notificaciones;
  private final HorarioService horarios;
  private final ZoneId zona;

  public ReservaService(
      ReservaRepository reservas,
      NegocioRepository negocios,
      UsuarioRepository usuarios,
      NotificacionService notificaciones,
      HorarioService horarios,
      @Value("${app.zona-horaria:America/Bogota}") String zonaHoraria) {
    this.reservas = reservas;
    this.negocios = negocios;
    this.usuarios = usuarios;
    this.notificaciones = notificaciones;
    this.horarios = horarios;
    this.zona = ZoneId.of(zonaHoraria);
  }

  /** RF-26: crea la reserva en PENDIENTE_CONFIRMACION si el negocio la acepta y hay cupo (RN-07). */
  @Transactional
  public ReservaDto.ReservaRespuesta crear(Long clienteId, ReservaDto.CrearReservaRequest req) {
    var cliente =
        usuarios
            .findById(clienteId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Iniciá sesión."));
    var negocio =
        reservas
            .bloquearNegocio(req.negocioId())
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Negocio no publicado."));
    if (!APROBADO.equals(negocio.getEstado())) {
      throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Negocio no publicado.");
    }
    if (!negocio.isAceptaReservas()) {
      throw new IllegalArgumentException("Ese negocio no está recibiendo reservas ahora.");
    }
    if (req.inicio() == null || !req.inicio().isAfter(Instant.now())) {
      throw new IllegalArgumentException("Elegí una fecha y hora futuras para la reserva.");
    }
    Instant fin = calcularFin(negocio, req);
    // RF-26 E2: la franja tiene que caer dentro de la atención; sin franjas no se bloquea.
    if (FRANJA.equals(negocio.getTipoReserva())
        && !horarios.abiertoSiTieneFranjas(negocio.getId(), req.inicio())) {
      throw new IllegalArgumentException(
          "Ese horario está fuera del horario de atención del negocio. Elegí otra hora.");
    }
    if (reservas.contarSuperpuestasActivas(negocio.getId(), req.inicio(), fin)
        >= negocio.getCapacidadReservas()) {
      throw new IllegalStateException("No hay cupo para ese horario. Probá con otra franja.");
    }
    var reserva =
        reservas.save(
            Reserva.crear(cliente, negocio, req.inicio(), fin, req.personas(), req.nota()));
    notificaciones.notificar(negocio.getPropietario().getId(), "RESERVA_CREADA", "Tenés una reserva nueva de " + cliente.getNombre() + ".", "RESERVA", reserva.getId());
    return ReservaDto.ReservaRespuesta.de(reserva);
  }

  /** RF-31: historial según rol y filtro opcional por estado. */
  @Transactional(readOnly = true)
  public List<ReservaDto.ReservaRespuesta> listar(Long usuarioId, String rol, String estado) {
    String filtro = limpiar(estado);
    var encontradas =
        switch (rol) {
          case CLIENTE ->
              filtro == null
                  ? reservas.findByCliente_IdOrderByCreadoEnDesc(usuarioId)
                  : reservas.findByCliente_IdAndEstadoOrderByCreadoEnDesc(usuarioId, filtro);
          case COMERCIANTE ->
              filtro == null
                  ? reservas.findByNegocio_Propietario_IdOrderByCreadoEnDesc(usuarioId)
                  : reservas.findByNegocio_Propietario_IdAndEstadoOrderByCreadoEnDesc(
                      usuarioId, filtro);
          case ADMINISTRADOR ->
              filtro == null
                  ? reservas.findAllByOrderByCreadoEnDesc()
                  : reservas.findByEstadoOrderByCreadoEnDesc(filtro);
          default -> throw new AccessDeniedException("No podés ver reservas.");
        };
    return encontradas.stream().map(ReservaDto.ReservaRespuesta::de).toList();
  }

  /** RF-31 E2: detalle para el cliente dueño, el negocio dueño o el Administrador. */
  @Transactional(readOnly = true)
  public ReservaDto.ReservaRespuesta detalle(Long usuarioId, String rol, Long reservaId) {
    return ReservaDto.ReservaRespuesta.de(buscarConAcceso(usuarioId, rol, reservaId));
  }

  /** RF-27: confirmar, rechazar, completar o cancelar según el rol y §5.1. */
  @Transactional
  public ReservaDto.ReservaRespuesta cambiarEstado(
      Long usuarioId, String rol, Long reservaId, ReservaDto.AccionRequest req) {
    var reserva = buscarConAcceso(usuarioId, rol, reservaId);
    String accion = req.accion().trim().toUpperCase(Locale.ROOT);
    switch (accion) {
      case "CONFIRMAR" -> {
        exigirComerciante(rol);
        reserva.confirmar();
        notificaciones.notificar(reserva.getCliente().getId(), "RESERVA_CONFIRMADA", "Tu reserva en " + reserva.getNegocio().getNombre() + " quedó confirmada.", "RESERVA", reserva.getId());
      }
      case "RECHAZAR" -> {
        exigirComerciante(rol);
        reserva.rechazar(req.motivo());
        notificaciones.notificar(reserva.getCliente().getId(), "RESERVA_RECHAZADA", "Tu reserva en " + reserva.getNegocio().getNombre() + " fue rechazada: " + reserva.getMotivo(), "RESERVA", reserva.getId());
      }
      case "COMPLETAR" -> {
        exigirComerciante(rol);
        reserva.completar();
        notificaciones.notificar(reserva.getCliente().getId(), "RESERVA_COMPLETADA", "Tu reserva en " + reserva.getNegocio().getNombre() + " quedó completada. ¡Gracias!", "RESERVA", reserva.getId());
      }
      case "CANCELAR" -> {
        if (COMERCIANTE.equals(rol)) {
          reserva.cancelar(req.motivo());
        } else if (CLIENTE.equals(rol)) {
          reserva.cancelar();
        } else {
          throw new AccessDeniedException("No podés cancelar reservas.");
        }
        notificaciones.notificar(reserva.getCliente().getId(), "RESERVA_CANCELADA", "Tu reserva en " + reserva.getNegocio().getNombre() + " fue cancelada.", "RESERVA", reserva.getId());
      }
      default -> throw new IllegalArgumentException("Esa acción no existe.");
    }
    return ReservaDto.ReservaRespuesta.de(reserva);
  }

  /**
   * RF-26: disponibilidad pública del día en franjas de una hora (8:00–20:00, America/Bogota).
   * Simplificación: la grilla es fija y no depende de la duración configurada ni del horario de
   * atención real del negocio.
   */
  @Transactional(readOnly = true)
  public ReservaDto.DisponibilidadRespuesta disponibilidad(Long negocioId, LocalDate fecha) {
    var negocio =
        negocios
            .findByIdAndEstado(negocioId, APROBADO)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Negocio no publicado."));
    if (!negocio.isAceptaReservas()) {
      throw new IllegalArgumentException("Ese negocio no está recibiendo reservas ahora.");
    }
    var diaInicio = fecha.atTime(HORA_APERTURA, 0).atZone(zona).toInstant();
    var diaFin = fecha.atTime(HORA_CIERRE, 0).atZone(zona).toInstant();
    var activas = reservas.findSuperpuestasActivas(negocioId, diaInicio, diaFin);
    var franjas = new ArrayList<ReservaDto.FranjaRespuesta>();
    for (int hora = HORA_APERTURA; hora < HORA_CIERRE; hora++) {
      var inicio = fecha.atTime(hora, 0).atZone(zona).toInstant();
      var fin = fecha.atTime(hora + 1, 0).atZone(zona).toInstant();
      long ocupadas =
          activas.stream()
              .filter(r -> r.getInicio().isBefore(fin) && r.getFin().isAfter(inicio))
              .count();
      long libres = Math.max(0, negocio.getCapacidadReservas() - ocupadas);
      franjas.add(
          new ReservaDto.FranjaRespuesta(
              String.format("%02d:00", hora),
              inicio.toString(),
              fin.toString(),
              ocupadas,
              libres,
              ocupadas < negocio.getCapacidadReservas()));
    }
    return new ReservaDto.DisponibilidadRespuesta(
        negocio.getId(),
        fecha.toString(),
        negocio.getTipoReserva(),
        negocio.getCapacidadReservas(),
        negocio.getDuracionReservaMin(),
        franjas);
  }

  /** RF-26 E5: cada 15 minutos cancela las PENDIENTE_CONFIRMACION con más de 24 horas. */
  @Scheduled(fixedDelay = 900_000, initialDelay = 900_000)
  @Transactional
  public void cancelarPendientesVencidas() {
    var limite = Instant.now().minus(EXPIRA_HORAS, ChronoUnit.HOURS);
    for (var reserva :
        reservas.findByEstadoAndCreadoEnBefore(Reserva.PENDIENTE_CONFIRMACION, limite)) {
      reserva.expirar();
    }
  }

  private Instant calcularFin(Negocio negocio, ReservaDto.CrearReservaRequest req) {
    if (ALOJAMIENTO.equals(negocio.getTipoReserva())) {
      if (req.fin() == null) {
        throw new IllegalArgumentException("Indicá la fecha de salida.");
      }
      if (!req.fin().isAfter(req.inicio())) {
        throw new IllegalArgumentException("La salida tiene que ser posterior a la entrada.");
      }
      return req.fin();
    }
    if (!FRANJA.equals(negocio.getTipoReserva())) {
      throw new IllegalArgumentException("Ese negocio no tiene un tipo de reserva válido.");
    }
    // FRANJA: el negocio define la duración desde el inicio; el horario se validó en crear().
    return req.inicio().plus(negocio.getDuracionReservaMin(), ChronoUnit.MINUTES);
  }

  private Reserva buscarConAcceso(Long usuarioId, String rol, Long reservaId) {
    var reserva =
        reservas
            .findById(reservaId)
            .orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Esa reserva no existe."));
    boolean permitido =
        switch (rol) {
          case ADMINISTRADOR -> true;
          case CLIENTE -> reserva.getCliente().getId().equals(usuarioId);
          case COMERCIANTE -> reserva.getNegocio().getPropietario().getId().equals(usuarioId);
          default -> false;
        };
    if (!permitido) {
      throw new AccessDeniedException("Esa reserva no es tuya.");
    }
    return reserva;
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
