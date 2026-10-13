package co.edu.uniquindio.trina.negocio;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/** Gestión del negocio propio (RF-06/RF-11). Todo exige rol COMERCIANTE y propiedad del recurso. */
@RestController
public class NegocioGestionController {

  private final NegocioGestionService servicio;

  public NegocioGestionController(NegocioGestionService servicio) {
    this.servicio = servicio;
  }

  private Long sesionId() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    return (Long) auth.getPrincipal();
  }

  @PostMapping("/api/v1/negocios")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasRole('COMERCIANTE')")
  public NegocioGestionDto.Respuesta crear(@Valid @RequestBody NegocioGestionDto.CrearRequest req) {
    return NegocioGestionDto.Respuesta.de(servicio.crear(sesionId(), req.nombre().trim(), req.categoriaId()));
  }

  @PutMapping("/api/v1/negocios/{id}")
  @PreAuthorize("hasRole('COMERCIANTE')")
  public NegocioGestionDto.Respuesta actualizar(
      @PathVariable Long id, @RequestBody NegocioGestionDto.ActualizarRequest req) {
    return NegocioGestionDto.Respuesta.de(servicio.actualizar(sesionId(), id, req));
  }

  @PostMapping("/api/v1/negocios/{id}/enviar-revision")
  @PreAuthorize("hasRole('COMERCIANTE')")
  public NegocioGestionDto.Respuesta enviar(@PathVariable Long id) {
    return NegocioGestionDto.Respuesta.de(servicio.enviarARevision(sesionId(), id));
  }

  @GetMapping("/api/v1/mi-negocio")
  @PreAuthorize("hasRole('COMERCIANTE')")
  public NegocioGestionDto.Respuesta miNegocio() {
    return NegocioGestionDto.Respuesta.de(servicio.miNegocio(sesionId()));
  }
}
