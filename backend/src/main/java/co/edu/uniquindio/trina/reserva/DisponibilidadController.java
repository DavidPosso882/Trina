package co.edu.uniquindio.trina.reserva;

import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;

/**
 * Disponibilidad pública (RF-26): franjas de una hora entre las 8:00 y las 20:00 en
 * {@code America/Bogota}. Simplificación: la grilla es fija de una hora y no depende de la
 * duración del negocio ni del horario de atención (la entidad Horario aún no existe).
 */
@RestController
@RequestMapping("/api/v1/negocios")
public class DisponibilidadController {

  private final ReservaService servicio;

  public DisponibilidadController(ReservaService servicio) {
    this.servicio = servicio;
  }

  @GetMapping("/{id}/disponibilidad")
  public ReservaDto.DisponibilidadRespuesta disponibilidad(
      @PathVariable Long id,
      @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha) {
    return servicio.disponibilidad(id, fecha);
  }
}
