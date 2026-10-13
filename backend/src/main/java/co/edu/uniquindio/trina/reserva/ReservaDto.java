package co.edu.uniquindio.trina.reserva;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import java.time.Instant;
import java.util.List;

/** DTOs de reservas (RF-26, RF-27, RF-31) y de la disponibilidad pública simplificada. */
public final class ReservaDto {

  private ReservaDto() {}

  /**
   * RF-26: FRANJA solo necesita {@code inicio} (el fin lo calcula el negocio con su duración);
   * ALOJAMIENTO necesita {@code inicio} (entrada) y {@code fin} (salida).
   */
  public record CrearReservaRequest(
      @NotNull(message = "Indicá el negocio") Long negocioId,
      @NotNull(message = "Indicá cuándo empieza la reserva") Instant inicio,
      Instant fin,
      @NotNull(message = "Indicá cuántas personas")
          @Positive(message = "Tiene que ser al menos una persona")
          Integer personas,
      String nota) {}

  public record AccionRequest(
      @NotBlank(message = "Indicá la acción")
          @Pattern(
              regexp = "CONFIRMAR|RECHAZAR|COMPLETAR|CANCELAR",
              message = "Esa acción no existe")
          String accion,
      String motivo) {}

  public record ReservaRespuesta(
      Long id,
      Long clienteId,
      Long negocioId,
      String negocio,
      String tipoReserva,
      String estado,
      Instant inicio,
      Instant fin,
      int personas,
      String nota,
      String motivo,
      Instant creadoEn) {
    static ReservaRespuesta de(Reserva r) {
      return new ReservaRespuesta(
          r.getId(),
          r.getCliente().getId(),
          r.getNegocio().getId(),
          r.getNegocio().getNombre(),
          r.getNegocio().getTipoReserva(),
          r.getEstado(),
          r.getInicio(),
          r.getFin(),
          r.getPersonas(),
          r.getNota(),
          r.getMotivo(),
          r.getCreadoEn());
    }
  }

  /** Franja de una hora de la grilla pública 8:00–20:00 (simplificación documentada). */
  public record FranjaRespuesta(
      String hora, String inicio, String fin, long ocupadas, long libres, boolean disponible) {}

  public record DisponibilidadRespuesta(
      Long negocioId,
      String fecha,
      String tipoReserva,
      int capacidadReservas,
      int duracionReservaMin,
      List<FranjaRespuesta> franjas) {}
}
