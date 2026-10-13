package co.edu.uniquindio.trina.admin;

import jakarta.validation.constraints.NotBlank;

/** DTOs de parámetros del sistema (RF-45). */
public final class AdminParametroDto {

  private AdminParametroDto() {}

  public record ParametroRequest(@NotBlank(message = "Escribí el valor") String valor) {}

  public record ParametroRespuesta(String clave, String valor, String descripcion) {}
}
