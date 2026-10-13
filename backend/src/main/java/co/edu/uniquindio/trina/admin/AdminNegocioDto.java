package co.edu.uniquindio.trina.admin;

import co.edu.uniquindio.trina.negocio.Negocio;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

/** DTOs del alta asistida de negocios (RF-47 E3). */
public final class AdminNegocioDto {

  private AdminNegocioDto() {}

  /** El Administrador elige si deja el negocio en revisión o publicado directo. */
  public enum EstadoInicial {
    PENDIENTE,
    APROBADO
  }

  public record AltaRequest(
      @NotNull(message = "Elegí el comerciante") Long comercianteId,
      @NotBlank(message = "Ponéle un nombre al negocio") String nombre,
      Long categoriaId,
      String descripcion,
      String direccion,
      BigDecimal latitud,
      BigDecimal longitud,
      String telefono,
      String whatsapp,
      @NotNull(message = "Elegí el estado inicial") EstadoInicial estadoInicial) {}

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
