package co.edu.uniquindio.trina.admin;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** RF-44: ABM de categorías de negocio (solo ADMINISTRADOR). */
@RestController
@RequestMapping("/api/v1/admin/categorias")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class AdminCategoriaController {

  private final AdminCategoriaService servicio;

  public AdminCategoriaController(AdminCategoriaService servicio) {
    this.servicio = servicio;
  }

  /** Lista completa (incluye inactivas) para el panel. */
  @GetMapping
  public List<AdminCategoriaDto.CategoriaRespuesta> listar() {
    return servicio.todas();
  }

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  public AdminCategoriaDto.CategoriaRespuesta crear(
      @AuthenticationPrincipal Long actorId,
      @Valid @RequestBody AdminCategoriaDto.CategoriaRequest req) {
    return servicio.crear(actorId, req);
  }

  @PutMapping("/{id}")
  public AdminCategoriaDto.CategoriaRespuesta editar(
      @AuthenticationPrincipal Long actorId,
      @PathVariable Long id,
      @Valid @RequestBody AdminCategoriaDto.CategoriaRequest req) {
    return servicio.editar(actorId, id, req);
  }

  @PatchMapping("/{id}/estado")
  public AdminCategoriaDto.CategoriaRespuesta cambiarEstado(
      @AuthenticationPrincipal Long actorId,
      @PathVariable Long id,
      @Valid @RequestBody AdminCategoriaDto.EstadoRequest req) {
    return servicio.cambiarEstado(actorId, id, req.activa());
  }
}
