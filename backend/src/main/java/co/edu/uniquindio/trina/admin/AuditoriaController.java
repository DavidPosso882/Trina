package co.edu.uniquindio.trina.admin;

import java.time.LocalDate;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** RF-46: consulta de la bitácora administrativa con filtros y paginación simple. */
@RestController
@RequestMapping("/api/v1/admin/auditoria")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class AuditoriaController {

  private final AuditoriaService servicio;

  public AuditoriaController(AuditoriaService servicio) {
    this.servicio = servicio;
  }

  @GetMapping
  public AuditoriaDto.Pagina listar(
      @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fecha,
      @RequestParam(required = false) String desde,
      @RequestParam(required = false) String hasta,
      @RequestParam(required = false) Long usuarioId,
      @RequestParam(required = false) String entidad,
      @RequestParam(defaultValue = "0") int page,
      @RequestParam(defaultValue = "20") int size) {
    return servicio.listar(fecha, desde, hasta, usuarioId, entidad, page, size);
  }
}
