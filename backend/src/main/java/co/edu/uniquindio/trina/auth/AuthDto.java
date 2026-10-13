package co.edu.uniquindio.trina.auth;

import jakarta.validation.constraints.*;
import java.util.Optional;

/** DTOs de autenticación con mensajes para el usuario final (RNF-01). */
public final class AuthDto {

  private AuthDto() {}

  public record RegistroRequest(
      @NotBlank(message = "Escribí tu correo") @Email(message = "Ese correo no parece válido") String email,
      @NotBlank(message = "Elegí una contraseña")
          @Pattern(
              regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
              message = "La contraseña necesita mínimo 8 caracteres, con letras y números")
          String password,
      @NotBlank(message = "Escribí tu nombre") String nombre,
      @NotBlank(message = "Elegí un rol")
          @Pattern(regexp = "CLIENTE|COMERCIANTE", message = "Ese rol no está permitido")
          String rol,
      @AssertTrue(message = "Necesitás aceptar la política de datos para continuar")
          boolean consentimiento,
      Optional<Boolean> esResidente) {}

  public record LoginRequest(
      @NotBlank String email,
      @NotBlank String password) {}

  public record RecuperarClaveRequest(
      @NotBlank(message = "Escribí tu correo") @Email(message = "Ese correo no parece válido") String email) {}

  public record RestablecerClaveRequest(
      @NotBlank(message = "El enlace no es válido") String token,
      @NotBlank(message = "Elegí una contraseña")
          @Pattern(
              regexp = "^(?=.*[A-Za-z])(?=.*\\d).{8,}$",
              message = "La contraseña necesita mínimo 8 caracteres, con letras y números")
          String nuevaClave) {}

  public record AuthResponse(String token, String rol) {}

  public record CuentaResponse(Long id, String email, String nombre, String rol) {}
}
