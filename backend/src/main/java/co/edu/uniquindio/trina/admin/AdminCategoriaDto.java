package co.edu.uniquindio.trina.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** DTOs de categorías de negocio (RF-44). */
public final class AdminCategoriaDto {

  private AdminCategoriaDto() {}

  public record CategoriaRequest(
      @NotBlank(message = "Escribí el nombre") String nombre, String icono, Integer orden) {}

  public record EstadoRequest(
      @NotNull(message = "Indicá si la categoría queda activa.") Boolean activa) {}

  public record CategoriaRespuesta(
      Long id, String nombre, String icono, Integer orden, boolean activa) {}
}
