package co.edu.uniquindio.trina.usuario;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Cuenta propia del titular (RF-48/RF-49). Base /api/v1/me: editar, cambiar clave, exportar y
 * eliminar. Todos exigen sesión (401 sin token válido, §5.9).
 */
@RestController
@RequestMapping("/api/v1/me")
public class CuentaController {

  private final CuentaService servicio;

  public CuentaController(CuentaService servicio) {
    this.servicio = servicio;
  }

  @PatchMapping
  public CuentaDto.CuentaResponse editar(@Valid @RequestBody CuentaDto.EditarRequest req) {
    return aRespuesta(servicio.editar(usuarioActual(), req));
  }

  @PostMapping("/cambiar-clave")
  public ResponseEntity<Void> cambiarClave(@Valid @RequestBody CuentaDto.CambiarClaveRequest req) {
    servicio.cambiarClave(usuarioActual(), req.actual(), req.nueva());
    return ResponseEntity.ok().build();
  }

  @GetMapping("/datos")
  public CuentaDto.DatosResponse datos() {
    return servicio.datos(usuarioActual());
  }

  @DeleteMapping
  public ResponseEntity<Void> eliminar() {
    servicio.eliminar(usuarioActual());
    return ResponseEntity.noContent().build();
  }

  private Long usuarioActual() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    if (auth == null || !(auth.getPrincipal() instanceof Long id)) {
      throw new BadCredentialsException("Iniciá sesión");
    }
    return id;
  }

  private CuentaDto.CuentaResponse aRespuesta(Usuario u) {
    return new CuentaDto.CuentaResponse(
        u.getId(), u.getEmail(), u.getNombre(), u.getTelefono(), u.getRol());
  }
}
