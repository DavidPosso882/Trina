package co.edu.uniquindio.trina.negocio;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Horarios de atención (RF-13): el dueño reemplaza las franjas completas y cualquiera lee las de un
 * negocio APROBADO. Día sin filas = cerrado.
 */
@RestController
public class HorarioController {

  private final HorarioService servicio;

  public HorarioController(HorarioService servicio) {
    this.servicio = servicio;
  }

  @PutMapping("/api/v1/negocios/{id}/horarios")
  @PreAuthorize("hasRole('COMERCIANTE')")
  public List<HorarioDto.FranjaRespuesta> reemplazar(
      @PathVariable Long id, @Valid @RequestBody List<HorarioDto.@Valid FranjaRequest> franjas) {
    return servicio.reemplazar(sesionId(), id, franjas);
  }

  @GetMapping("/api/v1/negocios/{id}/horarios")
  public List<HorarioDto.FranjaRespuesta> listar(@PathVariable Long id) {
    return servicio.listar(id, sesionIdOpcional());
  }

  private Long sesionId() {
    return (Long) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
  }

  private Long sesionIdOpcional() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();
    return auth != null && auth.getPrincipal() instanceof Long id ? id : null;
  }
}
