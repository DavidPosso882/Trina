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
      @NotNull(message = "Elige el comerciante") Long comercianteId,
      @NotBlank(message = "Ponle un nombre al negocio") String nombre,
      Long categoriaId,
      String descripcion,
      String direccion,
      BigDecimal latitud,
      BigDecimal longitud,
      String telefono,
      String whatsapp,
      @NotNull(message = "Elige el estado inicial") EstadoInicial estadoInicial,
      @jakarta.validation.constraints.Pattern(
              regexp = "FRANJA|ALOJAMIENTO",
              message = "El tipo de reserva tiene que ser FRANJA o ALOJAMIENTO")
          String tipoReserva,
      @jakarta.validation.constraints.Min(value = 1, message = "La capacidad tiene que ser al menos 1 persona")
          @jakarta.validation.constraints.Max(value = 500, message = "La capacidad no puede superar 500 personas")
          Integer capacidadReservas,
      @jakarta.validation.constraints.Min(value = 15, message = "La duración mínima es 15 minutos")
          @jakarta.validation.constraints.Max(value = 720, message = "La duración máxima es 720 minutos")
          Integer duracionReservaMin) {}

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
