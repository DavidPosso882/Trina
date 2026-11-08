package co.edu.uniquindio.trina.negocio;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import java.math.BigDecimal;

/** DTOs de gestión del negocio propio (RF-06/RF-11). */
public final class NegocioGestionDto {

  private NegocioGestionDto() {}

  public record CrearRequest(
      @NotBlank(message = "Ponle un nombre a tu negocio") String nombre, Long categoriaId) {}

  public record ActualizarRequest(
      String nombre,
      Long categoriaId,
      String descripcion,
      String direccion,
      BigDecimal latitud,
      BigDecimal longitud,
      String telefono,
      String whatsapp,
      @Pattern(
              regexp = "FRANJA|ALOJAMIENTO|NINGUNA",
              message = "El tipo de reserva tiene que ser FRANJA, ALOJAMIENTO o NINGUNA")
          String tipoReserva,
      @Min(value = 1, message = "La capacidad tiene que ser al menos 1 persona")
          @Max(value = 500, message = "La capacidad no puede superar 500 personas")
          Integer capacidadReservas,
      @Min(value = 15, message = "La duración mínima es 15 minutos")
          @Max(value = 720, message = "La duración máxima es 720 minutos")
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
      String whatsapp,
      String tipoReserva,
      int capacidadReservas,
      int duracionReservaMin,
      boolean aceptaReservas) {
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
          n.getWhatsapp(),
          n.getTipoReserva(),
          n.getCapacidadReservas(),
          n.getDuracionReservaMin(),
          n.isAceptaReservas());
    }
  }
}
