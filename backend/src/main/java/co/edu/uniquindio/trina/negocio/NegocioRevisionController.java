package co.edu.uniquindio.trina.negocio;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

/** Panel administrativo RF-07: cola de negocios y cambios de estado. Solo ADMINISTRADOR. */
@RestController
@RequestMapping("/api/v1/admin/negocios")
@PreAuthorize("hasRole('ADMINISTRADOR')")
public class NegocioRevisionController {

  private final NegocioRevisionService servicio;

  public NegocioRevisionController(NegocioRevisionService servicio) {
    this.servicio = servicio;
  }

  @GetMapping
  public List<NegocioGestionDto.Respuesta> listar(@RequestParam(required = false) String estado) {
    return servicio.listar(estado).stream().map(NegocioGestionDto.Respuesta::de).toList();
  }

  @PatchMapping("/{id}/estado")
  public NegocioGestionDto.Respuesta cambiarEstado(
      @PathVariable Long id, @Valid @RequestBody NegocioRevisionDto.CambiarEstadoRequest req) {
    return NegocioGestionDto.Respuesta.de(servicio.cambiarEstado(id, req));
  }
}
