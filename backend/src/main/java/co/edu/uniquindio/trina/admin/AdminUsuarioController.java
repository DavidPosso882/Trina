package co.edu.uniquindio.trina.admin;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** RF-43/RF-47: panel de usuarios del Administrador. */
@RestController
@RequestMapping("/api/v1/admin/usuarios")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class AdminUsuarioController {

  private final AdminUsuarioService servicio;

  public AdminUsuarioController(AdminUsuarioService servicio) {
    this.servicio = servicio;
  }

  @GetMapping
  public List<AdminUsuarioDto.UsuarioRespuesta> listar(
      @RequestParam(required = false) String rol,
      @RequestParam(required = false) Boolean activo,
      @RequestParam(required = false) String q) {
    return servicio.listar(rol, activo, q);
  }

  @PatchMapping("/{id}/estado")
  public AdminUsuarioDto.UsuarioRespuesta cambiarEstado(
      @AuthenticationPrincipal Long actorId,
      @PathVariable Long id,
      @Valid @RequestBody AdminUsuarioDto.EstadoRequest req) {
    return servicio.cambiarEstado(actorId, id, req.activo());
  }

  @PatchMapping("/{id}/rol")
  public AdminUsuarioDto.UsuarioRespuesta cambiarRol(
      @AuthenticationPrincipal Long actorId,
      @PathVariable Long id,
      @Valid @RequestBody AdminUsuarioDto.RolRequest req) {
    return servicio.cambiarRol(actorId, id, req.rol());
  }

  /** RF-47 E1: alta asistida con clave temporal que se devuelve una única vez. */
  @PostMapping("/comerciantes")
  @ResponseStatus(HttpStatus.CREATED)
  public AdminUsuarioDto.ComercianteCreado crearComerciante(
      @AuthenticationPrincipal Long actorId,
      @Valid @RequestBody AdminUsuarioDto.ComercianteRequest req) {
    return servicio.crearComerciante(actorId, req);
  }
}
