package co.edu.uniquindio.trina.catalogo;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import java.util.List;

/** DTOs del catálogo digital (RF-15 a RF-18). */
public final class CatalogoDto {

  private CatalogoDto() {}

  public record ItemRequest(
      @NotBlank(message = "Ponéle un nombre al ítem") String nombre,
      @NotNull(message = "Indicá el precio")
          @Positive(message = "El precio tiene que ser mayor que cero")
          Integer precioCop,
      String descripcion,
      @Pattern(regexp = "producto|servicio", message = "El tipo tiene que ser producto o servicio")
          String tipo,
      Long categoriaId,
      String claveImagen) {}

  public record CategoriaRequest(
      @NotBlank(message = "Ponéle un nombre a la categoría") String nombre, Integer orden) {}

  public record DisponibilidadRequest(
      @NotNull(message = "Indicá si el ítem está disponible") Boolean disponible) {}

  public record ItemRespuesta(
      Long id,
      Long categoriaId,
      String tipo,
      String nombre,
      String descripcion,
      int precioCop,
      String claveImagen,
      boolean disponible,
      boolean destacado,
      boolean activo) {
    static ItemRespuesta de(CatalogoItem i) {
      return new ItemRespuesta(
          i.getId(),
          i.getCategoria() == null ? null : i.getCategoria().getId(),
          i.getTipo(),
          i.getNombre(),
          i.getDescripcion(),
          i.getPrecioCop(),
          i.getClaveImagen(),
          i.isDisponible(),
          i.isDestacado(),
          i.isActivo());
    }
  }

  public record CategoriaRespuesta(Long id, String nombre, int orden) {
    static CategoriaRespuesta de(CatalogoCategoria c) {
      return new CategoriaRespuesta(c.getId(), c.getNombre(), c.getOrden());
    }
  }

  public record GrupoCategoria(CategoriaRespuesta categoria, List<ItemRespuesta> items) {}

  public record CatalogoPublico(
      Long negocioId,
      String negocio,
      List<GrupoCategoria> categorias,
      List<ItemRespuesta> sinCategoria) {}
}
