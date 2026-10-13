package co.edu.uniquindio.trina.admin;

import co.edu.uniquindio.trina.usuario.Usuario;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** DTOs de administración de usuarios (RF-43 y RF-47). */
public final class AdminUsuarioDto {

  private AdminUsuarioDto() {}

  public record EstadoRequest(
      @NotNull(message = "Indicá si la cuenta queda activa.") Boolean activo) {}

  public record RolRequest(@NotBlank(message = "Elegí el rol.") String rol) {}

  public record ComercianteRequest(
      @NotBlank(message = "Escribí el correo")
          @Email(message = "Ese correo no parece válido")
          String email,
      @NotBlank(message = "Escribí el nombre") String nombre,
      String telefono) {}

  public record UsuarioRespuesta(
      Long id,
      String email,
      String nombre,
      String telefono,
      String rol,
      boolean activo,
      boolean cambioClaveObligatorio) {
    static UsuarioRespuesta de(Usuario u) {
      return new UsuarioRespuesta(
          u.getId(),
          u.getEmail(),
          u.getNombre(),
          u.getTelefono(),
          u.getRol(),
          u.isActivo(),
          u.isCambioClaveObligatorio());
    }
  }

  /** La clave temporal viaja una única vez en esta respuesta (RF-47 E1). */
  public record ComercianteCreado(
      Long id, String email, String nombre, String rol, String claveTemporal) {}
}
