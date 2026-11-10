package co.edu.uniquindio.trina.admin;

import co.edu.uniquindio.trina.usuario.Usuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.Map;

/** DTOs de administración de usuarios (RF-43 y RF-47). */
public final class AdminUsuarioDto {

  private AdminUsuarioDto() {}

  public record EstadoRequest(
      @NotNull(message = "Indica si la cuenta queda activa.") Boolean activo) {}

  public record RolRequest(@NotBlank(message = "Elige el rol.") String rol) {}

  public record ComercianteRequest(
      @NotBlank(message = "Escribe el correo")
          @Email(message = "Ese correo no parece válido")
          String email,
      @NotBlank(message = "Escribe el nombre") String nombre,
      String telefono) {}

  public record UsuarioRespuesta(
      Long id,
      String email,
      String nombre,
      String telefono,
      String rol,
      boolean activo,
      boolean cambioClaveObligatorio,
      String bloqueoPorNombre,
      boolean bloqueadoPorMi) {
    static UsuarioRespuesta de(Usuario u) {
      return de(u, null, null);
    }

    static UsuarioRespuesta de(Usuario u, Long actorId, Map<Long, String> nombres) {
      String nombreBloqueo = null;
      if (u.getRevisionBloqueoPor() != null && nombres != null) {
        nombreBloqueo = nombres.getOrDefault(u.getRevisionBloqueoPor(), "Otro administrador");
      }
      boolean mio = actorId != null && actorId.equals(u.getRevisionBloqueoPor());
      return new UsuarioRespuesta(
          u.getId(),
          u.getEmail(),
          u.getNombre(),
          u.getTelefono(),
          u.getRol(),
          u.isActivo(),
          u.isCambioClaveObligatorio(),
          nombreBloqueo,
          mio);
    }
  }

  /** La clave temporal viaja una única vez en esta respuesta (RF-47 E1). */
  public record ComercianteCreado(
      Long id, String email, String nombre, String rol, String claveTemporal) {}
}
