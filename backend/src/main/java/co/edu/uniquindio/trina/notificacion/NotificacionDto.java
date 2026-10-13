package co.edu.uniquindio.trina.notificacion;

import java.time.Instant;
import java.util.List;

/** DTOs de notificaciones en plataforma (RF-32). */
public final class NotificacionDto {

  private NotificacionDto() {}

  public record Respuesta(
      Long id,
      String tipo,
      String mensaje,
      String entidadTipo,
      Long entidadId,
      boolean leida,
      Instant creadoEn) {
    static Respuesta de(Notificacion n) {
      return new Respuesta(
          n.getId(),
          n.getTipo(),
          n.getMensaje(),
          n.getEntidadTipo(),
          n.getEntidadId(),
          n.isLeida(),
          n.getCreadoEn());
    }
  }

  /** Contador de la campana; el frontend lo consulta periódicamente (RF-32). */
  public record ContadorRespuesta(long noLeidas) {}

  static List<Respuesta> de(List<Notificacion> notificaciones) {
    return notificaciones.stream().map(Respuesta::de).toList();
  }
}
