package co.edu.uniquindio.trina.admin;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

/** RF-45: parámetros del sistema para el Administrador. */
@RestController
@RequestMapping("/api/v1/admin/parametros")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class AdminParametroController {

  private final AdminParametroService servicio;

  public AdminParametroController(AdminParametroService servicio) {
    this.servicio = servicio;
  }

  @GetMapping
  public List<AdminParametroDto.ParametroRespuesta> listar() {
    return servicio.listar();
  }

  @PutMapping("/{clave}")
  public AdminParametroDto.ParametroRespuesta actualizar(
      @AuthenticationPrincipal Long actorId,
      @PathVariable String clave,
      @Valid @RequestBody AdminParametroDto.ParametroRequest req) {
    return servicio.actualizar(actorId, clave, req.valor());
  }
}
