package co.edu.uniquindio.trina.admin;

import java.time.Instant;
import java.util.List;

/** DTOs de la bitácora de auditoría (RF-46). */
public final class AuditoriaDto {

  private AuditoriaDto() {}

  public record Respuesta(
      Long id,
      Long usuarioId,
      String accion,
      String entidad,
      Long entidadId,
      String detalle,
      String motivo,
      Instant creadoEn) {
    static Respuesta de(Auditoria a) {
      return new Respuesta(
          a.getId(),
          a.getUsuarioId(),
          a.getAccion(),
          a.getEntidad(),
          a.getEntidadId(),
          a.getDetalle(),
          a.getMotivo(),
          a.getCreadoEn());
    }
  }

  public record Pagina(List<Respuesta> contenido, int pagina, int tamano, long total) {}
}
