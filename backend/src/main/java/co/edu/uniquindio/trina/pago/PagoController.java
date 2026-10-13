package co.edu.uniquindio.trina.pago;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

/**
 * Pago simulado (RF-28/RF-29): el Cliente cobra sus pedidos con una clave de idempotencia y cada
 * uno ve los pagos que le corresponden. La propiedad se verifica en el servicio (403 ajeno).
 */
@RestController
@RequestMapping("/api/v1/pagos")
public class PagoController {

  public static final String CLAVE_IDEMPOTENCIA = "Idempotency-Key";

  private final PagoService servicio;

  public PagoController(PagoService servicio) {
    this.servicio = servicio;
  }

  private record Sesion(Long id, String rol) {}

  private Sesion sesion() {
    var auth = SecurityContextHolder.getContext().getAuthentication();
    String rol =
        auth.getAuthorities().stream()
            .findFirst()
            .map(a -> a.getAuthority().replace("ROLE_", ""))
            .orElse("");
    return new Sesion((Long) auth.getPrincipal(), rol);
  }

  /**
   * RF-28/RF-34: el Cliente cobra un pedido y el Comerciante su suscripción Destacada. El destino
   * es `pedidoId` o `suscripcionId` (uno solo); el servicio valida la propiedad (403 ajeno).
   */
  @PostMapping
  @PreAuthorize("hasAnyRole('CLIENTE','COMERCIANTE')")
  public PagoDto.CobroRespuesta cobrar(
      @RequestHeader(value = CLAVE_IDEMPOTENCIA, required = false) String claveIdempotencia,
      @Valid @RequestBody PagoDto.CobroRequest req) {
    if (claveIdempotencia == null || claveIdempotencia.isBlank()) {
      throw new ResponseStatusException(
          HttpStatus.BAD_REQUEST, "Falta la clave de idempotencia del pago.");
    }
    return servicio.cobrar(sesion().id(), req, claveIdempotencia);
  }

  @GetMapping("/{id}")
  public PagoDto.PagoRespuesta detalle(@PathVariable Long id) {
    var s = sesion();
    return servicio.detalle(s.id(), s.rol(), id);
  }
}
