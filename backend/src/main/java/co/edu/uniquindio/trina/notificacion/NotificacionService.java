package co.edu.uniquindio.trina.notificacion;

import co.edu.uniquindio.trina.usuario.UsuarioRepository;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Notificaciones en plataforma (RF-32). {@link #notificar} se llama dentro de la transacción del
 * cambio que la origina (diseño §7.8) y la propiedad se verifica al marcar como leída: una
 * notificación ajena da 403 y una inexistente 404 (§5.9). El correo (E4) queda fuera (P3).
 */
@Service
public class NotificacionService {

  private final NotificacionRepository notificaciones;
  private final UsuarioRepository usuarios;

  public NotificacionService(NotificacionRepository notificaciones, UsuarioRepository usuarios) {
    this.notificaciones = notificaciones;
    this.usuarios = usuarios;
  }

  /** Crea la notificación para el destinatario dentro de la transacción en curso. */
  @Transactional
  public void notificar(
      Long usuarioId, String tipo, String mensaje, String entidadTipo, Long entidadId) {
    notificaciones.save(
        Notificacion.crear(
            usuarios.getReferenceById(usuarioId), tipo, mensaje, entidadTipo, entidadId));
  }

  /** RF-32 E1/E2: lista del usuario, opcionalmente solo las no leídas. */
  @Transactional(readOnly = true)
  public List<NotificacionDto.Respuesta> listar(Long usuarioId, boolean soloNoLeidas) {
    var encontradas =
        soloNoLeidas
            ? notificaciones.findByUsuario_IdAndLeidaFalseOrderByCreadoEnDescIdDesc(usuarioId)
            : notificaciones.findByUsuario_IdOrderByCreadoEnDescIdDesc(usuarioId);
    return NotificacionDto.de(encontradas);
  }

  /** RF-32: cantidad de no leídas para la campana. */
  @Transactional(readOnly = true)
  public NotificacionDto.ContadorRespuesta contador(Long usuarioId) {
    return new NotificacionDto.ContadorRespuesta(
        notificaciones.countByUsuario_IdAndLeidaFalse(usuarioId));
  }

  /** RF-32 E3: marca una notificación propia como leída. */
  @Transactional
  public NotificacionDto.Respuesta marcarLeida(Long usuarioId, Long notificacionId) {
    var notificacion =
        notificaciones
            .findById(notificacionId)
            .orElseThrow(
                () ->
                    new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Esa notificación no existe."));
    if (!notificacion.getUsuario().getId().equals(usuarioId)) {
      throw new AccessDeniedException("Esa notificación no es tuya.");
    }
    notificacion.marcarLeida();
    return NotificacionDto.Respuesta.de(notificacion);
  }

  /** RF-32 E3: marca todas las no leídas del usuario. */
  @Transactional
  public void leerTodas(Long usuarioId) {
    for (var notificacion : notificaciones.findByUsuario_IdAndLeidaFalse(usuarioId)) {
      notificacion.marcarLeida();
    }
  }
}
