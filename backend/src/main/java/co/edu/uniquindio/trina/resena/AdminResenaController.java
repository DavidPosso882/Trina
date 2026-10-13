package co.edu.uniquindio.trina.resena;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** RF-39: cola de reseñas reportadas y moderación de visibilidad del Administrador. */
@RestController
@RequestMapping("/api/v1/admin/resenas")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class AdminResenaController {

  private final ResenaService servicio;

  public AdminResenaController(ResenaService servicio) {
    this.servicio = servicio;
  }

  /** `?reportadas=true` filtra la cola; sin filtro devuelve todas, incluidas las ocultas. */
  @GetMapping
  public List<ResenaDto.ResenaRespuesta> listar(
      @RequestParam(defaultValue = "false") boolean reportadas) {
    return servicio.listarParaAdmin(reportadas);
  }

  /** RF-39 E2: al ocultar, la reseña sale del listado público y del promedio (RN-08). */
  @PatchMapping("/{id}/visibilidad")
  public ResenaDto.ResenaRespuesta cambiarVisibilidad(
      @PathVariable Long id, @Valid @RequestBody ResenaDto.VisibilidadRequest req) {
    return servicio.cambiarVisibilidad(id, req.visible());
  }
}
