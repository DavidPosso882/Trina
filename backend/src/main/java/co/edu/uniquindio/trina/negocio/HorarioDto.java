package co.edu.uniquindio.trina.negocio;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/** DTOs de horarios de atención (RF-13). */
public final class HorarioDto {

  private HorarioDto() {}

  private static final String HORA = "^(?:[01]\\d|2[0-3]):[0-5]\\d$";

  public record FranjaRequest(
      @NotNull(message = "Elegí el día de cada franja")
          @Min(value = 1, message = "El día va del 1 (lunes) al 7 (domingo)")
          @Max(value = 7, message = "El día va del 1 (lunes) al 7 (domingo)")
          Integer diaSemana,
      @NotBlank(message = "Poné la hora de apertura")
          @Pattern(regexp = HORA, message = "Usá horas HH:mm")
          String abre,
      @NotBlank(message = "Poné la hora de cierre")
          @Pattern(regexp = HORA, message = "Usá horas HH:mm")
          String cierra) {}

  public record FranjaRespuesta(int diaSemana, String abre, String cierra) {
    static FranjaRespuesta de(HorarioAtencion h) {
      return new FranjaRespuesta(h.getDiaSemana(), h.getAbre().toString(), h.getCierra().toString());
    }
  }
}
