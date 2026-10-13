package co.edu.uniquindio.trina.negocio;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;

/** DTO de revisión de negocios por el Administrador (RF-07, diseño §5.4). */
public final class NegocioRevisionDto {

  private NegocioRevisionDto() {}

  /** Acciones del Administrador sobre el estado de un negocio (diseño §5.4). */
  public enum Accion {
    APROBAR,
    RECHAZAR,
    SOLICITAR_CORRECCION,
    SUSPENDER,
    REACTIVAR;

    public boolean exigeMotivo() {
      return this == RECHAZAR || this == SOLICITAR_CORRECCION || this == SUSPENDER;
    }
  }

  public record CambiarEstadoRequest(
      @NotNull(message = "Elegí qué hacer con el negocio.") Accion accion, String motivo) {

    @AssertTrue(message = "Contanos el motivo de esta decisión.")
    public boolean isMotivoCargado() {
      return accion == null || !accion.exigeMotivo() || (motivo != null && !motivo.isBlank());
    }
  }
}
