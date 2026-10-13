package co.edu.uniquindio.trina.resena;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.Instant;
import java.util.List;

/** DTOs de reseñas y moderación (RF-38/RF-39). */
public final class ResenaDto {

  private ResenaDto() {}

  public record PublicarRequest(
      @Min(value = 1, message = "Elegí una calificación de 1 a 5 estrellas.")
          @Max(value = 5, message = "Elegí una calificación de 1 a 5 estrellas.")
          int calificacion,
      @NotBlank(message = "Contanos qué te pareció el negocio.") String comentario) {}

  /** RF-39 E1: el motivo se valida en el dominio para responder 422 (§5.9). */
  public record ReportarRequest(String motivo) {}

  public record VisibilidadRequest(
      @NotNull(message = "Indicá si la reseña se muestra") Boolean visible) {}

  public record ResenaRespuesta(
      Long id,
      Long negocioId,
      Long clienteId,
      String clienteNombre,
      int calificacion,
      String comentario,
      boolean verificada,
      boolean visible,
      boolean reportada,
      String motivoReporte,
      Instant creadoEn) {
    static ResenaRespuesta de(Resena r) {
      return new ResenaRespuesta(
          r.getId(),
          r.getNegocio().getId(),
          r.getCliente().getId(),
          r.getCliente().getNombre(),
          r.getCalificacion(),
          r.getComentario(),
          r.isVerificada(),
          r.isVisible(),
          r.isReportada(),
          r.getMotivoReporte(),
          r.getCreadoEn());
    }
  }

  /** RF-38/RN-08: listado con el promedio calculado al vuelo solo con las visibles. */
  public record ListadoRespuesta(List<ResenaRespuesta> resenas, Double promedio, int cantidad) {}
}
