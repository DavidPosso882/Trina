package co.edu.uniquindio.trina.membresia;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/** Membresías (RF-33 a RF-37). Planes públicos; suscripción y vigencia solo para el Comerciante. */
@RestController
@RequestMapping("/api/v1/membresias")
public class MembresiaController {

  private final MembresiaService servicio;

  public MembresiaController(MembresiaService servicio) {
    this.servicio = servicio;
  }

  private Long sesionId() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    return (Long) auth.getPrincipal();
  }

  @GetMapping("/planes")
  public List<MembresiaDto.PlanRespuesta> planes() {
    return servicio.planes();
  }

  @PostMapping("/suscripciones")
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasRole('COMERCIANTE')")
  public MembresiaDto.SuscripcionRespuesta solicitar() {
    return servicio.solicitarDestacada(sesionId());
  }

  @GetMapping("/mi-suscripcion")
  @PreAuthorize("hasRole('COMERCIANTE')")
  public MembresiaDto.SuscripcionRespuesta miSuscripcion() {
    return servicio.miSuscripcion(sesionId());
  }
}
