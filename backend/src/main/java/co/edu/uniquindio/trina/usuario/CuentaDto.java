package co.edu.uniquindio.trina.usuario;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.time.Instant;
import java.util.List;

/** DTOs de cuenta propia y privacidad del titular (RF-48/RF-49). */
public final class CuentaDto {

  private CuentaDto() {}

  /** PATCH /me: actualización parcial; los campos nulos no se tocan. */
  public record EditarRequest(String nombre, String telefono) {}

  public record CambiarClaveRequest(
      @NotBlank(message = "Escribí tu contraseña actual") String actual,
      @NotBlank(message = "Elegí una contraseña")
          @Pattern(
              regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
              message = "La contraseña necesita mínimo 8 caracteres, con letras y números")
          String nueva) {}

  public record CuentaResponse(Long id, String email, String nombre, String telefono, String rol) {}

  public record PedidoResumen(
      Long id, String negocio, String estado, int totalCop, Instant creadoEn) {}

  public record ReservaResumen(
      Long id, String negocio, String estado, Instant inicio, Instant fin, int personas) {}

  /** Resumen del negocio propio del Comerciante (RF-48 E1). */
  public record NegocioResumen(Long id, String nombre, String estado) {}

  /** Exportación de datos personales y actividad (RF-48 E1). */
  public record DatosResponse(
      Long id,
      String email,
      String nombre,
      String telefono,
      String rol,
      Boolean esResidente,
      String versionConsentimiento,
      Instant consentimientoEn,
      List<PedidoResumen> pedidos,
      List<ReservaResumen> reservas,
      NegocioResumen negocio) {}

  /** RF-48: texto y versión vigente de la política de tratamiento de datos. */
  public record PoliticaResponse(String version, String texto) {}
}
