package co.edu.uniquindio.trina.negocio;

import jakarta.validation.constraints.NotBlank;
import java.math.BigDecimal;

/** DTOs de gestión del negocio propio (RF-06/RF-11). */
public final class NegocioGestionDto {

  private NegocioGestionDto() {}

  public record CrearRequest(
      @NotBlank(message = "Ponéle un nombre a tu negocio") String nombre, Long categoriaId) {}

  public record ActualizarRequest(
      String nombre,
      Long categoriaId,
      String descripcion,
      String direccion,
      BigDecimal latitud,
      BigDecimal longitud,
      String telefono,
      String whatsapp) {}

  public record Respuesta(
      Long id,
      String nombre,
      String categoria,
      String estado,
      String motivoRevision,
      String descripcion,
      String direccion,
      BigDecimal latitud,
      BigDecimal longitud,
      String telefono,
      String whatsapp) {
    static Respuesta de(Negocio n) {
      return new Respuesta(
          n.getId(),
          n.getNombre(),
          n.getCategoria() == null ? null : n.getCategoria().getNombre(),
          n.getEstado(),
          n.getMotivoRevision(),
          n.getDescripcion(),
          n.getDireccion(),
          n.getLatitud(),
          n.getLongitud(),
          n.getTelefono(),
          n.getWhatsapp());
    }
  }
}
