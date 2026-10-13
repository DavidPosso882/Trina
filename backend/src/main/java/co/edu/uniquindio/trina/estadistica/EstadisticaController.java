package co.edu.uniquindio.trina.estadistica;

import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Estadísticas (RF-40 a RF-42): el Comerciante ve solo su negocio (aislamiento por dueño) y el
 * Administrador el panel global. Los roles se exigen por {@code @PreAuthorize} (403 ajeno).
 */
@RestController
public class EstadisticaController {

  private final EstadisticaService servicio;

  public EstadisticaController(EstadisticaService servicio) {
    this.servicio = servicio;
  }

  private Long sesionId() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    return (Long) auth.getPrincipal();
  }

  @GetMapping("/api/v1/mi-negocio/estadisticas")
  @PreAuthorize("hasRole('COMERCIANTE')")
  public EstadisticaDto.Resumen resumen(@RequestParam(defaultValue = "7") int dias) {
    return servicio.resumen(sesionId(), dias);
  }

  @GetMapping("/api/v1/mi-negocio/productos-mas-vistos")
  @PreAuthorize("hasRole('COMERCIANTE')")
  public List<EstadisticaDto.ItemRanking> masVistos(
      @RequestParam(defaultValue = "7") int dias,
      @RequestParam(defaultValue = "5") int limite) {
    return servicio.productosMasVistos(sesionId(), dias, limite);
  }

  @GetMapping("/api/v1/admin/estadisticas")
  @PreAuthorize("hasRole('ADMINISTRADOR')")
  public EstadisticaDto.PanelAdmin panelAdmin() {
    return servicio.panelAdmin();
  }
}
