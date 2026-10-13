package co.edu.uniquindio.trina.pedido;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

/**
 * Pedidos para recoger (RF-25, RF-27, RF-31). El Cliente crea y consulta los propios; el
 * Comerciante gestiona los de su negocio; el Administrador ve todo. La propiedad se verifica en el
 * servicio (403 ajeno).
 */
@RestController
@RequestMapping("/api/v1/pedidos")
public class PedidoController {

  private final PedidoService servicio;

  public PedidoController(PedidoService servicio) {
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

  @PostMapping
  @ResponseStatus(HttpStatus.CREATED)
  @PreAuthorize("hasRole('CLIENTE')")
  public PedidoDto.PedidoRespuesta crear(
      @Valid @RequestBody PedidoDto.CrearPedidoRequest req) {
    return servicio.crear(sesion().id(), req);
  }

  @GetMapping
  public List<PedidoDto.PedidoRespuesta> listar(
      @RequestParam(required = false) String estado) {
    var s = sesion();
    return servicio.listar(s.id(), s.rol(), estado);
  }

  @GetMapping("/{id}")
  public PedidoDto.PedidoRespuesta detalle(@PathVariable Long id) {
    var s = sesion();
    return servicio.detalle(s.id(), s.rol(), id);
  }

  @PatchMapping("/{id}/estado")
  @PreAuthorize("hasAnyRole('CLIENTE','COMERCIANTE')")
  public PedidoDto.PedidoRespuesta cambiarEstado(
      @PathVariable Long id, @Valid @RequestBody PedidoDto.AccionRequest req) {
    var s = sesion();
    return servicio.cambiarEstado(s.id(), s.rol(), id, req);
  }
}
