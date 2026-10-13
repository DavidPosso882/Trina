package co.edu.uniquindio.trina.negocio;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Min;

/** DTOs de fotografías del negocio (RF-12). */
public final class ImagenNegocioDto {

  private ImagenNegocioDto() {}

  public record ImagenRespuesta(
      Long id, String url, String urlMiniatura, boolean principal, int orden) {}

  /** PATCH: exactamente uno de {@code principal=true} u {@code orden}. */
  public record ActualizarRequest(
      Boolean principal,
      @Min(value = 0, message = "El orden no puede ser negativo") Integer orden) {

    @AssertTrue(message = "Indicá si la foto es principal o su nuevo orden.")
    public boolean isCambioValido() {
      return (principal != null) ^ (orden != null);
    }

    @AssertTrue(message = "Solo podés marcar una foto como principal.")
    public boolean isPrincipalValido() {
      return principal == null || principal;
    }
  }
}
